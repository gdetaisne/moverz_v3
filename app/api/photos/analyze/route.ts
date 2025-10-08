import { NextRequest, NextResponse } from "next/server";
import { savePhotoToFile, saveAsBase64, savePhotoToDatabase } from "@/lib/storage";
import { getUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    console.log(`🚀 [TIMING] Début traitement: ${file.name} (${file.size} bytes) - ${new Date().toISOString()}`);
    
    // ✨ NOUVEAU : Sauvegarder sur disque (pas Base64)
    const saveStart = Date.now();
    const saved = await savePhotoToFile(file);
    const saveTime = Date.now() - saveStart;
    console.log(`💾 [TIMING] Sauvegarde fichier: ${saveTime}ms - ${saved.filename}`);
    
    // Pour l'analyse IA, on a toujours besoin du Base64 temporairement
    const base64Start = Date.now();
    const base64Data = await saveAsBase64(file);
    const base64Time = Date.now() - base64Start;
    console.log(`📦 [TIMING] Conversion Base64: ${base64Time}ms`);
    
    // Import dynamique pour éviter les erreurs de build
    const { detectRoomType } = await import("@/services/roomDetection");

    // 🏠 Détection de pièce IA (analyse séquentielle pour éviter les blocages)
    console.log("🏠 [TIMING] Détection de pièce IA...");
    const aiStart = Date.now();
    // Passer un objet d'analyse vide et l'URL de l'image pour l'analyse directe
    const emptyAnalysis = { items: [], processingTime: 0, aiProvider: "pending", analysisType: "pending" };
    const imageUrl = `data:${base64Data.mimeType};base64,${base64Data.base64}`;
    const roomDetection = await detectRoomType(emptyAnalysis, imageUrl);
    const aiTime = Date.now() - aiStart;
    
    console.log(`✅ [TIMING] Détection pièce IA: ${aiTime}ms - Type: ${roomDetection.roomType}, Confiance: ${roomDetection.confidence}`);
    
    // 🎯 NOUVELLE LOGIQUE : Analyse d'objets immédiate avec Claude généraliste
    console.log("🔍 [TIMING] Analyse d'objets IA...");
    const objectsStart = Date.now();
    
    // Import dynamique pour Claude
    const { analyzePhotoWithClaude } = await import("@/services/claudeVision");
    
    // Analyser les objets avec Claude
    const objectsAnalysis = await analyzePhotoWithClaude({
      photoId: saved.id,
      imageUrl: imageUrl,
      systemPrompt: `Expert inventaire déménagement - ANALYSE COMPLÈTE.

Tu es un expert en inventaire de déménagement. Analyse cette photo et détecte TOUS les objets mobiles visibles.

RÈGLES CRITIQUES :
- **ANALYSE COMPLÈTE** : Détecte TOUS les objets mobiles (gros ET petits)
- **COMPTAGE INTELLIGENT** : Regroupe les objets STRICTEMENT IDENTIQUES avec quantity > 1
- **DIMENSIONS PRÉCISES** : Estime les dimensions en cm avec références visuelles
- **CATÉGORIES** : furniture, appliance, box, art, misc
- **DÉMONTABILITÉ** : Analyse visuellement les vis, charnières, structure modulaire
- **FRAGILITÉ** : Identifie verre, céramique, objets cassables

TECHNIQUES DE MESURE :
- **RÉFÉRENCES** : Portes ~80cm, prises ~15cm du sol, carrelage ~30x30cm
- **PROPORTIONS** : Compare avec des objets de taille connue
- **PERSPECTIVE** : Prends en compte l'angle de vue
- **CONFIDENCE** : 0.8-0.95 pour les mesures bien visibles

JSON strict uniquement.`,
      userPrompt: `Analyse cette photo et crée un inventaire complet.

JSON schema:
{
 "items":[
   {
     "label":"string",
     "category":"furniture|appliance|box|art|misc",
     "confidence":0.8,
     "quantity":number,
     "dimensions_cm":{
       "length":number,"width":number,"height":number,"source":"estimated"
     },
     "volume_m3":number,
     "fragile":boolean,
     "stackable":boolean,
     "notes":"string|null",
     "dismountable":boolean,
     "dismountable_confidence":number
   }
 ],
 "totals":{
   "count_items":number,
   "volume_m3":number
 },
 "special_rules":{
   "autres_objets":{
     "present":boolean,
     "listed_items":["string"],
     "volume_m3":number
   }
 }
}

🔢 RÈGLES DE COMPTAGE INTELLIGENT :
**⚠️ COMPTE TOUS LES OBJETS VISIBLES - NE PAS SE LIMITER À 1 !**

1. **OBJETS IDENTIQUES GROUPÉS → UNE entrée avec quantity > 1** :
   - 4 chaises identiques → {"label":"chaise", "quantity":4}
   - 3 vases identiques → {"label":"vase", "quantity":3}

2. **OBJETS DIFFÉRENTS → Entrées SÉPARÉES** :
   - Chaises de modèles différents → 1 entrée par type

EXEMPLES DE BON COMPTAGE :
✅ 6 chaises autour table → quantity: 6
✅ 15 livres sur étagère → quantity: 15

❌ MAUVAIS : voir 6 chaises mais mettre quantity: 1

Analyse TOUS les objets MOBILES avec leur QUANTITÉ EXACTE.`
    });
    
    const objectsTime = Date.now() - objectsStart;
    console.log(`✅ [TIMING] Analyse objets IA: ${objectsTime}ms - ${objectsAnalysis.items?.length || 0} objets`);
    
    const analysis = {
      ...objectsAnalysis,
      processingTime: objectsTime,
      aiProvider: "claude-3-5-haiku",
      analysisType: "single-photo-claude"
    };

    // ✨ Récupérer userId depuis form data ou headers
    const formUserId = form.get("userId");
    const userId = formUserId && typeof formUserId === 'string' 
      ? formUserId 
      : await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "User ID requis" }, { status: 401 });
    }
    const fullAnalysis = {
      ...analysis,
      roomDetection: {
        roomType: roomDetection.roomType,
        confidence: roomDetection.confidence,
        reasoning: roomDetection.reasoning
      }
    };

    const dbStart = Date.now();
    await savePhotoToDatabase({
      userId: userId,
      photoId: saved.id,
      filename: saved.filename,
      filePath: saved.filePath,
      url: saved.url,
      roomType: roomDetection.roomType,
      analysis: fullAnalysis
    });
    const dbTime = Date.now() - dbStart;
    
    const totalTime = Date.now() - startTime;
    console.log(`💾 [TIMING] Sauvegarde DB: ${dbTime}ms`);
    console.log(`🏁 [TIMING] TOTAL: ${totalTime}ms - ${file.name}`);

    return NextResponse.json({
      ...fullAnalysis,
      file_url: saved.url, // ✨ URL fichier (pas Base64)
      file_size: saved.size,
      photo_id: saved.id
    });
  } catch (e: unknown) {
    console.error("API Error:", e);
    const error = e as Error;
    console.error("Stack:", error.stack);
    return NextResponse.json({ 
      error: error.message ?? "internal_error",
      stack: error.stack,
      details: error.toString()
    }, { status: 500 });
  }
}
