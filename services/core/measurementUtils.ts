// services/core/measurementUtils.ts
// Utilitaires de mesure centralisés pour éviter la duplication

export interface MeasurementDimensions {
  length: number;
  width: number;
  height: number;
}

export interface MeasurementResult {
  dimensions: MeasurementDimensions;
  confidence: number;
  reasoning: string;
  source: 'estimated' | 'catalog' | 'api' | 'fallback';
}

/**
 * Dimensions par défaut par catégorie d'objets
 */
export function getEstimatedDimensions(category: string): MeasurementDimensions {
  const estimates: { [key: string]: MeasurementDimensions } = {
    'furniture': { length: 100, width: 50, height: 80 },
    'appliance': { length: 60, width: 40, height: 50 },
    'art': { length: 30, width: 20, height: 40 },
    'box': { length: 40, width: 30, height: 30 },
    'misc': { length: 25, width: 25, height: 25 }
  };
  
  return estimates[category] || estimates['misc'];
}

/**
 * Valide et corrige les dimensions selon le type d'objet
 */
export function validateObjectDimensions(
  dimensions: MeasurementDimensions,
  objectLabel: string,
  category: string
): MeasurementDimensions {
  let { length, width, height } = dimensions;
  
  // Règles de validation par type d'objet
  if (objectLabel.toLowerCase().includes('chaise')) {
    length = Math.max(40, Math.min(length, 60));
    width = Math.max(40, Math.min(width, 60));
    height = Math.max(70, Math.min(height, 100));
  } else if (objectLabel.toLowerCase().includes('table')) {
    height = Math.max(60, Math.min(height, 80));
  } else if (objectLabel.toLowerCase().includes('armoire')) {
    width = Math.max(50, Math.min(width, 70));
    height = Math.max(180, Math.min(height, 220));
  }

  // Validation générale
  length = Math.max(10, Math.min(length, 300));
  width = Math.max(10, Math.min(width, 200));
  height = Math.max(10, Math.min(height, 250));

  return { length, width, height };
}

/**
 * Calcule le volume en m³ à partir des dimensions en cm
 */
export function calculateVolumeFromDimensions(dimensions: MeasurementDimensions): number {
  const volumeCm3 = dimensions.length * dimensions.width * dimensions.height;
  return Number((volumeCm3 / 1_000_000).toFixed(3));
}

/**
 * Vérifie si les dimensions sont valides
 */
export function hasValidDimensions(dimensions: MeasurementDimensions | null | undefined): boolean {
  if (!dimensions) return false;
  
  return dimensions.length > 0 && 
         dimensions.width > 0 && 
         dimensions.height > 0 &&
         dimensions.length < 1000 &&
         dimensions.width < 1000 &&
         dimensions.height < 1000;
}

/**
 * Crée des dimensions par défaut pour un objet
 */
export function createDefaultDimensions(
  objectLabel: string,
  category: string,
  source: MeasurementResult['source'] = 'fallback'
): MeasurementResult {
  const dimensions = getEstimatedDimensions(category);
  const validatedDimensions = validateObjectDimensions(dimensions, objectLabel, category);
  
  return {
    dimensions: validatedDimensions,
    confidence: 0.3,
    reasoning: `Dimensions par défaut pour ${category}`,
    source
  };
}

