import { TPhotoAnalysis } from '@/lib/schemas';
import { validateShapesWithOpenCV } from './geometricValidation';

/**
 * Analyse d'image hybride : OpenAI + Validation géométrique
 * Exploite la puissance du serveur pour une analyse parallèle
 */
export async function analyzePhotoWithHybridVision(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<TPhotoAnalysis> {
  const startTime = Date.now();
  
  try {
    // 1. Vérifier le cache d'abord
    const cacheKey = generateCacheKey(opts.imageUrl);
    const cached = analysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`Cached analysis for ${cacheKey.substring(0, 8)}...`);
      return { ...cached.result, photo_id: opts.photoId };
    }
    
    // 2. Utiliser OpenAI GPT-4o-mini (fonctionne parfaitement)
    const { originalAnalyzePhotoWithVision } = await import('./openaiVision');
    const aiResults = await originalAnalyzePhotoWithVision(opts);
    
    // 3. Préparer l'image pour la validation géométrique
    const imageBuffer = await prepareImageBuffer(opts.imageUrl);
    
    // 4. Validation géométrique en parallèle (si l'image est disponible)
    let geometricResults;
    if (imageBuffer) {
      try {
        geometricResults = await validateShapesWithOpenCV(imageBuffer, aiResults);
        console.log(`Validation géométrique terminée en ${geometricResults.processingTime}ms`);
      } catch (error) {
        console.warn('Erreur lors de la validation géométrique:', error);
        geometricResults = null;
      }
    }
    
    // 5. Fusionner les résultats
    const finalResults = geometricResults 
      ? mergeAnalysisResults(aiResults, geometricResults)
      : aiResults;
    
    // 6. Mettre en cache le résultat
    analysisCache.set(cacheKey, {
      result: finalResults,
      timestamp: Date.now()
    });
    
    // 7. Nettoyer le cache si nécessaire
    if (analysisCache.size > MAX_CACHE_SIZE) {
      const oldestKey = analysisCache.keys().next().value;
      if (oldestKey) {
        analysisCache.delete(oldestKey);
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Analyse hybride terminée en ${totalTime}ms (IA: ${aiResults.items.length} objets, Validation: ${geometricResults?.correctedItems.length || 0} objets)`);
    
    return finalResults;
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse hybride:', error);
    // Fallback vers l'analyse OpenAI seule
    const { originalAnalyzePhotoWithVision } = await import('./openaiVision');
    return await originalAnalyzePhotoWithVision(opts);
  }
}

/**
 * Prépare le buffer d'image à partir de l'URL
 */
async function prepareImageBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    if (imageUrl.startsWith('data:')) {
      // Image Base64
      const base64Data = imageUrl.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    } else if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('/uploads/')) {
      // Fichier local
      const fs = await import('fs');
      const path = await import('path');
      const filePath = imageUrl.startsWith('/uploads/') 
        ? path.join(process.cwd(), imageUrl)
        : path.join(process.cwd(), imageUrl.replace('http://localhost:3000', ''));
      
      return fs.readFileSync(filePath);
    }
    
    return null;
  } catch (error) {
    console.warn('Impossible de préparer l\'image pour la validation géométrique:', error);
    return null;
  }
}

/**
 * Fusionne les résultats de l'IA et de la validation géométrique
 */
function mergeAnalysisResults(
  aiResults: TPhotoAnalysis,
  geometricResults: { correctedItems: any[]; confidence: number; processingTime: number }
): TPhotoAnalysis {
  // Créer un map des objets corrigés par label
  const correctedMap = new Map();
  geometricResults.correctedItems.forEach(item => {
    correctedMap.set(item.label, item);
  });
  
  // Fusionner les résultats
  const mergedItems = aiResults.items.map(aiItem => {
    const correctedItem = correctedMap.get(aiItem.label);
    
    if (correctedItem && correctedItem.dimensions_cm.source === 'geometric_validation') {
      // Utiliser les dimensions corrigées par la validation géométrique
      return {
        ...aiItem,
        dimensions_cm: correctedItem.dimensions_cm,
        volume_m3: correctedItem.volume_m3,
        notes: correctedItem.notes,
        confidence: Math.min(aiItem.confidence + 0.1, 1.0) // Augmenter légèrement la confiance
      };
    }
    
    return aiItem;
  });
  
  // Recalculer les totaux
  const totals = {
    count_items: mergedItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    volume_m3: Number(mergedItems.reduce((sum, item) => sum + (item.volume_m3 || 0) * (item.quantity || 1), 0).toFixed(3))
  };
  
  // Ajouter des informations sur la validation géométrique
  const warnings = [
    ...(aiResults.warnings || []),
    `Validation géométrique: ${geometricResults.correctedItems.length} objets corrigés (${geometricResults.processingTime}ms)`
  ];
  
  return {
    ...aiResults,
    items: mergedItems,
    totals,
    warnings
  };
}

/**
 * Analyse d'image optimisée pour serveur puissant
 * Traite plusieurs images en parallèle
 */
export async function analyzeMultiplePhotos(
  photos: Array<{ photoId: string; imageUrl: string }>
): Promise<TPhotoAnalysis[]> {
  console.log(`Début de l'analyse parallèle de ${photos.length} photos`);
  
  // Traiter toutes les photos en parallèle
  const results = await Promise.all(
    photos.map(photo => analyzePhotoWithHybridVision(photo))
  );
  
  console.log(`Analyse parallèle terminée: ${results.length} photos traitées`);
  return results;
}

/**
 * Analyse d'image avec cache intelligent
 * Utilise la mémoire du serveur pour optimiser les performances
 */
const analysisCache = new Map<string, { result: TPhotoAnalysis; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure (plus long pour les images identiques)
const MAX_CACHE_SIZE = 200; // Plus d'entrées en cache

export async function analyzePhotoWithCache(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<TPhotoAnalysis> {
  // Générer une clé de cache basée sur l'URL de l'image
  const cacheKey = generateCacheKey(opts.imageUrl);
  
  // Vérifier le cache
  const cached = analysisCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`Cache hit pour ${opts.photoId}`);
    return { ...cached.result, photo_id: opts.photoId };
  }
  
  // Analyser l'image
  const result = await analyzePhotoWithHybridVision(opts);
  
  // Mettre en cache
  analysisCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  
  // Nettoyer le cache si nécessaire (garder max 100 entrées)
  if (analysisCache.size > 100) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) {
      analysisCache.delete(oldestKey);
    }
  }
  
  return result;
}

/**
 * Génère une clé de cache pour l'image
 */
function generateCacheKey(imageUrl: string): string {
  if (imageUrl.startsWith('data:')) {
    // Pour les images Base64, utiliser un hash des premières données
    const base64Data = imageUrl.split(',')[1];
    // Utiliser un hash plus court mais plus fiable
    const crypto = require('crypto');
    return `base64_${crypto.createHash('md5').update(base64Data).digest('hex').substring(0, 16)}`;
  } else {
    // Pour les URLs, utiliser l'URL complète
    return `url_${imageUrl}`;
  }
}
