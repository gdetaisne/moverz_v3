import OpenAI from "openai";
import { PhotoAnalysis, TPhotoAnalysis } from "@/lib/schemas";
import { mapToCatalog, volumeFromDims } from "@/lib/normalize";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache";
import { optimizeImageForAI } from "@/lib/imageOptimization";
import { getAISettings } from "@/lib/settings";

// Client OpenAI initialisé dans la fonction pour éviter les problèmes de build
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function analyzePhotoWithVision(opts: {
  photoId: string;
  imageUrl: string; // local file served or presigned URL
}): Promise<TPhotoAnalysis> {
  const client = getOpenAIClient();

  // Récupérer les paramètres IA configurables
  const aiSettings = getAISettings();

  // Traitement de l'image et vérification du cache
  let imageContent;
  let imageHash: string;
  
  if (opts.imageUrl.startsWith('data:')) {
    // Extraire les données Base64
    const base64Data = opts.imageUrl.split(',')[1] || '';
    const mimeType = opts.imageUrl.split(',')[0].split(':')[1].split(';')[0];
    
    // Convertir en Buffer pour optimisation
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Optimiser l'image pour l'IA
    const optimized = await optimizeImageForAI(imageBuffer);
    imageHash = optimized.hash;
    
    // Vérifier le cache
    const cached = getCachedAnalysis(imageHash);
    if (cached) {
      console.log(`Cache hit for optimized Base64 image ${imageHash.substring(0, 8)}... (${optimized.originalSize}→${optimized.optimizedSize} bytes)`);
      return { ...cached, photo_id: opts.photoId };
    }
    
    // Créer la nouvelle URL Base64 optimisée
    const optimizedBase64 = optimized.buffer.toString('base64');
    imageContent = { type: "image_url" as const, image_url: { url: `data:${mimeType};base64,${optimizedBase64}` } };
    
    console.log(`Processing optimized Base64 image: ${optimized.originalSize}→${optimized.optimizedSize} bytes (${Math.round((1 - optimized.optimizedSize/optimized.originalSize) * 100)}% reduction)`);
    
  } else if (opts.imageUrl.startsWith('http://localhost') || opts.imageUrl.startsWith('/uploads/')) {
    // Ancien système de fichiers (pour compatibilité)
    const fs = await import('fs');
    const path = await import('path');
    const filePath = opts.imageUrl.startsWith('/uploads/') 
      ? path.join(process.cwd(), opts.imageUrl)
      : path.join(process.cwd(), opts.imageUrl.replace('http://localhost:3000', ''));
    
    const imageBuffer = fs.readFileSync(filePath);
    
    // Optimiser l'image
    const optimized = await optimizeImageForAI(imageBuffer);
    imageHash = optimized.hash;
    
    // Vérifier le cache
    const cached = getCachedAnalysis(imageHash);
    if (cached) {
      console.log(`Cache hit for ${imageHash.substring(0, 8)}... (${optimized.originalSize}→${optimized.optimizedSize} bytes)`);
      return { ...cached, photo_id: opts.photoId };
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                     ext === '.png' ? 'image/png' : 'image/webp';
    imageContent = { type: "image_url" as const, image_url: { url: `data:${mimeType};base64,${optimized.buffer.toString('base64')}` } };
    
    console.log(`Processing optimized image: ${optimized.originalSize}→${optimized.optimizedSize} bytes (${Math.round((1 - optimized.optimizedSize/optimized.originalSize) * 100)}% reduction)`);
  } else {
    // Pour les URLs externes, pas d'optimisation ni de cache
    imageContent = { type: "image_url" as const, image_url: { url: opts.imageUrl } };
    imageHash = 'external';
  }

  // Compose vision request (use official SDK chat/vision interface)
  const completion = await client.chat.completions.create({
    model: aiSettings.model,
    temperature: aiSettings.temperature,
    max_tokens: aiSettings.maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: aiSettings.systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: aiSettings.userPrompt },
          imageContent,
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed = JSON.parse(raw);

  // Enforce schema & enrich
  parsed.photo_id = opts.photoId;
  parsed.version = "1.0.0";

  for (const it of parsed.items ?? []) {
    const cat = mapToCatalog(it.label);
    if (cat && (!it.dimensions_cm || !it.dimensions_cm.length || !it.dimensions_cm.width || !it.dimensions_cm.height)) {
      it.dimensions_cm = {
        length: cat.length, width: cat.width, height: cat.height, source: "catalog"
      };
    }
    if (!it.category && cat) it.category = cat.category;
    if (!it.volume_m3 || it.volume_m3 === 0) {
      it.volume_m3 = cat?.volume_m3 ?? volumeFromDims(
        it.dimensions_cm?.length, it.dimensions_cm?.width, it.dimensions_cm?.height
      );
    }
    // Enrichir avec les propriétés du catalogue
    if (cat) {
      if (it.fragile === undefined) it.fragile = cat.fragile ?? false;
      if (it.stackable === undefined) it.stackable = cat.stackable ?? true;
    }
    // Valeurs par défaut
    if (it.fragile === undefined) it.fragile = false;
    if (it.stackable === undefined) it.stackable = true;
  }

  const items = parsed.items ?? [];
  parsed.totals = {
    count_items: items.reduce((s:number,i:any)=> s + (i.quantity ?? 1), 0),
    volume_m3: Number(items.reduce((s:number,i:any)=> s + (i.volume_m3 ?? 0)*(i.quantity ?? 1), 0).toFixed(3)),
  };
  parsed.warnings ??= [];
  parsed.errors ??= [];

  const validated: TPhotoAnalysis = PhotoAnalysis.parse(parsed);
  
  // Mettre en cache le résultat (sauf pour les URLs externes)
  if (imageHash !== 'external') {
    setCachedAnalysis(imageHash, validated);
    console.log(`Cached analysis for ${imageHash.substring(0, 8)}...`);
  }
  
  return validated;
}
