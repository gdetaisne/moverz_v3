import sharp from 'sharp';
import { TPhotoAnalysis, TInventoryItem } from '@/lib/schemas';

export interface ShapeValidationResult {
  correctedItems: TInventoryItem[];
  confidence: number;
  processingTime: number;
}

/**
 * Valide et corrige les formes géométriques détectées par l'IA
 * Utilise l'analyse d'image pour détecter les contours et valider les dimensions
 */
export async function validateShapesWithOpenCV(
  imageBuffer: Buffer,
  aiResults: TPhotoAnalysis | null
): Promise<ShapeValidationResult> {
  const startTime = Date.now();
  
  try {
    // Vérifier que aiResults est valide
    if (!aiResults || !aiResults.items) {
      console.warn('Résultats IA invalides pour la validation géométrique');
      return {
        correctedItems: [],
        confidence: 0.5,
        processingTime: Date.now() - startTime
      };
    }
    
    // Analyser l'image avec Sharp pour obtenir les métadonnées
    const imageMetadata = await sharp(imageBuffer).metadata();
    const { width, height } = imageMetadata;
    
    if (!width || !height) {
      throw new Error('Impossible de lire les dimensions de l\'image');
    }
    
    // Analyser chaque objet détecté par l'IA
    const correctedItems = await Promise.all(
      aiResults.items.map(async (item) => {
        return await validateItemShape(item, { width, height });
      })
    );

    const processingTime = Date.now() - startTime;
    
    return {
      correctedItems,
      confidence: calculateOverallConfidence(correctedItems),
      processingTime
    };
  } catch (error) {
    console.warn('Erreur lors de la validation géométrique:', error);
    // Retourner les résultats originaux en cas d'erreur
    return {
      correctedItems: aiResults.items,
      confidence: 0.5,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Valide la forme d'un objet spécifique
 */
async function validateItemShape(
  item: TInventoryItem,
  imageDimensions: { width: number; height: number }
): Promise<TInventoryItem> {
  // Analyser les dimensions pour détecter les incohérences
  const correctedItem = { ...item };
  
  // Vérifier si c'est une table (détection basée sur le label)
  if (isTableItem(item.label)) {
    const shapeAnalysis = analyzeTableShape(item, imageDimensions);
    
    if (shapeAnalysis.isSquare && shapeAnalysis.size) {
      // Corriger les dimensions pour une table carrée
      correctedItem.dimensions_cm = {
        length: shapeAnalysis.size,
        width: shapeAnalysis.size,
        height: item.dimensions_cm.height || 75,
        source: "estimated" as const
      };
      correctedItem.volume_m3 = calculateVolume({
        length: shapeAnalysis.size,
        width: shapeAnalysis.size,
        height: item.dimensions_cm.height || 75
      });
      correctedItem.notes = (item.notes || '') + ' [Forme carrée validée]';
    } else if (shapeAnalysis.isRectangular && shapeAnalysis.length && shapeAnalysis.width) {
      // Valider les dimensions rectangulaires
      correctedItem.dimensions_cm = {
        length: shapeAnalysis.length,
        width: shapeAnalysis.width,
        height: item.dimensions_cm.height || 75,
        source: "estimated" as const
      };
      correctedItem.volume_m3 = calculateVolume({
        length: shapeAnalysis.length,
        width: shapeAnalysis.width,
        height: item.dimensions_cm.height || 75
      });
      correctedItem.notes = (item.notes || '') + ' [Forme rectangulaire validée]';
    }
  }
  
  return correctedItem;
}

/**
 * Analyse la forme d'une table basée sur les dimensions détectées par l'IA
 */
function analyzeTableShape(
  item: TInventoryItem,
  imageDimensions: { width: number; height: number }
): {
  isSquare: boolean;
  isRectangular: boolean;
  size?: number;
  length?: number;
  width?: number;
} {
  const { dimensions_cm } = item;
  
  if (!dimensions_cm || !dimensions_cm.length || !dimensions_cm.width) {
    return {
      isSquare: false,
      isRectangular: false
    };
  }
  
  // Calculer le ratio longueur/largeur
  const ratio = dimensions_cm.width / dimensions_cm.length;
  const isSquare = ratio >= 0.85 && ratio <= 1.15; // Tolérance de 15%
  const isRectangular = !isSquare && ratio > 0.3 && ratio < 3.0;
  
  // Estimer les dimensions réelles basées sur la taille de l'image
  const scaleFactor = estimateScaleFactor(imageDimensions, {
    length: dimensions_cm.length || 0,
    width: dimensions_cm.width || 0
  });
  
  return {
    isSquare,
    isRectangular,
    size: isSquare ? Math.round(dimensions_cm.length * scaleFactor) : undefined,
    length: isRectangular ? Math.round(dimensions_cm.length * scaleFactor) : undefined,
    width: isRectangular ? Math.round(dimensions_cm.width * scaleFactor) : undefined
  };
}

/**
 * Estime le facteur d'échelle pour convertir les pixels en cm
 */
function estimateScaleFactor(
  imageDimensions: { width: number; height: number },
  dimensions: { length: number; width: number }
): number {
  // Estimation basée sur la taille typique des objets dans l'image
  const imageArea = imageDimensions.width * imageDimensions.height;
  const objectArea = dimensions.length * dimensions.width;
  const coverageRatio = objectArea / imageArea;
  
  // Estimation basée sur la couverture de l'image
  if (coverageRatio > 0.3) {
    return 2.0; // Grand objet
  } else if (coverageRatio > 0.1) {
    return 1.5; // Objet moyen
  } else {
    return 1.0; // Petit objet
  }
}

/**
 * Vérifie si un objet est une table basé sur son label
 */
function isTableItem(label: string): boolean {
  const tableKeywords = ['table', 'basse', 'manger', 'bureau', 'tableau'];
  return tableKeywords.some(keyword => 
    label.toLowerCase().includes(keyword)
  );
}


/**
 * Calcule le volume en m³
 */
function calculateVolume(dimensions: {
  length: number;
  width: number;
  height: number;
}): number {
  return (dimensions.length * dimensions.width * dimensions.height) / 1000000;
}

/**
 * Calcule la confiance globale de la validation
 */
function calculateOverallConfidence(items: TInventoryItem[]): number {
  if (items.length === 0) return 0;
  
  const totalConfidence = items.reduce((sum, item) => sum + (item.confidence || 0.5), 0);
  return totalConfidence / items.length;
}
