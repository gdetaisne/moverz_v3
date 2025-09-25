import { TPhotoAnalysis } from "./schemas";

// Cache en mémoire simple (pour MVP)
// En production, utiliser Redis ou une DB
const analysisCache = new Map<string, TPhotoAnalysis>();

export function getCachedAnalysis(imageHash: string): TPhotoAnalysis | null {
  return analysisCache.get(imageHash) || null;
}

export function setCachedAnalysis(imageHash: string, analysis: TPhotoAnalysis): void {
  // Limiter la taille du cache à 100 entrées max
  if (analysisCache.size >= 100) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
  analysisCache.set(imageHash, analysis);
}

export function clearCache(): void {
  analysisCache.clear();
}

export function getCacheStats() {
  return {
    size: analysisCache.size,
    maxSize: 100,
    hitRate: 'N/A' // Simple cache, pas de tracking des hits
  };
}
