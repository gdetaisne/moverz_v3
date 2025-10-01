// services/amazonRekognitionService.ts
// Service de mesure utilisant Amazon Rekognition

import AWS from 'aws-sdk';
import { calculateSmartDepth } from '../lib/depthDatabase';

export interface AmazonRekognitionResult {
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  confidence: number;
  reasoning: string;
  boundingBox?: any;
}

export class AmazonRekognitionService {
  private rekognition: AWS.Rekognition;

  constructor() {
    // Configuration AWS
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.rekognition = new AWS.Rekognition();
  }

  /**
   * Mesure un objet avec Amazon Rekognition
   */
  async measureObject(imageUrl: string, objectLabel: string): Promise<AmazonRekognitionResult> {
    try {
      console.log(`🔍 Amazon Rekognition: Mesure de ${objectLabel}...`);
      
      // Convertir l'URL en buffer pour AWS
      const imageBuffer = await this.convertImageUrlToBuffer(imageUrl);
      
      // 1. Détection d'objets
      const detectParams = {
        Image: { Bytes: imageBuffer },
        MaxLabels: 10,
        MinConfidence: 0.3
      };

      const result = await this.rekognition.detectLabels(detectParams).promise();

      // 2. Extraction des dimensions depuis les labels
      const dimensions = this.extractDimensionsFromLabels(
        result.Labels || [],
        objectLabel
      );

      // 3. Validation et correction
      const validatedDimensions = this.validateDimensions(dimensions, objectLabel);

      return {
        dimensions: validatedDimensions,
        confidence: this.calculateConfidence(result.Labels || []),
        reasoning: `Amazon Rekognition: Détection basée sur ${result.Labels?.length || 0} labels`,
        boundingBox: this.findBoundingBox(result.Labels || [], objectLabel)
      };

    } catch (error) {
      console.error('Erreur Amazon Rekognition:', error);
      
      // Fallback vers dimensions par défaut
      return this.getFallbackDimensions(objectLabel);
    }
  }

  /**
   * Convertit une URL d'image en buffer pour AWS
   */
  private async convertImageUrlToBuffer(imageUrl: string): Promise<Buffer> {
    if (imageUrl.startsWith('data:')) {
      // Image base64
      const base64Data = imageUrl.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    } else {
      // URL externe
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  }

  /**
   * Extrait les dimensions depuis les labels AWS
   */
  private extractDimensionsFromLabels(
    labels: AWS.Rekognition.Label[],
    targetLabel: string
  ): { length: number; width: number; height: number } {
    // Chercher le label correspondant
    const targetLabelData = labels.find(label => 
      label.Name?.toLowerCase().includes(targetLabel.toLowerCase()) ||
      (label.Name && targetLabel.toLowerCase().includes(label.Name.toLowerCase()))
    );

    if (!targetLabelData?.Instances?.[0]?.BoundingBox) {
      return { length: 0, width: 0, height: 0 };
    }

    const boundingBox = targetLabelData.Instances[0].BoundingBox;
    
    // Calculer les dimensions normalisées
    const normalizedWidth = boundingBox.Width || 0;
    const normalizedHeight = boundingBox.Height || 0;

    // Convertir en dimensions réelles (estimation basée sur des références)
    // On assume une image de 1000x1000px pour la conversion
    const estimatedWidth = normalizedWidth * 1000; // cm
    const estimatedHeight = normalizedHeight * 1000; // cm
    
    // AMÉLIORATION : Utiliser la DB de profondeurs au lieu de 0.6 fixe
    const estimatedDepth = calculateSmartDepth(
      objectLabel,
      estimatedWidth,
      estimatedHeight
    );

    return {
      length: Math.round(estimatedWidth),
      width: Math.round(estimatedDepth),
      height: Math.round(estimatedHeight)
    };
  }

  /**
   * Trouve le bounding box pour un objet spécifique
   */
  private findBoundingBox(labels: AWS.Rekognition.Label[], targetLabel: string): any {
    const targetLabelData = labels.find(label => 
      label.Name?.toLowerCase().includes(targetLabel.toLowerCase()) ||
      (label.Name && targetLabel.toLowerCase().includes(label.Name.toLowerCase()))
    );

    return targetLabelData?.Instances?.[0]?.BoundingBox || null;
  }

  /**
   * Valide et corrige les dimensions
   */
  private validateDimensions(
    dimensions: { length: number; width: number; height: number },
    objectLabel: string
  ): { length: number; width: number; height: number } {
    let { length, width, height } = dimensions;

    // Règles de validation par type d'objet
    if (objectLabel.toLowerCase().includes('chaise')) {
      // Chaises: 40-50cm large, 40-50cm profondeur, 80-90cm haut
      length = Math.max(40, Math.min(length, 60));
      width = Math.max(40, Math.min(width, 60));
      height = Math.max(70, Math.min(height, 100));
    } else if (objectLabel.toLowerCase().includes('table')) {
      // Tables: 60-80cm haut, largeur variable
      height = Math.max(60, Math.min(height, 80));
    } else if (objectLabel.toLowerCase().includes('armoire')) {
      // Armoires: 50-70cm profondeur, 180-220cm haut
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
   * Calcule la confidence basée sur les labels
   */
  private calculateConfidence(labels: AWS.Rekognition.Label[]): number {
    if (labels.length === 0) return 0.1;
    
    const avgConfidence = labels.reduce((sum, label) => sum + (label.Confidence || 0), 0) / labels.length;
    return Math.min(avgConfidence / 100, 0.95); // Convertir de pourcentage à 0-1
  }

  /**
   * Dimensions de fallback par catégorie
   */
  private getFallbackDimensions(objectLabel: string): AmazonRekognitionResult {
    const label = objectLabel.toLowerCase();
    
    if (label.includes('chaise')) {
      return {
        dimensions: { length: 45, width: 45, height: 85 },
        confidence: 0.3,
        reasoning: 'Fallback: Dimensions standard chaise'
      };
    } else if (label.includes('table')) {
      return {
        dimensions: { length: 120, width: 60, height: 75 },
        confidence: 0.3,
        reasoning: 'Fallback: Dimensions standard table'
      };
    } else if (label.includes('armoire')) {
      return {
        dimensions: { length: 200, width: 60, height: 200 },
        confidence: 0.3,
        reasoning: 'Fallback: Dimensions standard armoire'
      };
    } else {
      return {
        dimensions: { length: 100, width: 50, height: 80 },
        confidence: 0.3,
        reasoning: 'Fallback: Dimensions génériques'
      };
    }
  }
}

// Instance singleton
export const amazonRekognitionService = new AmazonRekognitionService();
