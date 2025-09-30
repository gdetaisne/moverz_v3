// lib/measurementValidation.ts
// Système de validation et correction des mesures d'objets

export interface MeasurementValidation {
  isValid: boolean;
  confidence: number;
  correctedDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  reasoning: string;
}

/**
 * Valide et corrige les dimensions d'un objet basé sur des règles de bon sens
 */
export function validateObjectMeasurements(
  label: string,
  category: string,
  dimensions: { length: number; width: number; height: number },
  confidence: number
): MeasurementValidation {
  const { length, width, height } = dimensions;
  
  // Règles de validation par catégorie
  const rules = getValidationRules(category, label);
  
  // Vérifier les dimensions minimales et maximales
  const minDimension = Math.min(length, width, height);
  const maxDimension = Math.max(length, width, height);
  
  // Validation de base
  if (minDimension < 5) {
    // Essayer de corriger les mesures trop petites
    const correctedDimensions = {
      length: Math.max(length, 10),
      width: Math.max(width, 10),
      height: Math.max(height, 5)
    };
    
    return {
      isValid: false,
      confidence: 0.3,
      correctedDimensions,
      reasoning: `Objet trop petit (${minDimension}cm) - dimensions corrigées`
    };
  }
  
  if (maxDimension > 500) {
    return {
      isValid: false,
      confidence: 0.1,
      correctedDimensions: {
        length: Math.min(length, 300),
        width: Math.min(width, 300),
        height: Math.min(height, 300)
      },
      reasoning: `Objet trop grand (${maxDimension}cm) - dimensions corrigées`
    };
  }
  
  // Validation par catégorie
  const categoryValidation = validateByCategory(label, category, dimensions, rules);
  if (!categoryValidation.isValid) {
    return categoryValidation;
  }
  
  // Validation des proportions
  const proportionValidation = validateProportions(dimensions, rules);
  if (!proportionValidation.isValid) {
    return proportionValidation;
  }
  
  // Si tout est valide, augmenter la confidence
  const finalConfidence = Math.min(confidence * 1.1, 0.95);
  
  return {
    isValid: true,
    confidence: finalConfidence,
    reasoning: 'Dimensions validées et cohérentes'
  };
}

/**
 * Règles de validation par catégorie d'objets
 */
function getValidationRules(category: string, label: string) {
  const rules: any = {
    furniture: {
      minLength: 30,
      maxLength: 300,
      minWidth: 20,
      maxWidth: 200,
      minHeight: 20,
      maxHeight: 250,
      maxRatio: 8 // ratio longueur/largeur max
    },
    appliance: {
      minLength: 40,
      maxLength: 200,
      minWidth: 30,
      maxWidth: 100,
      minHeight: 30,
      maxHeight: 200,
      maxRatio: 6
    },
    art: {
      minLength: 10,
      maxLength: 150,
      minWidth: 5,
      maxWidth: 100,
      minHeight: 1,
      maxHeight: 150,
      maxRatio: 10
    },
    misc: {
      minLength: 5,
      maxLength: 200,
      minWidth: 5,
      maxWidth: 150,
      minHeight: 5,
      maxHeight: 150,
      maxRatio: 8
    }
  };
  
  // Règles spéciales pour certains objets
  if (label.toLowerCase().includes('chaise')) {
    return {
      ...rules.furniture,
      maxHeight: 120,
      minHeight: 70
    };
  }
  
  if (label.toLowerCase().includes('table')) {
    return {
      ...rules.furniture,
      minHeight: 60,
      maxHeight: 120
    };
  }
  
  if (label.toLowerCase().includes('armoire') || label.toLowerCase().includes('placard')) {
    return {
      ...rules.furniture,
      maxHeight: 250,
      minHeight: 150
    };
  }
  
  return rules[category] || rules.misc;
}

/**
 * Valide les dimensions selon la catégorie
 */
function validateByCategory(
  label: string,
  category: string,
  dimensions: { length: number; width: number; height: number },
  rules: any
): MeasurementValidation {
  const { length, width, height } = dimensions;
  
  // Vérifier les limites de la catégorie
  if (length < rules.minLength || length > rules.maxLength) {
    return {
      isValid: false,
      confidence: 0.3,
      correctedDimensions: {
        length: Math.max(rules.minLength, Math.min(length, rules.maxLength)),
        width,
        height
      },
      reasoning: `Longueur ${length}cm hors limites pour ${category} (${rules.minLength}-${rules.maxLength}cm)`
    };
  }
  
  if (width < rules.minWidth || width > rules.maxWidth) {
    return {
      isValid: false,
      confidence: 0.3,
      correctedDimensions: {
        length,
        width: Math.max(rules.minWidth, Math.min(width, rules.maxWidth)),
        height
      },
      reasoning: `Largeur ${width}cm hors limites pour ${category} (${rules.minWidth}-${rules.maxWidth}cm)`
    };
  }
  
  if (height < rules.minHeight || height > rules.maxHeight) {
    return {
      isValid: false,
      confidence: 0.3,
      correctedDimensions: {
        length,
        width,
        height: Math.max(rules.minHeight, Math.min(height, rules.maxHeight))
      },
      reasoning: `Hauteur ${height}cm hors limites pour ${category} (${rules.minHeight}-${rules.maxHeight}cm)`
    };
  }
  
  return { isValid: true, confidence: 0.8, reasoning: 'Dimensions cohérentes avec la catégorie' };
}

/**
 * Valide les proportions de l'objet
 */
function validateProportions(
  dimensions: { length: number; width: number; height: number },
  rules: any
): MeasurementValidation {
  const { length, width, height } = dimensions;
  
  // Vérifier le ratio longueur/largeur
  const lengthWidthRatio = Math.max(length, width) / Math.min(length, width);
  if (lengthWidthRatio > rules.maxRatio) {
    return {
      isValid: false,
      confidence: 0.4,
      reasoning: `Ratio longueur/largeur ${lengthWidthRatio.toFixed(1)} trop élevé (max ${rules.maxRatio})`
    };
  }
  
  // Vérifier que l'objet n'est pas trop plat
  const minDimension = Math.min(length, width, height);
  const maxDimension = Math.max(length, width, height);
  const flatnessRatio = maxDimension / minDimension;
  
  if (flatnessRatio > 20) {
    return {
      isValid: false,
      confidence: 0.2,
      reasoning: `Objet trop plat (ratio ${flatnessRatio.toFixed(1)}) - probablement mal mesuré`
    };
  }
  
  return { isValid: true, confidence: 0.8, reasoning: 'Proportions cohérentes' };
}

/**
 * Applique la validation à tous les items d'une analyse
 */
export function validateAllMeasurements(items: any[]): any[] {
  return items.map(item => {
    if (!item.dimensions_cm) return item;
    
    const validation = validateObjectMeasurements(
      item.label,
      item.category,
      item.dimensions_cm,
      item.confidence || 0.5
    );
    
    if (validation.isValid) {
      return {
        ...item,
        confidence: validation.confidence,
        measurement_validation: validation
      };
    } else if (validation.correctedDimensions) {
      return {
        ...item,
        dimensions_cm: validation.correctedDimensions,
        confidence: validation.confidence,
        measurement_validation: validation,
        volume_m3: calculateVolume(
          validation.correctedDimensions.length,
          validation.correctedDimensions.width,
          validation.correctedDimensions.height
        )
      };
    } else {
      // Garder l'objet mais avec une confidence très faible
      return {
        ...item,
        confidence: 0.1,
        measurement_validation: validation
      };
    }
  });
}

/**
 * Calcule le volume en m³
 */
function calculateVolume(length: number, width: number, height: number): number {
  const volumeCm3 = length * width * height;
  return Number((volumeCm3 / 1_000_000).toFixed(3));
}
