// services/hybridMeasurementService.ts
// Service de fusion des résultats Google Vision + Amazon Rekognition

import { googleVisionService, GoogleVisionResult } from './googleVisionService';
import { amazonRekognitionService, AmazonRekognitionResult } from './amazonRekognitionService';
import { logger as loggingService } from './core/loggingService';
import { validateObjectMeasurements } from '../lib/measurementValidation';

export interface HybridMeasurementResult {
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  confidence: number;
  reasoning: string;
  providers: {
    google?: GoogleVisionResult;
    amazon?: AmazonRekognitionResult;
  };
  fusionMethod: 'google_only' | 'amazon_only' | 'weighted_average' | 'best_confidence' | 'fallback';
}

export class HybridMeasurementService {
  /**
   * Mesure un objet avec les deux services et fusionne les résultats
   */
  async measureObject(imageUrl: string, objectLabel: string): Promise<HybridMeasurementResult> {
    loggingService.info(`Hybrid Measurement: ${objectLabel}`, 'HybridMeasurementService');
    
    try {
      // Appels parallèles aux deux services
      const [googleResult, amazonResult] = await Promise.allSettled([
        googleVisionService.measureObject(imageUrl, objectLabel),
        amazonRekognitionService.measureObject(imageUrl, objectLabel)
      ]);

      const googleSuccess = googleResult.status === 'fulfilled';
      const amazonSuccess = amazonResult.status === 'fulfilled';

      // Cas 1: Les deux services ont réussi
      if (googleSuccess && amazonSuccess) {
        return this.fuseResults(
          googleResult.value,
          amazonResult.value,
          'weighted_average'
        );
      }

      // Cas 2: Seul Google a réussi
      if (googleSuccess) {
        return this.fuseResults(
          googleResult.value,
          null,
          'google_only'
        );
      }

      // Cas 3: Seul Amazon a réussi
      if (amazonSuccess) {
        return this.fuseResults(
          null,
          amazonResult.value,
          'amazon_only'
        );
      }

      // Cas 4: Aucun service n'a réussi
      return this.getFallbackResult(objectLabel);

    } catch (error) {
      loggingService.error('Erreur service hybride', 'HybridMeasurementService', error);
      return this.getFallbackResult(objectLabel);
    }
  }

  /**
   * Fusionne les résultats des deux services
   */
  private fuseResults(
    googleResult: GoogleVisionResult | null,
    amazonResult: AmazonRekognitionResult | null,
    method: 'google_only' | 'amazon_only' | 'weighted_average'
  ): HybridMeasurementResult {
    
    if (method === 'google_only' && googleResult) {
      return {
        dimensions: googleResult.dimensions,
        confidence: googleResult.confidence,
        reasoning: `Google Vision: ${googleResult.reasoning}`,
        providers: { google: googleResult },
        fusionMethod: 'google_only'
      };
    }

    if (method === 'amazon_only' && amazonResult) {
      return {
        dimensions: amazonResult.dimensions,
        confidence: amazonResult.confidence,
        reasoning: `Amazon Rekognition: ${amazonResult.reasoning}`,
        providers: { amazon: amazonResult },
        fusionMethod: 'amazon_only'
      };
    }

    if (method === 'weighted_average' && googleResult && amazonResult) {
      // Fusion par moyenne pondérée
      const googleWeight = googleResult.confidence;
      const amazonWeight = amazonResult.confidence;
      const totalWeight = googleWeight + amazonWeight;

      const fusedDimensions = {
        length: Math.round(
          (googleResult.dimensions.length * googleWeight + 
           amazonResult.dimensions.length * amazonWeight) / totalWeight
        ),
        width: Math.round(
          (googleResult.dimensions.width * googleWeight + 
           amazonResult.dimensions.width * amazonWeight) / totalWeight
        ),
        height: Math.round(
          (googleResult.dimensions.height * googleWeight + 
           amazonResult.dimensions.height * amazonWeight) / totalWeight
        )
      };

      const fusedConfidence = Math.min(
        (googleResult.confidence + amazonResult.confidence) / 2 * 1.1, // Boost de 10%
        0.95
      );

      // AMÉLIORATION : Validation adaptative basée sur la confiance
      // On ne valide pas ici pour préserver les dimensions fusionnées
      // La validation sera faite au niveau supérieur si nécessaire

      return {
        dimensions: fusedDimensions,
        confidence: fusedConfidence,
        reasoning: `Fusion hybride: Google (${googleResult.confidence.toFixed(2)}) + Amazon (${amazonResult.confidence.toFixed(2)})`,
        providers: { google: googleResult, amazon: amazonResult },
        fusionMethod: 'weighted_average'
      };
    }

    // Fallback si aucun résultat valide
    return this.getFallbackResult('unknown');
  }

  /**
   * Résultat de fallback
   */
  private getFallbackResult(objectLabel: string): HybridMeasurementResult {
    const label = objectLabel.toLowerCase();
    
    let dimensions = { length: 100, width: 50, height: 80 };
    
    if (label.includes('chaise')) {
      dimensions = { length: 45, width: 45, height: 85 };
    } else if (label.includes('table')) {
      dimensions = { length: 120, width: 60, height: 75 };
    } else if (label.includes('armoire')) {
      dimensions = { length: 200, width: 60, height: 200 };
    }

    return {
      dimensions,
      confidence: 0.3,
      reasoning: 'Fallback: Aucun service IA disponible',
      providers: {},
      fusionMethod: 'fallback'
    };
  }

  /**
   * Valide les dimensions finales
   */
  validateFinalDimensions(
    dimensions: { length: number; width: number; height: number },
    objectLabel: string
  ): { length: number; width: number; height: number } {
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
}

// Instance singleton
export const hybridMeasurementService = new HybridMeasurementService();
