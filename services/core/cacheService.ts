// services/core/cacheService.ts
// Service de cache centralisé avec TTL et gestion mémoire

import { config } from '../../config/app';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTtl: number;

  constructor() {
    this.maxSize = config.cache.maxSize;
    this.defaultTtl = config.cache.ttl;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Nettoyer le cache si nécessaire
    this.cleanup();

    // Supprimer l'ancienne entrée si elle existe
    this.cache.delete(key);

    // Ajouter la nouvelle entrée
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    });

    console.log(`[CACHE] Stored: ${key.substring(0, 8)}... (${this.cache.size}/${this.maxSize})`);
  }

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      console.log(`[CACHE] Expired: ${key.substring(0, 8)}...`);
      return null;
    }

    console.log(`[CACHE] Hit: ${key.substring(0, 8)}...`);
    return entry.data;
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
    console.log('[CACHE] Cleared all entries');
  }

  /**
   * Retourne la taille actuelle du cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 8) + '...',
      age: now - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Implémenter le calcul du hit rate
      entries
    };
  }

  /**
   * Nettoie les entrées expirées et respecte la taille maximale
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    const entries = Array.from(this.cache.entries());

    // Identifier les entrées expirées
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    // Supprimer les entrées expirées
    expiredKeys.forEach(key => this.cache.delete(key));

    // Si on dépasse encore la taille max, supprimer les plus anciennes
    if (this.cache.size > this.maxSize) {
      const sortedEntries = entries
        .filter(([key]) => !expiredKeys.includes(key))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = sortedEntries.slice(0, this.cache.size - this.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    if (expiredKeys.length > 0) {
      console.log(`[CACHE] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Génère une clé de cache basée sur le contenu
   */
  generateKey(prefix: string, data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = this.simpleHash(content);
    return `${prefix}:${hash}`;
  }

  /**
   * Hash simple pour les clés de cache
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Instance singleton du service de cache
export const cacheService = new CacheService();

// Fonctions utilitaires pour les types courants
export function cacheAnalysisResult<T>(key: string, result: T, ttl?: number): void {
  cacheService.set(key, result, ttl);
}

export function getCachedAnalysisResult<T>(key: string): T | null {
  return cacheService.get<T>(key);
}

export function generateAnalysisCacheKey(imageUrl: string, analysisType: string = 'default'): string {
  return cacheService.generateKey(`analysis:${analysisType}`, imageUrl);
}

