import { TPhotoAnalysis } from '@/lib/schemas';
import { analyzePhotoWithClaude } from './claudeVision';
import { originalAnalyzePhotoWithVision } from './openaiVision';
import { analyzeVolumineuxHybrid } from './volumineuxAnalysis';
import { analyzePetitsHybrid } from './petitsAnalysis';
import { optimizeImageForAI } from '@/lib/imageOptimization';
import { calculatePackagedVolume } from '@/lib/packaging';
import { validateAllMeasurements } from '@/lib/measurementValidation';
import { safeApiCall, createErrorHandler, APIError } from './core/errorHandling';
import { cacheService, generateAnalysisCacheKey, cacheAnalysisResult, getCachedAnalysisResult } from './core/cacheService';
import { config } from '../config/app';
import crypto from 'crypto';

export interface OptimizedAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid' | 'specialized-hybrid';
  roomDetection?: {
    roomType: string;
    confidence: number;
    reasoning: string;
  };
  analysisType?: 'legacy' | 'specialized';
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

    // 2. NOUVELLE APPROCHE : Analyse hybride spécialisée par catégorie
    console.log("🚀 Lancement de l'analyse hybride spécialisée...");
    
    const [volumineuxResults, petitsResults] = await Promise.allSettled([
      // Analyse VOLUMINEUX : Claude + OpenAI sur gros objets (>50cm)
      safeApiCall(() => analyzeVolumineuxHybrid(opts), 'VolumineuxAnalysis'),
      // Analyse PETITS : Claude + OpenAI sur petits objets (<50cm)
      safeApiCall(() => analyzePetitsHybrid(opts), 'PetitsAnalysis')
    ]);

    // 3. Fusionner les résultats des deux analyses spécialisées
    const finalResults = mergeSpecializedResults(
      volumineuxResults.status === 'fulfilled' ? volumineuxResults.value : null,
      petitsResults.status === 'fulfilled' ? petitsResults.value : null
    );

    // 4. Recalculer le volume pour tous les objets (correction des erreurs IA)
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

    // 5. Détection de pièce désactivée (faite en parallèle dans l'API)
    const roomDetection = {
      roomType: 'pièce inconnue',
      confidence: 0.1,
      reasoning: 'Détection de pièce gérée en parallèle'
    };

    // 6. Ajouter les métadonnées d'analyse
    const processingTime = Date.now() - startTime;
    const result: OptimizedAnalysisResult = {
      ...correctedResults,
      processingTime,
      aiProvider: determineSpecializedAIProvider(volumineuxResults, petitsResults),
      analysisType: 'specialized',
      photo_id: opts.photoId,
      roomDetection
    };

    // 7. Mettre en cache
    cacheAnalysisResult(cacheKey, result, config.cache.ttl);

    console.log(`Analyse optimisée terminée en ${processingTime}ms (${result.aiProvider})`);
    return result;

  } catch (error) {
    console.error('Erreur lors de l\'analyse optimisée:', error);
    // Fallback vers OpenAI seul
    const fallbackResult = await originalAnalyzePhotoWithVision(opts);
    return {
      ...fallbackResult,
      processingTime: Date.now() - startTime,
      aiProvider: 'openai',
      photo_id: opts.photoId
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
 * Fusionne les résultats des analyses spécialisées (volumineux + petits)
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
 * Détermine le fournisseur IA utilisé pour l'analyse spécialisée
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