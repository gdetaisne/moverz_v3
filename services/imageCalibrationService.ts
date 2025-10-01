// services/imageCalibrationService.ts
// Service de calibration automatique d'image pour calculer l'échelle (cm/pixel)

import OpenAI from 'openai';
import { logger as loggingService } from './core/loggingService';
import { referenceObjectDetector, DetectedReference } from './referenceObjectDetector';

export interface ReferenceObject {
  type: 'door' | 'outlet' | 'tile' | 'switch' | 'baseboard';
  detectedName: string;
  standardDimension: number; // en cm
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pixelDimension?: number; // en pixels
}

export interface ImageCalibration {
  scaleFactor: number; // cm/pixel
  confidence: number;
  referenceObjects: ReferenceObject[];
  method: 'door' | 'outlet' | 'tile' | 'multi-object' | 'fallback';
  imageWidth?: number;
  imageHeight?: number;
  reasoning: string;
}

// Dimensions standard des objets de référence (en cm)
const REFERENCE_DIMENSIONS = {
  door: {
    width: 80,
    height: 200,
    confidence: 0.95
  },
  doorFrame: {
    width: 90,
    height: 210,
    confidence: 0.90
  },
  outlet: {
    width: 8,
    height: 8,
    distanceFromFloor: 15,
    confidence: 0.85
  },
  lightSwitch: {
    width: 8,
    height: 12,
    distanceFromFloor: 120,
    confidence: 0.85
  },
  tile: {
    standard30: 30,
    standard40: 40,
    standard60: 60,
    confidence: 0.80
  },
  baseboard: {
    height: 10,
    heightRange: [8, 15],
    confidence: 0.75
  }
};

export class ImageCalibrationService {
  private openaiClient: OpenAI;

  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Calibre une image en détectant automatiquement l'échelle
   * VERSION AMÉLIORÉE avec ReferenceObjectDetector
   */
  async calibrateImage(imageUrl: string): Promise<ImageCalibration> {
    try {
      loggingService.info('Début de la calibration d\'image (version améliorée)', 'ImageCalibrationService');

      // 1. AMÉLIORATION : Utiliser le détecteur spécialisé
      const detectionResult = await referenceObjectDetector.detectReferences(imageUrl);

      if (detectionResult.references.length === 0) {
        loggingService.warn('Aucun objet de référence détecté, utilisation du fallback', 'ImageCalibrationService');
        return this.getFallbackCalibration();
      }

      // 2. Filtrer les références de bonne qualité
      const goodReferences = referenceObjectDetector.filterByQuality(
        detectionResult.references,
        'fair' // Minimum 'fair' quality
      );

      if (goodReferences.length === 0) {
        loggingService.warn('Aucune référence de qualité suffisante', 'ImageCalibrationService');
        return this.getFallbackCalibration();
      }

      // 3. Trier par priorité
      const sortedReferences = referenceObjectDetector.sortByPriority(goodReferences);

      // 4. Convertir en format ReferenceObject
      const referenceObjects = this.convertToReferenceObjects(sortedReferences);

      // 5. Calculer l'échelle à partir des objets détectés
      const calibration = this.calculateScaleFromReferences(referenceObjects);

      loggingService.info(
        `Calibration réussie: échelle=${calibration.scaleFactor.toFixed(2)} cm/px, confiance=${calibration.confidence.toFixed(2)}, ${goodReferences.length} référence(s)`,
        'ImageCalibrationService'
      );

      return calibration;

    } catch (error) {
      loggingService.error('Erreur lors de la calibration', 'ImageCalibrationService', error);
      return this.getFallbackCalibration();
    }
  }

  /**
   * Convertit les références détectées en ReferenceObject
   */
  private convertToReferenceObjects(detectedRefs: DetectedReference[]): ReferenceObject[] {
    return detectedRefs.map(ref => {
      // Déterminer quelle dimension utiliser (width ou height selon le type)
      let pixelDimension = 0;
      let standardDimension = 0;

      if (ref.type === 'door' || ref.type === 'doorFrame') {
        // Pour les portes, utiliser la largeur (plus fiable)
        pixelDimension = ref.pixelDimensions.width;
        standardDimension = ref.standardDimension.width || 80;
      } else if (ref.type === 'baseboard') {
        // Pour les plinthes, utiliser la hauteur
        pixelDimension = ref.pixelDimensions.height;
        standardDimension = ref.standardDimension.height || 10;
      } else if (ref.type === 'tile') {
        // Pour le carrelage, utiliser la plus petite dimension (un carreau)
        pixelDimension = Math.min(ref.pixelDimensions.width, ref.pixelDimensions.height);
        standardDimension = ref.standardDimension.width || 30;
      } else {
        // Pour les autres, utiliser width si disponible, sinon height
        pixelDimension = ref.pixelDimensions.width || ref.pixelDimensions.height;
        standardDimension = ref.standardDimension.width || ref.standardDimension.height || 10;
      }

      return {
        type: ref.type as ReferenceObject['type'],
        detectedName: ref.label,
        standardDimension,
        confidence: ref.confidence,
        pixelDimension,
        boundingBox: {
          x: ref.pixelDimensions.x || 0,
          y: ref.pixelDimensions.y || 0,
          width: ref.pixelDimensions.width,
          height: ref.pixelDimensions.height
        }
      };
    });
  }

  /**
   * Détecte les objets de référence dans l'image avec GPT-4 Vision
   */
  private async detectReferenceObjects(imageUrl: string): Promise<ReferenceObject[]> {
    const detectionPrompt = `
Tu es un expert en détection d'objets de référence pour calibrer une image.

Analyse cette image et identifie TOUS les objets de référence suivants avec leurs dimensions en PIXELS :

OBJETS DE RÉFÉRENCE À DÉTECTER :
1. **PORTES** : 
   - Largeur standard : 80cm
   - Hauteur standard : 200cm
   - IMPORTANT : Mesure la largeur ET hauteur de la porte en pixels

2. **PRISES ÉLECTRIQUES** :
   - Dimensions : ~8cm x 8cm
   - Position : généralement 15cm du sol
   - IMPORTANT : Mesure la largeur en pixels

3. **CARRELAGE** :
   - Tailles courantes : 30x30cm, 40x40cm, 60x60cm
   - IMPORTANT : Mesure un carreau complet en pixels

4. **INTERRUPTEURS** :
   - Dimensions : ~8cm x 12cm
   - Position : généralement 120cm du sol

5. **PLINTHES** :
   - Hauteur : généralement 10-15cm
   - IMPORTANT : Mesure la hauteur en pixels

INSTRUCTIONS CRITIQUES :
- Pour chaque objet détecté, fournis les dimensions en PIXELS mesurées dans l'image
- Sois précis sur les mesures en pixels (utilise l'analyse visuelle)
- Indique ta confiance (0-1) pour chaque objet
- Si plusieurs objets du même type, liste-les tous

Réponds au format JSON strict :
{
  "references": [
    {
      "type": "door" | "outlet" | "tile" | "switch" | "baseboard",
      "detectedName": "string",
      "pixelWidth": number,
      "pixelHeight": number,
      "confidence": number,
      "notes": "string"
    }
  ]
}
`;

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: detectionPrompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ]
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      
      // Convertir le résultat en objets ReferenceObject
      const references: ReferenceObject[] = [];

      if (result.references && Array.isArray(result.references)) {
        for (const ref of result.references) {
          const referenceObject = this.createReferenceObject(ref);
          if (referenceObject) {
            references.push(referenceObject);
          }
        }
      }

      loggingService.info(
        `${references.length} objet(s) de référence détecté(s)`,
        'ImageCalibrationService'
      );

      return references;

    } catch (error) {
      loggingService.error('Erreur détection références', 'ImageCalibrationService', error);
      return [];
    }
  }

  /**
   * Crée un objet ReferenceObject à partir de la détection
   */
  private createReferenceObject(detection: any): ReferenceObject | null {
    const type = detection.type as ReferenceObject['type'];
    
    if (!type || !detection.confidence) {
      return null;
    }

    // Récupérer les dimensions standard
    let standardDimension = 0;
    
    switch (type) {
      case 'door':
        // Utiliser la largeur de la porte (plus fiable que la hauteur)
        standardDimension = REFERENCE_DIMENSIONS.door.width;
        break;
      case 'outlet':
      case 'switch':
        standardDimension = REFERENCE_DIMENSIONS.outlet.width;
        break;
      case 'tile':
        // Essayer de détecter la taille du carrelage (30, 40 ou 60)
        const pixelSize = detection.pixelWidth || detection.pixelHeight || 0;
        if (pixelSize > 0) {
          // Heuristique simple pour deviner la taille
          if (pixelSize < 50) standardDimension = 30;
          else if (pixelSize < 80) standardDimension = 40;
          else standardDimension = 60;
        } else {
          standardDimension = REFERENCE_DIMENSIONS.tile.standard30;
        }
        break;
      case 'baseboard':
        standardDimension = REFERENCE_DIMENSIONS.baseboard.height;
        break;
    }

    const pixelDimension = detection.pixelWidth || detection.pixelHeight || 0;

    return {
      type,
      detectedName: detection.detectedName || type,
      standardDimension,
      confidence: detection.confidence,
      pixelDimension,
      boundingBox: detection.boundingBox
    };
  }

  /**
   * Calcule l'échelle à partir des objets de référence détectés
   */
  private calculateScaleFromReferences(references: ReferenceObject[]): ImageCalibration {
    // Hiérarchie de confiance : door > tile > outlet > baseboard
    const priorityOrder: ReferenceObject['type'][] = ['door', 'tile', 'outlet', 'switch', 'baseboard'];

    // Trier les références par priorité et confiance
    const sortedRefs = references.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.type);
      const bPriority = priorityOrder.indexOf(b.type);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return b.confidence - a.confidence;
    });

    // Calculer l'échelle pour chaque référence
    const scales: Array<{ scale: number; confidence: number; source: string }> = [];

    for (const ref of sortedRefs) {
      if (!ref.pixelDimension || ref.pixelDimension === 0) {
        continue;
      }

      const scale = ref.standardDimension / ref.pixelDimension;
      
      scales.push({
        scale,
        confidence: ref.confidence,
        source: `${ref.type} (${ref.standardDimension}cm / ${ref.pixelDimension}px)`
      });
    }

    if (scales.length === 0) {
      return this.getFallbackCalibration();
    }

    // Utiliser une moyenne pondérée par la confiance
    const totalWeight = scales.reduce((sum, s) => sum + s.confidence, 0);
    const weightedScale = scales.reduce((sum, s) => sum + (s.scale * s.confidence), 0) / totalWeight;
    
    // Confiance globale basée sur le nombre et la qualité des références
    const globalConfidence = Math.min(
      totalWeight / scales.length * (scales.length > 1 ? 1.1 : 1.0), // Bonus si plusieurs références
      0.95
    );

    // Déterminer la méthode utilisée
    let method: ImageCalibration['method'] = 'fallback';
    if (scales.length > 1) {
      method = 'multi-object';
    } else if (scales.length === 1) {
      method = sortedRefs[0].type === 'door' ? 'door' : 
              sortedRefs[0].type === 'tile' ? 'tile' : 
              sortedRefs[0].type === 'outlet' ? 'outlet' : 'fallback';
    }

    const reasoning = `Échelle calculée à partir de ${scales.length} référence(s): ${scales.map(s => s.source).join(', ')}`;

    return {
      scaleFactor: weightedScale,
      confidence: globalConfidence,
      referenceObjects: sortedRefs,
      method,
      reasoning
    };
  }

  /**
   * Calibration par défaut (fallback)
   */
  private getFallbackCalibration(): ImageCalibration {
    // Estimation par défaut basée sur une distance de prise de vue moyenne
    // Assume: photo prise à ~2-3m d'un mur, FOV standard d'un smartphone
    const defaultScale = 0.5; // ~0.5 cm/pixel (valeur empirique)

    return {
      scaleFactor: defaultScale,
      confidence: 0.3,
      referenceObjects: [],
      method: 'fallback',
      reasoning: 'Aucun objet de référence détecté, échelle par défaut'
    };
  }

  /**
   * Applique l'échelle de calibration à des dimensions en pixels
   */
  applyCalibration(
    pixelDimensions: { width: number; height: number },
    calibration: ImageCalibration
  ): { length: number; width: number; height: number } {
    return {
      length: Math.round(pixelDimensions.width * calibration.scaleFactor),
      width: Math.round(pixelDimensions.height * calibration.scaleFactor),
      height: Math.round(pixelDimensions.height * calibration.scaleFactor) // Profondeur sera améliorée avec DB
    };
  }
}

// Instance singleton
export const imageCalibrationService = new ImageCalibrationService();

