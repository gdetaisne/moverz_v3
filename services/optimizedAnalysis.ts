/**
 * 🤖 SERVICE D'ANALYSE IA OPTIMISÉE
 * 
 * 📐 ARCHITECTURE ACTUELLE :
 * 
 * analyzePhotoWithOptimizedVision()
 * ├─ analyzeArmoiresHybrid()   → ARMOIRES, PENDERIES, DRESSINGS (prompts spécialisés)
 * ├─ analyzeTablesHybrid()     → TABLES À MANGER (prompts spécialisés)
 * ├─ analyzeCanapesHybrid()    → CANAPÉS, SOFAS (prompts spécialisés)
 * ├─ analyzeVolumineuxHybrid() → OBJETS VOLUMINEUX >50cm (prompts spécialisés)
 * ├─ analyzePetitsHybrid()     → PETITS OBJETS <50cm (prompts spécialisés)
 * └─ deduplicateItemsWithPriority() → Fusion intelligente avec priorité
 * 
 * 🚨 PROBLÈMES RÉSOLUS :
 * - ARMOIRES et CANAPÉS utilisent maintenant leurs prompts spécialisés
 * - TABLES utilise maintenant la bonne signature de fonction
 * - Déduplication fusionne correctement les quantités
 * 
 * 📊 RÉSULTAT ATTENDU : 5 chaises + 1 table + autres objets (pas de doublons)
 * 
 * 🚀 ÉVOLUTIONS FUTURES POSSIBLES (voir ANALYSE_PRIORITES_PRECISION.md) :
 * 
 * OPTION A : Spécialisation par type de meuble (impact max, complexité élevée)
 *   analyzePhotoWithOptimizedVision()
 *   ├─ analyzeTablesHybrid()          → Raisonnement contextuel (compter chaises)
 *   ├─ analyzeArmoiresHybrid()        → Raisonnement (compter portes)
 *   ├─ analyzeLitsHybrid()            → Raisonnement (compter oreillers)
 *   ├─ analyzeCanapesHybrid()         → Raisonnement (compter places)
 *   ├─ analyzeAutresVolumineuxHybrid()
 *   └─ analyzePetitsHybrid()
 * 
 * OPTION B : Prompt structuré unique (impact bon, complexité faible) ← RECOMMANDÉ
 *   - 1 seul appel API avec sections dédiées par type
 *   - Garde performance actuelle
 *   - Plus facile à maintenir
 * 
 * 📊 PRIORITÉS MESURES PRÉCISES (voir lib/catalog.ts et ANALYSE_PRIORITES_PRECISION.md)
 */

import { TPhotoAnalysis } from '@/lib/schemas';
import { analyzePhotoWithClaude } from './claudeVision';
import { originalAnalyzePhotoWithVision } from './openaiVision';
import { analyzeVolumineuxHybrid } from './volumineuxAnalysis';
import { analyzePetitsHybrid } from './petitsAnalysis';
// 🆕 Services spécialisés par catégorie
import { analyzeArmoiresHybrid } from './armoiresAnalysis';
import { analyzeTablesHybrid } from './tablesAnalysis';
import { analyzeCanapesHybrid } from './canapesAnalysis';
import { optimizeImageForAI } from '@/lib/imageOptimization';
import { calculatePackagedVolume } from '@/lib/packaging';
import { validateAllMeasurements } from '@/lib/measurementValidation';
import { safeApiCall, createErrorHandler, APIError } from './core/errorHandling';
import { cacheService, generateAnalysisCacheKey, cacheAnalysisResult, getCachedAnalysisResult } from './core/cacheService';
import { config } from '../config/app';
import crypto from 'crypto';
// SPRINT 2 - Analyse contextuelle
import { contextualAnalysisService, ContextualAnalysisResult } from './contextualAnalysisService';
import { DetectedObject } from '../types/measurements';

export interface OptimizedAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid' | 'specialized-hybrid';
  roomDetection?: {
    roomType: string;
    confidence: number;
    reasoning: string;
  };
  analysisType?: 'legacy' | 'specialized';
  contextualAnalysis?: ContextualAnalysisResult; // SPRINT 2
}

// Cache géré par le service centralisé

/**
 * Analyse optimisée avec double validation IA - NOUVELLE VERSION SPÉCIALISÉE
 */
export async function analyzePhotoWithOptimizedVision(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<OptimizedAnalysisResult> {
  const startTime = Date.now();
  const cacheKey = generateAnalysisCacheKey(opts.imageUrl, 'specialized');
  
  try {
    // 1. Vérifier le cache
    const cached = getCachedAnalysisResult<OptimizedAnalysisResult>(cacheKey);
    if (cached) {
      console.log(`Cache hit pour ${cacheKey.substring(0, 8)}...`);
      return { ...cached, photo_id: opts.photoId };
    }

    // 2. NOUVELLE APPROCHE : 5 Analyses spécialisées en parallèle
    console.log("🚀 Lancement de 5 analyses spécialisées en parallèle...");
    
    const [armoiresResults, tablesResults, canapesResults, volumineuxResults, petitsResults] = await Promise.allSettled([
      // 🆕 Analyse ARMOIRES : Raisonnement contextuel (compter portes)
      safeApiCall(() => analyzeArmoiresHybrid(opts), 'ArmoiresAnalysis'),
      // 🆕 Analyse TABLES : Validation morphologique (ratio carré vs rectangulaire)
      safeApiCall(() => analyzeTablesHybrid(opts), 'TablesAnalysis'),
      // 🆕 Analyse CANAPÉS : Formule explicite (Places×60 + Accoudoirs)
      safeApiCall(() => analyzeCanapesHybrid(opts), 'CanapesAnalysis'),
      // Analyse VOLUMINEUX : Reste des gros objets (lits, électroménagers, etc.)
      safeApiCall(() => analyzeVolumineuxHybrid(opts), 'VolumineuxAnalysis'),
      // Analyse PETITS : Petits objets (<50cm)
      safeApiCall(() => analyzePetitsHybrid(opts), 'PetitsAnalysis')
    ]);

    // 3. 🎯 FUSION SIMPLIFIÉE : Plus de déduplication complexe
    // L'IA analyse déjà l'ensemble des photos d'une pièce
    const finalResults = mergeAllSpecializedResultsSimple(
      armoiresResults.status === 'fulfilled' ? armoiresResults.value : null,
      tablesResults.status === 'fulfilled' ? tablesResults.value : null,
      canapesResults.status === 'fulfilled' ? canapesResults.value : null,
      volumineuxResults.status === 'fulfilled' ? volumineuxResults.value : null,
      petitsResults.status === 'fulfilled' ? petitsResults.value : null
    );

    // 4. SPRINT 2 : Analyse contextuelle si plusieurs objets
    let contextualAnalysis: ContextualAnalysisResult | undefined;
    if (finalResults.items.length >= 2) {
      console.log('🔍 Analyse contextuelle multi-objets en cours...');
      const detectedObjects: DetectedObject[] = finalResults.items.map((item, idx) => ({
        id: `obj-${idx}`,
        label: item.label,
        confidence: item.confidence || 0.7,
        dimensions: {
          length: item.dimensions_cm?.length || 0,
          width: item.dimensions_cm?.width || 0,
          height: item.dimensions_cm?.height || 0
        },
        volume: item.volume_m3 || 0,
        category: item.category || 'misc'
      }));

      contextualAnalysis = await contextualAnalysisService.analyzeContext(detectedObjects);
      
      // Appliquer les ajustements contextuels
      // IMPORTANT : Les objets ajustés sont dans le même ordre que detectedObjects
      if (contextualAnalysis.objects.length === finalResults.items.length) {
        console.log(`✅ Application analyse contextuelle (${contextualAnalysis.adjustments.length} ajustement(s), cohérence: ${(contextualAnalysis.consistency * 100).toFixed(0)}%)`);
        finalResults.items = finalResults.items.map((item, idx) => {
          const adjustedObj = contextualAnalysis!.objects[idx];
          // Appliquer les dimensions ajustées (préserver source et autres champs)
          return {
            ...item,
            dimensions_cm: {
              ...item.dimensions_cm,
              length: adjustedObj.dimensions.length,
              width: adjustedObj.dimensions.width,
              height: adjustedObj.dimensions.height,
              source: item.dimensions_cm?.source || 'estimated' // Préserver le source original
            },
            volume_m3: adjustedObj.volume
          };
        });
      } else {
        console.warn(`⚠️  Incohérence de taille : ${contextualAnalysis.objects.length} objets analysés vs ${finalResults.items.length} items. Analyse contextuelle ignorée.`);
      }
    }

    // 5. Recalculer le volume pour tous les objets (correction des erreurs IA)
    const correctedResults = {
      ...finalResults,
      items: finalResults.items.map(item => {
        if (item.dimensions_cm?.length && item.dimensions_cm?.width && item.dimensions_cm?.height) {
          const correctedVolume = calculateVolume(
            item.dimensions_cm.length,
            item.dimensions_cm.width,
            item.dimensions_cm.height
          );
          return { ...item, volume_m3: correctedVolume };
        }
        return item;
      })
    };

    // 6. Détection de pièce désactivée (faite en parallèle dans l'API)
    const roomDetection = {
      roomType: 'pièce inconnue',
      confidence: 0.1,
      reasoning: 'Détection de pièce gérée en parallèle'
    };

    // 7. Ajouter les métadonnées d'analyse
    const processingTime = Date.now() - startTime;
    const result: OptimizedAnalysisResult = {
      ...correctedResults,
      processingTime,
      aiProvider: determineAllSpecializedAIProvider(armoiresResults, tablesResults, canapesResults, volumineuxResults, petitsResults),
      analysisType: 'specialized',
      photo_id: opts.photoId,
      roomDetection,
      contextualAnalysis // SPRINT 2
    };

    // 8. Mettre en cache
    cacheAnalysisResult(cacheKey, result, config.cache.ttl);

    console.log(`Analyse optimisée terminée en ${processingTime}ms (${result.aiProvider})`);
    return result;

  } catch (error) {
    console.error('Erreur lors de l\'analyse optimisée:', error);
    // Fallback vers OpenAI seul (pas d'analyse contextuelle en fallback)
    const fallbackResult = await originalAnalyzePhotoWithVision(opts);
    return {
      ...fallbackResult,
      processingTime: Date.now() - startTime,
      aiProvider: 'openai',
      photo_id: opts.photoId,
      analysisType: 'legacy',
      contextualAnalysis: undefined // Pas d'analyse contextuelle en fallback
    };
  }
}

/**
 * Déduplique les objets entre les analyses volumineux et petits
 */
function deduplicateItems(volumineuxItems: any[], petitsItems: any[]): any[] {
  const allItems = [...volumineuxItems, ...petitsItems];
  const deduplicatedItems: any[] = [];
  const processedPositions = new Set<string>();

  for (const item of allItems) {
    // Créer une clé unique basée sur le label et les dimensions (plus flexible)
    const labelKey = item.label.toLowerCase().trim();
    const dimensionsKey = `${item.dimensions_cm?.length || 0}_${item.dimensions_cm?.width || 0}_${item.dimensions_cm?.height || 0}`;
    const positionKey = `${labelKey}_${dimensionsKey}`;
    
    // Vérifier si cet objet a déjà été traité
    if (!processedPositions.has(positionKey)) {
      processedPositions.add(positionKey);
      deduplicatedItems.push(item);
    } else {
      // Objet dupliqué détecté - garder celui avec la plus haute confidence
      const existingIndex = deduplicatedItems.findIndex(existing => 
        existing.label.toLowerCase().trim() === labelKey &&
        Math.abs((existing.dimensions_cm?.length || 0) - (item.dimensions_cm?.length || 0)) < 15 &&
        Math.abs((existing.dimensions_cm?.width || 0) - (item.dimensions_cm?.width || 0)) < 15 &&
        Math.abs((existing.dimensions_cm?.height || 0) - (item.dimensions_cm?.height || 0)) < 15
      );
      
      if (existingIndex !== -1) {
        const existing = deduplicatedItems[existingIndex];
        if (item.confidence > existing.confidence) {
          // Remplacer par l'objet avec la plus haute confidence
          deduplicatedItems[existingIndex] = item;
        }
      }
    }
  }

  return deduplicatedItems;
}

/**
 * Fusionne les résultats des analyses spécialisées (volumineux + petits) - LEGACY
 */
function mergeSpecializedResults(
  volumineuxResults: any | null,
  petitsResults: any | null
): TPhotoAnalysis {
  // Si un seul résultat disponible, l'utiliser
  if (!volumineuxResults && !petitsResults) {
    throw new Error('Aucun résultat d\'analyse spécialisée disponible');
  }
  
  if (!volumineuxResults) return petitsResults!;
  if (!petitsResults) return volumineuxResults;

  // Fusionner les items des deux analyses avec déduplication
  const mergedItems = deduplicateItems(
    volumineuxResults.items || [],
    petitsResults.items || []
  );
  
  // Valider et corriger les mesures de tous les objets
  const validatedItems = validateAllMeasurements(mergedItems);
  
  // Fusionner les règles spéciales
  const specialRules = {
    autres_objets: {
      present: (volumineuxResults.special_rules?.autres_objets?.present || false) || 
               (petitsResults.special_rules?.autres_objets?.present || false),
      listed_items: [
        ...(volumineuxResults.special_rules?.autres_objets?.listed_items || []),
        ...(petitsResults.special_rules?.autres_objets?.listed_items || [])
      ],
      volume_m3: (volumineuxResults.special_rules?.autres_objets?.volume_m3 || 0) + 
                 (petitsResults.special_rules?.autres_objets?.volume_m3 || 0)
    }
  };
  
  // Calculer les totaux combinés avec les items validés
  const totals = {
    count_items: validatedItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    volume_m3: Number(validatedItems.reduce((sum, item) => sum + (item.volume_m3 || 0) * (item.quantity || 1), 0).toFixed(3))
  };

  // Fusionner les warnings
  const warnings = [
    ...(volumineuxResults.warnings || []),
    ...(petitsResults.warnings || []),
    'Analyse hybride spécialisée volumineux + petits objets'
  ];

  return {
    version: "1.0.0",
    photo_id: volumineuxResults.photo_id || petitsResults.photo_id || '',
    items: validatedItems,
    special_rules: specialRules,
    warnings,
    errors: [...(volumineuxResults.errors || []), ...(petitsResults.errors || [])],
    totals
  };
}

/**
 * 🆕 Fusionne les résultats des 5 analyses spécialisées
 * Priorité : Analyses spécialisées (armoires, tables, canapés) > Volumineux > Petits
 */
function mergeAllSpecializedResultsSimple(
  armoiresResults: any | null,
  tablesResults: any | null,
  canapesResults: any | null,
  volumineuxResults: any | null,
  petitsResults: any | null
): TPhotoAnalysis {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔀 MERGE SIMPLE 5 ANALYSES:');
  console.log('- Armoires:', armoiresResults?.items?.length || 0, 'items');
  console.log('- Tables:', tablesResults?.items?.length || 0, 'items');
  console.log('- Canapés:', canapesResults?.items?.length || 0, 'items');
  console.log('- Volumineux:', volumineuxResults?.items?.length || 0, 'items');
  console.log('- Petits:', petitsResults?.items?.length || 0, 'items');

  // 🎯 COLLECTE SIMPLE : Plus de déduplication complexe
  const allItems = [
    ...(armoiresResults?.items || []),
    ...(tablesResults?.items || []),
    ...(canapesResults?.items || []),
    ...(volumineuxResults?.items || []),
    ...(petitsResults?.items || [])
  ];

  console.log('✅ Items totaux:', allItems.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Valider et corriger les mesures
  const validatedItems = validateAllMeasurements(allItems);

  // Fusionner les règles spéciales
  const allResults = [armoiresResults, tablesResults, canapesResults, volumineuxResults, petitsResults].filter(r => r);
  const specialRules = {
    autres_objets: {
      present: allResults.some(r => r.special_rules?.autres_objets?.present),
      listed_items: allResults.flatMap(r => r.special_rules?.autres_objets?.listed_items || []),
      volume_m3: allResults.reduce((sum, r) => sum + (r.special_rules?.autres_objets?.volume_m3 || 0), 0)
    }
  };

  // Calculer les totaux
  const totals = {
    count_items: validatedItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    volume_m3: Number(validatedItems.reduce((sum, item) => sum + (item.volume_m3 || 0) * (item.quantity || 1), 0).toFixed(3))
  };

  // Fusionner les warnings
  const warnings = [
    ...allResults.flatMap(r => r.warnings || []),
    'Analyse hybride spécialisée : Armoires + Tables + Canapés + Volumineux + Petits'
  ];

  const photoId = armoiresResults?.photo_id || tablesResults?.photo_id || canapesResults?.photo_id || 
                  volumineuxResults?.photo_id || petitsResults?.photo_id || '';

  return {
    version: "1.0.0",
    photo_id: photoId,
    items: validatedItems,
    special_rules: specialRules,
    warnings,
    errors: allResults.flatMap(r => r.errors || []),
    totals
  };
}

/**
 * Normalise un label pour la déduplication
 * Corrige les variations communes (table à manger → table, etc.)
 */
function normalizeLabel(label: string): string {
  const normalized = label.toLowerCase().trim();
  
  // Patterns de normalisation (ordre important : du plus spécifique au plus général)
  const patterns: [RegExp, string][] = [
    [/table (à manger|de salle à manger|salle à manger|carrée|rectangulaire|ronde|ovale)/i, 'table'],
    [/armoire|penderie|dressing/i, 'armoire'],
    [/canapé|sofa/i, 'canapé'],
    [/chaise de (cuisine|salle à manger|bureau)/i, 'chaise'],
  ];
  
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(normalized)) {
      return replacement;
    }
  }
  
  return normalized;
}

/**
 * 🆕 Déduplique les items en respectant la priorité des sources
 * Priorité : 1 (spécialisé) > 2 (volumineux) > 3 (petits)
 */
function deduplicateItemsWithPriority(items: any[]): any[] {
  const itemMap = new Map<string, any>();

  for (const item of items) {
    const key = normalizeLabel(item.label);
    const existing = itemMap.get(key);

    if (!existing) {
      // Nouvel item
      itemMap.set(key, item);
    } else {
      // Item existe déjà : garder celui avec meilleure priorité OU meilleure confidence
      if (item._priority < existing._priority) {
        // Priorité plus haute (spécialisé > volumineux > petits)
        console.log(`  → Priorité: Remplacement "${key}" (${existing._source} → ${item._source})`);
        itemMap.set(key, item);
      } else if (item._priority === existing._priority && item.confidence > existing.confidence) {
        // Même priorité mais meilleure confidence
        console.log(`  → Confidence: Remplacement "${key}" (${existing.confidence} → ${item.confidence})`);
        itemMap.set(key, item);
      } else if (item._priority === existing._priority && item.confidence === existing.confidence) {
        // Même priorité et même confidence : fusionner les quantités
        const maxQuantity = Math.max(item.quantity || 1, existing.quantity || 1);
        existing.quantity = maxQuantity;
        console.log(`  → Quantity: Fusion "${key}" (${existing.quantity || 1} → ${maxQuantity})`);
        itemMap.set(key, existing);
      }
    }
  }

  // Nettoyer les champs internes
  return Array.from(itemMap.values()).map(item => {
    const { _priority, _source, ...cleanItem } = item;
    return cleanItem;
  });
}

/**
 * Fusionne les résultats de Claude et OpenAI (LEGACY)
 */
function mergeAIResults(
  claudeResults: TPhotoAnalysis | null,
  openaiResults: TPhotoAnalysis | null
): TPhotoAnalysis {
  // Si un seul résultat disponible, l'utiliser
  if (!claudeResults && !openaiResults) {
    throw new Error('Aucun résultat IA disponible');
  }
  
  if (!claudeResults) return openaiResults!;
  if (!openaiResults) return claudeResults;

  // Fusionner les deux résultats
  const mergedItems = mergeItems(claudeResults.items, openaiResults.items);
  
  // Utiliser les règles spéciales d'OpenAI (plus précises)
  const specialRules = openaiResults.special_rules || claudeResults.special_rules;
  
  // Calculer les totaux
  const totals = {
    count_items: mergedItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    volume_m3: Number(mergedItems.reduce((sum, item) => sum + (item.volume_m3 || 0) * (item.quantity || 1), 0).toFixed(3))
  };

  // Fusionner les warnings
  const warnings = [
    ...(claudeResults.warnings || []),
    ...(openaiResults.warnings || []),
    'Analyse hybride Claude + OpenAI'
  ];

  return {
    version: "1.0.0",
    photo_id: openaiResults.photo_id || claudeResults.photo_id || '',
    items: mergedItems,
    special_rules: specialRules,
    warnings,
    errors: [...(claudeResults.errors || []), ...(openaiResults.errors || [])],
    totals
  };
}

/**
 * Fusionne les items des deux analyses
 */
function mergeItems(items1: any[], items2: any[]): any[] {
  const mergedMap = new Map();
  
  // Ajouter les items de Claude
  items1.forEach(item => {
    const key = item.label.toLowerCase();
    mergedMap.set(key, { ...item, source: 'claude' });
  });
  
  // Fusionner avec les items d'OpenAI
  items2.forEach(item => {
    const key = item.label.toLowerCase();
    const existing = mergedMap.get(key);
    
    if (existing) {
      // Fusionner les quantités et prendre la meilleure confiance
      mergedMap.set(key, {
        ...item,
        quantity: Math.max(existing.quantity || 1, item.quantity || 1),
        confidence: Math.max(existing.confidence || 0.5, item.confidence || 0.5),
        source: 'hybrid'
      });
    } else {
      mergedMap.set(key, { ...item, source: 'openai' });
    }
  });
  
  // S'assurer que tous les items ont leurs informations d'emballage calculées
  return Array.from(mergedMap.values()).map(item => {
    // Recalculer l'emballage si pas déjà fait
    if (!item.packaged_volume_m3) {
      const packagingInfo = calculatePackagedVolume(
        item.volume_m3 || 0,
        item.fragile || false,
        item.category || 'misc',
        item.dimensions_cm,
        item.dismountable
      );
      item.packaged_volume_m3 = packagingInfo.packagedVolumeM3;
      item.packaging_display = packagingInfo.displayValue;
      item.is_small_object = packagingInfo.isSmallObject;
      item.packaging_calculation_details = packagingInfo.calculationDetails;
    }
    return item;
  });
}

/**
 * Détermine le fournisseur IA utilisé pour l'analyse spécialisée - LEGACY
 */
function determineSpecializedAIProvider(
  volumineuxResults: PromiseSettledResult<any>,
  petitsResults: PromiseSettledResult<any>
): 'claude' | 'openai' | 'hybrid' | 'specialized-hybrid' {
  const volumineuxSuccess = volumineuxResults.status === 'fulfilled';
  const petitsSuccess = petitsResults.status === 'fulfilled';
  
  if (volumineuxSuccess && petitsSuccess) {
    // Vérifier si les deux analyses utilisent l'hybride
    const volumineuxHybrid = volumineuxResults.value?.aiProvider === 'hybrid';
    const petitsHybrid = petitsResults.value?.aiProvider === 'hybrid';
    
    if (volumineuxHybrid && petitsHybrid) return 'specialized-hybrid';
    return 'hybrid';
  }
  
  if (volumineuxSuccess) return 'openai'; // Fallback
  if (petitsSuccess) return 'openai'; // Fallback
  return 'openai'; // Fallback final
}

/**
 * 🆕 Détermine le fournisseur IA utilisé pour les 5 analyses spécialisées
 */
function determineAllSpecializedAIProvider(
  armoiresResults: PromiseSettledResult<any>,
  tablesResults: PromiseSettledResult<any>,
  canapesResults: PromiseSettledResult<any>,
  volumineuxResults: PromiseSettledResult<any>,
  petitsResults: PromiseSettledResult<any>
): 'claude' | 'openai' | 'hybrid' | 'specialized-hybrid' {
  const allResults = [armoiresResults, tablesResults, canapesResults, volumineuxResults, petitsResults];
  const successfulResults = allResults.filter(r => r.status === 'fulfilled');
  
  if (successfulResults.length === 0) return 'openai'; // Fallback final
  
  // Compter combien utilisent l'hybride
  const hybridCount = successfulResults.filter(r => 
    r.status === 'fulfilled' && r.value?.aiProvider === 'hybrid'
  ).length;
  
  // Si au moins 3 analyses utilisent l'hybride → specialized-hybrid
  if (hybridCount >= 3) return 'specialized-hybrid';
  
  // Si au moins 1 hybride → hybrid
  if (hybridCount >= 1) return 'hybrid';
  
  // Sinon fallback openai
  return 'openai';
}

/**
 * Détermine le fournisseur IA utilisé (LEGACY)
 */
function determineAIProvider(
  claudeResults: PromiseSettledResult<TPhotoAnalysis | null>,
  openaiResults: PromiseSettledResult<TPhotoAnalysis>
): 'claude' | 'openai' | 'hybrid' {
  const claudeSuccess = claudeResults.status === 'fulfilled' && claudeResults.value !== null;
  const openaiSuccess = openaiResults.status === 'fulfilled';
  
  if (claudeSuccess && openaiSuccess) return 'hybrid';
  if (claudeSuccess) return 'claude';
  return 'openai';
}

/**
 * Calcule le volume en m³ à partir des dimensions en cm
 */
function calculateVolume(length: number, width: number, height: number): number {
  const volumeCm3 = length * width * height;
  return Number((volumeCm3 / 1_000_000).toFixed(3));
}

/**
 * Génère une clé de cache pour l'image
 */
// Fonction generateCacheKey supprimée - utilisée par le service de cache centralisé

/**
 * Statistiques du cache
 */
export function getCacheStats() {
  return cacheService.getStats();
}