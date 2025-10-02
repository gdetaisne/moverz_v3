import OpenAI from "openai";
import { PhotoAnalysis, TPhotoAnalysis } from "@/lib/schemas";
import { mapToCatalog, volumeFromDims } from "@/lib/normalize";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache";
import { optimizeImageForAI } from "@/lib/imageOptimization";
import { getAISettings } from "@/lib/settings";
import { calculatePackagedVolume } from "@/lib/packaging";
import { calculateDismountableProbability, requiresVisualCheck } from "@/lib/dismountable";

import { getEstimatedDimensions, hasValidDimensions, validateObjectDimensions, calculateVolumeFromDimensions } from './core/measurementUtils';

// Client OpenAI initialisé avec la clé configurée
export function getOpenAIClient(apiKey?: string) {
  // Priorité : clé configurée dans le Back office, puis variable d'environnement
  const key = apiKey || process.env.OPENAI_API_KEY;
  
  if (!key) {
    console.warn("Aucune clé OpenAI configurée - using mock mode");
    return null as any;
  }
  
  console.log("Utilisation de la clé OpenAI configurée");
  return new OpenAI({ apiKey: key });
}

export async function analyzePhotoWithVision(opts: {
  photoId: string;
  imageUrl: string; // local file served or presigned URL
}): Promise<TPhotoAnalysis> {
  // Utiliser directement l'analyse hybride
  try {
    const { analyzePhotoWithOptimizedVision } = await import('./optimizedAnalysis');
    return await analyzePhotoWithOptimizedVision(opts);
  } catch (error) {
    console.warn('Analyse hybride non disponible, utilisation de l\'analyse OpenAI seule:', error);
    return await originalAnalyzePhotoWithVision(opts);
  }
}

// Fonction originale renommée pour le fallback
export async function originalAnalyzePhotoWithVision(opts: {
  photoId: string;
  imageUrl: string; // local file served or presigned URL
  systemPrompt?: string;
  userPrompt?: string;
}): Promise<TPhotoAnalysis> {
  // Récupérer les paramètres IA configurables côté serveur
  let aiSettings;
  try {
    // Import dynamique pour éviter les problèmes de build
    const { getServerAISettings } = await import('@/lib/serverSettings');
    aiSettings = getServerAISettings();
    console.log('Paramètres IA chargés:', {
      model: aiSettings.model,
      temperature: aiSettings.temperature,
      hasApiKey: !!aiSettings.openaiApiKey
    });
  } catch (error) {
    console.warn('Erreur lors de la récupération des paramètres IA côté serveur:', error);
    aiSettings = getAISettings();
  }

  // Utiliser les prompts spécialisés si fournis, sinon utiliser les prompts par défaut
  const systemPrompt = opts.systemPrompt || aiSettings.systemPrompt;
  const userPrompt = opts.userPrompt || aiSettings.userPrompt;

  const client = getOpenAIClient(aiSettings.openaiApiKey);
  
  // Si pas de clé API, retourner une réponse mock avec des données réalistes
  if (!client) {
    // Données mock réalistes pour les tests
    const mockItems = [
      {
        label: "Fauteuil en cuir",
        category: "furniture" as const,
        dimensions_cm: { length: 80, width: 80, height: 90, source: "estimated" as const },
        volume_m3: 0.576,
        quantity: 1,
        confidence: 0.85,
        fragile: false,
        stackable: false,
        notes: "Siège rembourré en cuir"
      },
      {
        label: "Table basse en bois",
        category: "furniture" as const, 
        dimensions_cm: { length: 120, width: 60, height: 40, source: "estimated" as const },
        volume_m3: 0.288,
        quantity: 1,
        confidence: 0.92,
        fragile: false,
        stackable: true,
        notes: "Surface plane en bois"
      },
      {
        label: "Plante en pot",
        category: "misc" as const,
        dimensions_cm: { length: 30, width: 30, height: 80, source: "estimated" as const },
        volume_m3: 0.072,
        quantity: 1,
        confidence: 0.78,
        fragile: true,
        stackable: false,
        notes: "Fragile - attention au transport"
      }
    ];

    return {
      version: "1.0.0",
      photo_id: opts.photoId,
      items: mockItems,
      totals: {
        count_items: mockItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
        volume_m3: Number(mockItems.reduce((sum, item) => sum + (item.volume_m3 || 0) * (item.quantity || 1), 0).toFixed(3))
      },
      special_rules: {
        autres_objets: {
          present: false,
          listed_items: [],
          volume_m3: 0
        }
      },
      warnings: ["Mode démo - données simulées"],
      errors: []
    };
  }

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
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
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
    
    // Vérifier si les dimensions sont valides
    const dimensionsValid = hasValidDimensions(it.dimensions_cm);
    
    if (cat && !dimensionsValid) {
      it.dimensions_cm = {
        length: cat.length, width: cat.width, height: cat.height, source: "catalog"
      };
    } else if (!dimensionsValid && !cat) {
      // Fallback : dimensions estimées basées sur la catégorie
      const estimatedDims = getEstimatedDimensions(it.category || 'misc');
      it.dimensions_cm = {
        length: estimatedDims.length,
        width: estimatedDims.width, 
        height: estimatedDims.height,
        source: "estimated"
      };
    }
    if (!it.category && cat) it.category = cat.category;
    
    // TOUJOURS calculer le volume nous-mêmes à partir des dimensions (plus fiable)
    it.volume_m3 = cat?.volume_m3 ?? calculateVolumeFromDimensions(it.dimensions_cm);
    // Enrichir avec les propriétés du catalogue
    if (cat) {
      if (it.fragile === undefined) it.fragile = cat.fragile ?? false;
      if (it.stackable === undefined) it.stackable = cat.stackable ?? true;
    }
    // Valeurs par défaut
    if (it.fragile === undefined) it.fragile = false;
    if (it.stackable === undefined) it.stackable = true;
    
    // Calculer le volume emballé
    const packagingInfo = calculatePackagedVolume(
      it.volume_m3,
      it.fragile,
      it.category,
      it.dimensions_cm,
      it.dismountable
    );
    it.packaged_volume_m3 = packagingInfo.packagedVolumeM3;
    it.packaging_display = packagingInfo.displayValue;
    it.is_small_object = packagingInfo.isSmallObject;
    it.packaging_calculation_details = packagingInfo.calculationDetails;
    
    // Calculer la démontabilité (approche hybride)
    const dismountableResult = calculateDismountableProbability(
      it.label,
      it.dismountable,
      it.dismountable_confidence
    );
    it.dismountable = dismountableResult.isDismountable;
    it.dismountable_confidence = dismountableResult.confidence;
    it.dismountable_source = dismountableResult.source;
  }

  const items = parsed.items ?? [];
  parsed.totals = {
    count_items: items.reduce((s:number,i:any)=> s + (i.quantity ?? 1), 0),
    volume_m3: Number(items.reduce((s:number,i:any)=> s + (i.volume_m3 ?? 0)*(i.quantity ?? 1), 0).toFixed(3)),
  };
  
  // Gérer les special_rules pour "autres objets"
  if (parsed.special_rules?.autres_objets?.present) {
    // Ajouter le volume des autres objets au total
    parsed.totals.volume_m3 = Number((parsed.totals.volume_m3 + (parsed.special_rules.autres_objets.volume_m3 || 0)).toFixed(3));
    parsed.totals.count_items += parsed.special_rules.autres_objets.listed_items?.length || 0;
  }
  
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
