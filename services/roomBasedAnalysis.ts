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
 * Version améliorée avec gestion textile et contenu des meubles fermés
 */
const ROOM_ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en inventaire de déménagement.

🏠 **CONTEXTE GLOBAL** :
- Les photos sont déjà regroupées par pièce (le type de pièce te sera fourni)
- Tu analyses PLUSIEURS PHOTOS DE LA MÊME PIÈCE sous différents angles
- Tu dois créer UN SEUL inventaire fusionné pour TOUTE la pièce

📋 TA TÂCHE EN 7 ÉTAPES :

1. **DÉDUPLICATION ABSOLUE** : Ne compte JAMAIS un objet deux fois, même s'il apparaît sur plusieurs photos
2. **IDENTIFICATION COMPLÈTE** : Détecte TOUS les meubles et objets mobiles visibles en fusionnant les points de vue
3. **COMPTAGE INTELLIGENT** : Regroupe les objets strictement identiques avec quantity > 1
4. **MESURES PRÉCISES** : Déduis des dimensions approximatives en cm pour chaque objet
5. **CALCUL DE VOLUME** : Utilise la formule : (longueur_cm × largeur_cm × hauteur_cm) / 1_000_000 = volume_m3
6. **PROPRIÉTÉS** : Indique pour chaque objet : fragile, démontable, stackable, textile_included
7. **CONTENU ÉVENTUEL** : Pour les meubles fermés, ajoute une ligne pour le contenu estimé

🎯 CONTRAINTES ABSOLUES :

⚠️ **INVENTAIRE GLOBAL UNIQUE** :
- Crée UN SEUL inventaire fusionné pour TOUTE la pièce
- Ne répète JAMAIS le même meuble s'il apparaît sur plusieurs photos
- Si un objet est partiellement visible sur plusieurs photos, COMBINE l'information pour créer UNE SEULE entrée

⚠️ **FORMAT JSON STRICT** :
- Respecte EXACTEMENT le schéma fourni dans le prompt utilisateur
- Tous les champs obligatoires doivent être présents
- Utilise TOUJOURS les types de données corrects (number, boolean, string)

⚠️ **ESTIMATION SYSTÉMATIQUE** :
- Estime TOUJOURS les volumes, même si les mesures exactes ne sont pas visibles
- Utilise les proportions relatives et les références standard (porte, meubles connus)
- Mieux vaut une estimation cohérente qu'aucune mesure

⚠️ **FUSION INTELLIGENTE** :
- Même objet sous 2 angles différents = 1 entrée, pas 2
- Objet partiellement caché sur photo 1 + visible sur photo 2 = combine les infos
- Utilise TOUTES les photos pour obtenir la meilleure vue de chaque objet

📏 TECHNIQUES DE MESURE :
- **RÉFÉRENCES VISUELLES** : Portes ~80cm de large, prises électriques ~15cm du sol, carrelage standard ~30×30cm
- **PROPORTIONS** : Compare les objets entre eux pour déduire les dimensions
- **PERSPECTIVE** : Tiens compte de l'angle de vue et de la distorsion
- **CONFIDENCE** : 0.8-0.95 pour les mesures bien visibles, 0.5-0.7 pour les estimations approximatives

⚠️ **RÉFÉRENCE MOBILIER STANDARD** :
- Si l'objet est un meuble standardisé (comme les LITS), privilégie les dimensions usuelles connues :
  • Lit simple : 90×190 cm
  • Lit double : 140×190 cm
  • Lit queen : 160×200 cm
  • Lit king : 180×200 cm
- N'invente pas de formats intermédiaires (ex : 180×140 cm)
- Si l'image montre un objet proche d'un standard, arrondis vers le format connu le plus probable

🛏️ **RÈGLES SPÉCIALES POUR LES LITS ET LITERIE** :
1. **TOUJOURS créer des entrées SÉPARÉES** :
   - Entrée 1 : Structure du lit (cadre + sommier)
   - Entrée 2 : Matelas
   - Entrée 3+ : Textiles visibles (couette, oreillers, plaid, traversin, etc.)

2. **Si textiles NON distinguables clairement** :
   - Ajoute "textile_included": true au matelas
   - Ne crée pas d'entrées séparées pour les textiles

3. **Exemple d'un lit complet bien visible** :
   [
     {"label":"lit double (structure)", "category":"furniture", "quantity":1, "dimensions_cm":{"length":140,"width":190,"height":40,"source":"estimated"}, "volume_m3":1.064, "textile_included":false, ...},
     {"label":"matelas double", "category":"furniture", "quantity":1, "dimensions_cm":{"length":140,"width":190,"height":20,"source":"estimated"}, "volume_m3":0.532, "textile_included":false, ...},
     {"label":"couette", "category":"misc", "quantity":1, "dimensions_cm":{"length":200,"width":200,"height":15,"source":"estimated"}, "volume_m3":0.6, "textile_included":false, ...},
     {"label":"oreiller", "category":"misc", "quantity":2, "dimensions_cm":{"length":60,"width":60,"height":15,"source":"estimated"}, "volume_m3":0.054, "textile_included":false, ...}
   ]

4. **Exemple d'un lit avec textiles non distinguables** :
   [
     {"label":"lit double (structure)", "category":"furniture", "quantity":1, "dimensions_cm":{"length":140,"width":190,"height":40,"source":"estimated"}, "volume_m3":1.064, "textile_included":false, ...},
     {"label":"matelas double", "category":"furniture", "quantity":1, "dimensions_cm":{"length":140,"width":190,"height":20,"source":"estimated"}, "volume_m3":0.532, "textile_included":true, "notes":"Inclut literie (couette, oreillers)", ...}
   ]

🗄️ **RÈGLES POUR MEUBLES DE RANGEMENT FERMÉS** :
- **Armoires, commodes, buffets, bibliothèques fermées** :
  1. Créer l'entrée pour le meuble lui-même
  2. **AJOUTER UNE LIGNE SUPPLÉMENTAIRE** pour le contenu éventuel :
     - Label : "{nom du meuble} (contenu éventuel)"
     - Category : "misc"
     - Volume : **50% du volume du meuble**
     - Notes : "Estimation contenu - à ajuster selon réalité"

- **Exemple d'armoire fermée** :
   [
     {"label":"armoire 3 portes", "category":"furniture", "quantity":1, "dimensions_cm":{"length":180,"width":60,"height":200,"source":"estimated"}, "volume_m3":2.16, "textile_included":false, ...},
     {"label":"armoire 3 portes (contenu éventuel)", "category":"misc", "quantity":1, "dimensions_cm":{"length":180,"width":60,"height":100,"source":"estimated"}, "volume_m3":1.08, "textile_included":false, "notes":"Estimation contenu 50% - à ajuster selon réalité", ...}
   ]

- **Meubles ouverts ou vides visibles** : Ne PAS ajouter de ligne de contenu

🏷️ CATÉGORIES D'OBJETS :
- **furniture** : lits, canapés, tables, chaises, armoires, commodes, étagères, bureaux
- **appliance** : réfrigérateur, lave-linge, TV, four, micro-ondes, lave-vaisselle
- **box** : cartons, coffres, malles, conteneurs
- **art** : tableaux, sculptures, cadres, miroirs décoratifs
- **misc** : vases, lampes, livres, bibelots, plantes, petits objets, textiles, contenu de meubles

🔧 DÉMONTABILITÉ (analyse visuelle) :
- Regarde les vis, charnières, structure modulaire
- Tables et chaises : généralement démontables
- Armoires et lits : souvent démontables (pieds vissés)
- Canapés : rarement démontables (sauf modulaires)

❌ OBJETS À IGNORER (non transportables) :
- Éléments fixes : radiateurs, climatiseurs encastrés, cheminées, plomberie
- Éléments de construction : murs, plafonds, sols, fenêtres, portes

Réponds en JSON strict uniquement.`;

/**
 * Prompt utilisateur pour l'analyse par pièce
 * Version "Best of Both" - Structure claire avec exemples concrets
 */
const ROOM_ANALYSIS_USER_PROMPT = `Analyse ces photos de la pièce et crée un inventaire complet.

📊 FORMAT DE RÉPONSE (JSON strict) :
{
 "items":[
   {
     "label":"string",                    // ex: "chaise", "table à manger", "lit double (structure)", "armoire (contenu éventuel)"
     "category":"furniture|appliance|box|art|misc",
     "confidence":0.8,                    // 0-1, ta confiance dans l'identification
     "quantity":number,                   // ⚠️ REGROUPE les objets identiques !
     "dimensions_cm":{
       "length":number,                   // Longueur en cm
       "width":number,                    // Largeur en cm
       "height":number,                   // Hauteur en cm
       "source":"estimated"               // ou "visual" si mesures visibles
     },
     "volume_m3":number,                  // ⚠️ Utilise la FORMULE : (L × l × h) / 1_000_000
     "fragile":boolean,                   // Verre, céramique, objets cassables
     "stackable":boolean,                 // Peut-on empiler d'autres objets dessus ?
     "textile_included":boolean,          // ⚠️ NOUVEAU : true si literie/textiles inclus mais non distinguables
     "notes":"string|null",               // Remarques importantes
     "dismountable":boolean,              // Peut-on le démonter pour le transport ?
     "dismountable_confidence":number     // 0-1, ta confiance dans la démontabilité
   }
 ],
 "totals":{
   "count_items":number,                  // Somme des quantities
   "volume_m3":number                     // Somme des volumes
 },
 "special_rules":{
   "autres_objets":{
     "present":boolean,                   // Y a-t-il des petits objets non listés ?
     "listed_items":["string"],           // Liste des types (ex: ["vêtements", "jouets"])
     "volume_m3":number                   // Volume estimé pour ces objets
   }
 }
}

🔢 RÈGLES DE COMPTAGE INTELLIGENT :

⚠️ **COMPTE TOUS LES OBJETS VISIBLES - NE PAS SE LIMITER À 1 !**

1. **OBJETS IDENTIQUES → 1 entrée avec quantity > 1** :
   ✅ 4 chaises identiques → {"label":"chaise", "quantity":4}
   ✅ 3 vases identiques → {"label":"vase", "quantity":3}
   ✅ 6 livres sur étagère → {"label":"livre", "quantity":6}

2. **OBJETS DIFFÉRENTS → Entrées SÉPARÉES** :
   ✅ 2 chaises rouges + 4 chaises blanches → 2 entrées distinctes
   ✅ Petite table + grande table → 2 entrées

3. **COMPTAGE ESTIMÉ POUR LOTS** :
   ✅ Beaucoup d'objets similaires → quantity estimée + note "environ X objets"

❌ **ERREURS À ÉVITER** :
   ❌ Voir 6 chaises mais mettre quantity: 1
   ❌ Créer 6 entrées "chaise" au lieu d'1 avec quantity: 6
   ❌ Compter le même lit visible sur 2 photos comme 2 lits

📸 **RAPPEL DÉDUPLICATION** :
Même objet sur plusieurs photos = 1 SEULE entrée dans le JSON !

Détecte TOUS les objets MOBILES avec leur QUANTITÉ EXACTE.`;

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
    
    // ✅ NOUVELLE APPROCHE : Envoyer TOUTES les photos à Claude en UN SEUL appel
    // Cela évite la duplication car Claude analyse toutes les images ensemble
    logger.debug(`📸 Analyse de ${request.photos.length} photos en UN SEUL appel Claude`);
    
    const photoIds = request.photos.map(p => p.id);
    const imageUrls = request.photos.map(photo => {
      return photo.url.startsWith('http') 
        ? photo.url 
        : `http://localhost:3001${photo.url}`;
    });
    
    const { analyzeMultiplePhotosWithClaude } = await import("./claudeVision");
    
    const analysis = await analyzeMultiplePhotosWithClaude({
      photoIds: photoIds,
      imageUrls: imageUrls,
      systemPrompt: ROOM_ANALYSIS_SYSTEM_PROMPT,
      userPrompt: userPrompt
    });
    
    logger.debug(`✅ Analyse multi-images terminée: ${analysis.items?.length || 0} objets détectés`);

    // ✅ Le post-traitement est déjà fait dans analyzeMultiplePhotosWithClaude
    // Pas besoin de le refaire ici
    
    const processingTime = Date.now() - startTime;
    
    const result: RoomAnalysisResult = {
      ...analysis,
      roomType: request.roomType,
      photoCount: request.photos.length,
      analysisType: 'room-based-claude',
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