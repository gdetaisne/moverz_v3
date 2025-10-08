/**
 * 🏠 SERVICE D'ANALYSE PAR PIÈCE SIMPLIFIÉ
 * 
 * Utilise uniquement Claude pour analyser toutes les photos d'une pièce
 * selon les critères historiques d'inventaire.
 */

import { TPhotoAnalysis } from "@/lib/schemas";
import { optimizeImageForAI } from "@/lib/imageOptimization";
import { calculatePackagedVolume } from "@/lib/packaging";
import { calculateDismountableProbability } from "@/lib/dismountable";
import { mapToCatalog, volumeFromDims } from "@/lib/normalize";
import { config } from '../config/app';
import { logger } from '@/lib/logger';
export interface RoomAnalysisRequest {
  roomType: string;
  photos: Array<{
  id: string;
  url: string;
  filename: string;
  }>;
  userId: string;
}

export interface RoomAnalysisResult extends TPhotoAnalysis {
  roomType: string;
  photoCount: number;
  analysisType: 'room-based-claude';
}

/**
 * Prompt système unifié pour l'analyse complète par pièce
 */
const ROOM_ANALYSIS_SYSTEM_PROMPT = `Expert inventaire déménagement - ANALYSE COMPLÈTE PAR PIÈCE.

Tu es un expert en inventaire de déménagement. Tu vas analyser TOUTES les photos d'une pièce pour créer un inventaire complet et précis.

RÈGLES CRITIQUES :
- **ANALYSE COMPLÈTE** : Détecte TOUS les objets mobiles visibles (gros ET petits)
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

OBJETS À DÉTECTER :
- Mobilier : lits, canapés, tables, chaises, armoires, commodes, étagères
- Électroménagers : réfrigérateur, lave-linge, TV, four, micro-ondes
- Décorations : vases, cadres, tableaux, miroirs, lampes
- Accessoires : livres, bibelots, plantes, petits objets
- Gros objets : piano, vélo, cartons

OBJETS À IGNORER :
- Éléments fixes : radiateurs, climatiseurs, cheminées, plomberie
- Éléments de construction : murs, plafonds, sols

JSON strict uniquement.`;

/**
 * Prompt utilisateur pour l'analyse par pièce
 */
const ROOM_ANALYSIS_USER_PROMPT = `Analyse ces photos de la pièce et crée un inventaire complet.

JSON schema:
{
 "items":[
   {
     "label":"string",                  // ex: "chaise", "table à manger", "vase"
     "category":"furniture|appliance|box|art|misc",
     "confidence":0.8,
     "quantity":number,                 // COMPTAGE INTELLIGENT
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
   - 2 fauteuils identiques → {"label":"fauteuil", "quantity":2}

2. **OBJETS DIFFÉRENTS → Entrées SÉPARÉES** :
   - Chaises de modèles différents → 1 entrée par type
   - Objets de tailles très différentes → entrées séparées

3. **COMPTAGE ESTIMÉ POUR LOTS** :
   - Beaucoup d'objets similaires → quantity estimée avec note "estimation"

EXEMPLES DE BON COMPTAGE :
✅ 6 chaises autour table → quantity: 6
✅ 15 livres sur étagère → quantity: 15
✅ 4 cadres sur mur → quantity: 4

❌ MAUVAIS : voir 6 chaises mais mettre quantity: 1
❌ MAUVAIS : créer 6 entrées "chaise" au lieu d'1 avec quantity: 6

Analyse TOUTES les photos et détecte TOUS les objets MOBILES avec leur QUANTITÉ EXACTE.`;

/**
 * Analyse toutes les photos d'une pièce avec Claude
 */
export async function analyzeRoomPhotos(request: RoomAnalysisRequest): Promise<RoomAnalysisResult> {
  const startTime = Date.now();
  
  try {
    logger.debug(`🏠 Début analyse pièce "${request.roomType}" avec ${request.photos.length} photos`);
    
    if (request.photos.length === 0) {
      throw new Error('Aucune photo fournie pour l\'analyse');
    }

    // 🎯 NOUVELLE LOGIQUE : Analyser chaque photo individuellement puis fusionner
    logger.debug(`🔍 Analyse de ${request.photos.length} photos de la pièce "${request.roomType}"`);
    
    const userPrompt = `Analyse cette photo de la pièce "${request.roomType}" et crée un inventaire complet.

` + ROOM_ANALYSIS_USER_PROMPT.split('\n').slice(1).join('\n');
    
    // Analyser chaque photo individuellement
    const photoAnalyses = await Promise.all(
      request.photos.map(async (photo, index) => {
        logger.debug(`📸 Analyse photo ${index + 1}/${request.photos.length}: ${photo.filename}`);
        
        // Construire l'URL complète
        const fullUrl = photo.url.startsWith('http') 
          ? photo.url 
          : `http://localhost:3001${photo.url}`;
        
        const analysis = await analyzePhotoWithClaude({
          photoId: photo.id,
          imageUrl: fullUrl,
          systemPrompt: ROOM_ANALYSIS_SYSTEM_PROMPT,
          userPrompt: userPrompt
        });
        
        logger.debug(`✅ Photo ${index + 1} analysée: ${analysis.items?.length || 0} objets`);
        return analysis;
      })
    );
    
    // Fusionner tous les résultats
    const allItems = photoAnalyses.flatMap(analysis => analysis.items || []);
    const totalVolume = photoAnalyses.reduce((sum, analysis) => sum + (analysis.totals?.volume_m3 || 0), 0);
    
    // Créer l'analyse fusionnée
    const analysis = {
      version: "1.0.0" as const,
      items: allItems,
      totals: {
        count_items: allItems.length,
        volume_m3: totalVolume
      },
      special_rules: {
        autres_objets: {
          present: photoAnalyses.some(a => a.special_rules?.autres_objets?.present),
          listed_items: photoAnalyses.flatMap(a => a.special_rules?.autres_objets?.listed_items || []),
          volume_m3: photoAnalyses.reduce((sum, a) => sum + (a.special_rules?.autres_objets?.volume_m3 || 0), 0)
        }
      },
      warnings: photoAnalyses.flatMap(a => a.warnings || []),
      errors: photoAnalyses.flatMap(a => a.errors || []),
      photo_id: request.photos.map(p => p.id).join(','),
      processingTime: Date.now() - startTime,
      aiProvider: "claude-3-5-haiku",
      analysisType: "room-based-claude" as const
    };

    // Post-traitement : calculer les volumes emballés et démontabilité
    const processedItems = analysis.items.map(item => {
      try {
        // Calculer le volume emballé
        const packagedVolume = calculatePackagedVolume(
          item.volume_m3 || 0,
          item.fragile || false,
          item.category || 'misc',
          item.dimensions_cm,
          false // isDismountable
        );
        
        // Calculer la probabilité de démontabilité
        const dismountableProb = calculateDismountableProbability(
          String(item.label || ''), // label
          item.dismountable, // aiDismountable
          item.dismountable_confidence // aiConfidence
        );
        
        return {
          ...item,
          packaged_volume_m3: packagedVolume.packagedVolumeM3,
          packaging_display: packagedVolume.displayValue,
          is_small_object: packagedVolume.isSmallObject,
          packaging_calculation_details: packagedVolume.calculationDetails,
          dismountable: dismountableProb > 0.5,
          dismountable_confidence: dismountableProb,
          dismountable_source: 'ai' as const
        };
      } catch (error) {
        console.warn('Erreur post-traitement item:', error);
        return {
          ...item,
          packaged_volume_m3: item.volume_m3 || 0,
          dismountable: false,
          dismountable_confidence: 0,
          dismountable_source: 'ai' as const
        };
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    const result: RoomAnalysisResult = {
      ...analysis,
      items: processedItems,
      roomType: request.roomType,
      photoCount: request.photos.length,
      analysisType: 'room-based-claude',
      processingTime,
      aiProvider: 'claude-3-5-haiku',
      photo_id: request.photos.map(p => p.id).join(',')
    };
    
    logger.debug(`✅ Analyse pièce "${request.roomType}" terminée: ${result.items.length} objets, ${processingTime}ms`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Erreur analyse pièce "${request.roomType}":`, error);
    
    // Retourner un résultat d'erreur
    return {
      version: "1.0.0" as const,
      items: [],
      special_rules: { autres_objets: { present: false, volume_m3: 0, listed_items: [] } },
      warnings: [`Erreur analyse pièce: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
      errors: [],
      totals: { count_items: 0, volume_m3: 0 },
      roomType: request.roomType,
      photoCount: request.photos.length,
      analysisType: 'room-based-claude',
      processingTime: Date.now() - startTime,
      aiProvider: 'claude-3-5-haiku',
      photo_id: request.photos[0]?.id || 'unknown'
    };
  }
}

/**
 * Analyse une photo avec Claude (version simplifiée)
 */
async function analyzePhotoWithClaude(opts: {
  photoId: string;
  imageUrl: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<TPhotoAnalysis> {
  const isClaudeApiKeyConfigured = !!config.claude.apiKey;

  if (!isClaudeApiKeyConfigured) {
    console.warn('Aucune clé Claude configurée - using mock mode');
    return {
      version: "1.0.0" as const,
      items: [{ 
        label: "Table", 
        category: "furniture" as const,
        quantity: 1, 
        dimensions_cm: { length: 120, width: 80, height: 75, source: "estimated" as const }, 
        volume_m3: 0.72, 
        confidence: 0.8, 
        fragile: false,
        stackable: false,
        notes: "Mode mock - clé Claude non configurée" 
      }],
      special_rules: { autres_objets: { present: false, volume_m3: 0, listed_items: [] } },
      warnings: ["Mode mock - clé Claude non configurée"],
      errors: [],
      totals: { count_items: 1, volume_m3: 0.72 },
      photo_id: opts.photoId,
    };
  }

  try {
    // Construire l'URL complète si c'est une URL relative
    const fullImageUrl = opts.imageUrl.startsWith('http') 
      ? opts.imageUrl 
      : `http://localhost:3001${opts.imageUrl}`;
    
    logger.debug(`🖼️ Chargement image depuis: ${fullImageUrl}`);
    
    // Charger l'image depuis l'URL
    const imageResponse = await fetch(fullImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Erreur chargement image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Pour le test, utiliser directement l'image sans optimisation
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    logger.debug(`Image Claude préparée: ${base64Image.length} bytes`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.claude.apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${opts.systemPrompt}\n\n${opts.userPrompt}`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Claude API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.debug('Réponse Claude reçue:', data);

    // Parser la réponse Claude
    const content = data.content[0]?.text;
    if (!content) {
      throw new Error('Aucune réponse de Claude');
    }

    // Parser le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse Claude invalide');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Traitement post-IA : forcer le calcul du volume
    const processedItems = analysis.items.map((item: any) => {
      // Calculer le volume si pas fourni
      if (!item.volume_m3 && item.dimensions_cm) {
        item.volume_m3 = volumeFromDims(item.dimensions_cm);
      }
      
      return item;
    });
  
  return {
      version: "1.0.0" as const,
      items: processedItems,
      special_rules: analysis.special_rules || { autres_objets: { present: false, volume_m3: 0, listed_items: [] } },
    warnings: [],
    errors: [],
      totals: analysis.totals || { count_items: processedItems.length, volume_m3: processedItems.reduce((sum: number, item: any) => sum + (item.volume_m3 || 0), 0) },
      photo_id: opts.photoId,
    };

  } catch (error) {
    console.error('Erreur analyse Claude:', error);
    
    return {
      version: "1.0.0" as const,
      items: [],
      special_rules: { autres_objets: { present: false, volume_m3: 0, listed_items: [] } },
      warnings: [],
      errors: [`Erreur analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
      totals: { count_items: 0, volume_m3: 0 },
      photo_id: opts.photoId,
    };
  }
}