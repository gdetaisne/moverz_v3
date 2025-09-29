import { TPhotoAnalysis } from '@/lib/schemas';
import { analyzePhotoWithClaude } from './claudeVision';
import { originalAnalyzePhotoWithVision } from './openaiVision';
import { optimizeImageForAI } from '@/lib/imageOptimization';
import crypto from 'crypto';

export interface OptimizedAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid';
  roomDetection?: {
    roomType: string;
    confidence: number;
    reasoning: string;
  };
}

// Cache intelligent
const analysisCache = new Map<string, { result: OptimizedAnalysisResult; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure
const MAX_CACHE_SIZE = 500;

/**
 * Analyse optimisée avec double validation IA
 */
export async function analyzePhotoWithOptimizedVision(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<OptimizedAnalysisResult> {
  const startTime = Date.now();
  const cacheKey = generateCacheKey(opts.imageUrl);
  
  try {
    // 1. Vérifier le cache
    const cached = analysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`Cache hit pour ${cacheKey.substring(0, 8)}...`);
      return { ...cached.result, photo_id: opts.photoId };
    }

    // 2. Analyse hybride Claude + OpenAI (seulement si Claude est configuré)
    const isClaudeConfigured = !!process.env.CLAUDE_API_KEY;
    
    const [claudeResults, openaiResults] = await Promise.allSettled([
      // Claude 3.5 Haiku (1ère passe rapide) - seulement si configuré
      isClaudeConfigured ? analyzePhotoWithClaude(opts) : Promise.resolve(null),
      // OpenAI GPT-4o-mini (2ème passe précise)
      originalAnalyzePhotoWithVision(opts)
    ]);

    // 3. Fusionner les résultats des deux IA
    const finalResults = mergeAIResults(
      claudeResults.status === 'fulfilled' ? claudeResults.value : null,
      openaiResults.status === 'fulfilled' ? openaiResults.value : null
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
      aiProvider: determineAIProvider(claudeResults, openaiResults),
      photo_id: opts.photoId,
      roomDetection
    };

    // 7. Mettre en cache
    analysisCache.set(cacheKey, { result, timestamp: Date.now() });

    // 8. Nettoyer le cache si nécessaire
    if (analysisCache.size > MAX_CACHE_SIZE) {
      const oldestKey = analysisCache.keys().next().value;
      if (oldestKey) {
        analysisCache.delete(oldestKey);
      }
    }

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
 * Fusionne les résultats de Claude et OpenAI
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
    items: mergedItems,
    special_rules: specialRules,
    warnings,
    errors: [...(claudeResults.errors || []), ...(openaiResults.errors || [])],
    totals,
    file_url: openaiResults.file_url || claudeResults.file_url
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
  
  return Array.from(mergedMap.values());
}

/**
 * Détermine le fournisseur IA utilisé
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
function generateCacheKey(imageUrl: string): string {
  if (imageUrl.startsWith('data:')) {
    const base64Data = imageUrl.split(',')[1];
    const hash = crypto.createHash('md5').update(base64Data).digest('hex').substring(0, 16);
    return `base64_${hash}`;
  } else {
    return `url_${imageUrl}`;
  }
}

/**
 * Statistiques du cache
 */
export function getCacheStats(): { size: number; hitRate: number } {
  return {
    size: analysisCache.size,
    hitRate: 0 // TODO: Implémenter le calcul du hit rate
  };
}