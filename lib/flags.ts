/**
 * Feature flags pour A/B test du classifieur de pièces
 * LOT 18 - Room Classifier A/B Testing
 */

import crypto from 'crypto';

/**
 * Configuration des feature flags
 */
export interface ABTestConfig {
  enabled: boolean;
  split: number; // 0-100, pourcentage de trafic en variante B
}

/**
 * Variants du classifieur
 */
export type ClassifierVariant = 'A' | 'B';

/**
 * Récupère l'état du flag A/B pour le classifieur
 */
export function isAbEnabled(): boolean {
  const envValue = process.env.ROOM_CLASSIFIER_AB_ENABLED;
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  return false; // Default: désactivé
}

/**
 * Récupère le pourcentage de split A/B (0-100)
 * Protégé contre les valeurs hors bornes
 */
export function getAbSplit(): number {
  const envValue = process.env.ROOM_CLASSIFIER_AB_SPLIT;
  if (envValue !== undefined) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed)) {
      // Cap entre 0 et 100
      return Math.max(0, Math.min(100, parsed));
    }
  }
  return 10; // Default: 10% en variante B
}

/**
 * Choisit la variante A ou B de manière déterministe
 * basée sur un seed (userId, batchId, etc.)
 * 
 * Utilise un hash MD5 du seed pour obtenir un pourcentage stable.
 * Si le flag est désactivé, retourne toujours 'A'.
 * 
 * @param seed - Identifiant stable (userId, batchId, photoId, etc.)
 * @returns 'A' (baseline) ou 'B' (candidate)
 */
export function chooseVariant(seed: string): ClassifierVariant {
  // Si le flag est désactivé, toujours A
  if (!isAbEnabled()) {
    return 'A';
  }

  const split = getAbSplit();
  
  // Split à 0% ou 100% : cas simples
  if (split === 0) return 'A';
  if (split === 100) return 'B';

  // Hash MD5 du seed pour obtenir un nombre déterministe
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  
  // Prendre les 8 premiers caractères et les convertir en nombre
  const hashInt = parseInt(hash.substring(0, 8), 16);
  
  // Normaliser entre 0-100
  const percentage = hashInt % 100;
  
  // Si percentage < split, on est dans le groupe B
  return percentage < split ? 'B' : 'A';
}

/**
 * Configuration complète du test A/B
 */
export function getAbTestConfig(): ABTestConfig {
  return {
    enabled: isAbEnabled(),
    split: getAbSplit(),
  };
}



