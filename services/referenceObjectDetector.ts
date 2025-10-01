// services/referenceObjectDetector.ts
// Détecteur spécialisé d'objets de référence pour la calibration d'image

import OpenAI from 'openai';
import { logger as loggingService } from './core/loggingService';

export interface DetectedReference {
  type: 'door' | 'doorFrame' | 'outlet' | 'lightSwitch' | 'tile' | 'baseboard' | 'window';
  label: string;
  confidence: number;
  pixelDimensions: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
  standardDimension: {
    width?: number;  // en cm
    height?: number; // en cm
  };
  notes?: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ReferenceDetectionResult {
  references: DetectedReference[];
  imageInfo: {
    width?: number;
    height?: number;
    quality: string;
  };
  detectionTime: number;
  totalReferences: number;
}

export class ReferenceObjectDetector {
  private openaiClient: OpenAI;

  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Détecte tous les objets de référence dans une image
   */
  async detectReferences(imageUrl: string): Promise<ReferenceDetectionResult> {
    const startTime = Date.now();

    try {
      loggingService.info('Détection d\'objets de référence...', 'ReferenceObjectDetector');

      const prompt = this.buildDetectionPrompt();
      const response = await this.openaiClient.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1, // Très précis
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high" // Haute résolution pour précision
                }
              }
            ]
          }
        ]
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      
      // Convertir les résultats en format DetectedReference
      const references = this.parseDetectionResults(result);
      
      // Évaluer la qualité de chaque référence
      const qualityReferences = references.map(ref => this.evaluateReferenceQuality(ref));

      const detectionTime = Date.now() - startTime;

      loggingService.info(
        `${qualityReferences.length} référence(s) détectée(s) en ${detectionTime}ms`,
        'ReferenceObjectDetector'
      );

      return {
        references: qualityReferences,
        imageInfo: result.imageInfo || { quality: 'unknown' },
        detectionTime,
        totalReferences: qualityReferences.length
      };

    } catch (error) {
      loggingService.error('Erreur détection références', 'ReferenceObjectDetector', error);
      return {
        references: [],
        imageInfo: { quality: 'error' },
        detectionTime: Date.now() - startTime,
        totalReferences: 0
      };
    }
  }

  /**
   * Construit le prompt de détection optimisé
   */
  private buildDetectionPrompt(): string {
    return `
Tu es un expert en vision par ordinateur spécialisé dans la détection d'objets de référence pour la calibration d'images.

MISSION : Détecter TOUS les objets de référence dans cette image avec leurs dimensions EXACTES en PIXELS.

OBJETS DE RÉFÉRENCE À DÉTECTER (par ordre de priorité) :

🚪 1. PORTES & CADRES DE PORTE
- Porte standard : 80-90cm de large, 200-210cm de haut
- CRITIQUE : Mesure la largeur ET hauteur en pixels
- Note si porte ouverte/fermée/partiellement visible

🔌 2. PRISES ÉLECTRIQUES
- Dimensions : 8-10cm de large, 8-10cm de haut
- Position typique : 15-20cm du sol
- IMPORTANT : Donne coordonnées X,Y et dimensions

💡 3. INTERRUPTEURS
- Dimensions : 8-10cm de large, 10-15cm de haut
- Position typique : 110-130cm du sol
- Note le nombre de boutons (simple/double)

🟦 4. CARRELAGE
- Tailles courantes : 30x30cm, 40x40cm, 60x60cm
- IMPORTANT : Compte plusieurs carreaux pour précision
- Note la couleur et le motif de joints

🪟 5. FENÊTRES
- Largeur typique : 60-150cm
- Hauteur typique : 100-150cm
- Note si visible entièrement

📏 6. PLINTHES
- Hauteur typique : 8-15cm
- Visible le long des murs
- Mesure la hauteur en pixels

INSTRUCTIONS CRITIQUES :

1. PRÉCISION DES MESURES
   - Utilise ton analyse visuelle pour mesurer en pixels
   - Arrondis au pixel près
   - Si plusieurs instances, liste-les toutes

2. CONFIANCE
   - Donne une confiance 0-1 pour chaque détection
   - 0.9+ : Objet parfaitement visible et mesurable
   - 0.7-0.9 : Objet clair mais partiellement occulté
   - 0.5-0.7 : Objet visible mais mesure incertaine
   - <0.5 : Objet possible mais peu sûr

3. CONTEXTE
   - Note la position relative (haut/bas/gauche/droite)
   - Indique si l'objet est partiellement visible
   - Mentionne les occlusions éventuelles

4. QUALITÉ IMAGE
   - Résolution : haute/moyenne/basse
   - Éclairage : bon/moyen/faible
   - Netteté : nette/floue

RÉPONSE AU FORMAT JSON STRICT :

{
  "references": [
    {
      "type": "door" | "doorFrame" | "outlet" | "lightSwitch" | "tile" | "baseboard" | "window",
      "label": "Description détaillée",
      "confidence": 0.95,
      "pixelWidth": 120,
      "pixelHeight": 250,
      "positionX": 500,
      "positionY": 100,
      "standardWidth": 80,
      "standardHeight": 200,
      "notes": "Porte blanche, pleinement visible, fermée",
      "partiallyVisible": false,
      "occluded": false
    }
  ],
  "imageInfo": {
    "estimatedWidth": 1920,
    "estimatedHeight": 1080,
    "resolution": "high",
    "lighting": "good",
    "sharpness": "sharp"
  }
}

IMPORTANT : Détecte TOUS les objets de référence visibles, même partiellement !
`;
  }

  /**
   * Parse les résultats de détection
   */
  private parseDetectionResults(result: any): DetectedReference[] {
    if (!result.references || !Array.isArray(result.references)) {
      return [];
    }

    return result.references.map((ref: any) => {
      const standardDim = this.getStandardDimensions(ref.type, ref);

      return {
        type: ref.type,
        label: ref.label || ref.type,
        confidence: ref.confidence || 0.5,
        pixelDimensions: {
          width: ref.pixelWidth || 0,
          height: ref.pixelHeight || 0,
          x: ref.positionX,
          y: ref.positionY
        },
        standardDimension: standardDim,
        notes: this.buildNotes(ref),
        quality: 'good' // Sera évalué après
      };
    }).filter((ref: DetectedReference) => 
      ref.pixelDimensions.width > 0 || ref.pixelDimensions.height > 0
    );
  }

  /**
   * Obtient les dimensions standard pour un type de référence
   */
  private getStandardDimensions(type: string, ref: any): { width?: number; height?: number } {
    // Utiliser les dimensions fournies par GPT-4 si disponibles
    if (ref.standardWidth || ref.standardHeight) {
      return {
        width: ref.standardWidth,
        height: ref.standardHeight
      };
    }

    // Sinon, utiliser les valeurs par défaut
    const standards: Record<string, { width?: number; height?: number }> = {
      door: { width: 80, height: 200 },
      doorFrame: { width: 90, height: 210 },
      outlet: { width: 8, height: 8 },
      lightSwitch: { width: 8, height: 12 },
      tile: { width: 30, height: 30 }, // Valeur par défaut, peut être 40 ou 60
      baseboard: { height: 10 },
      window: { width: 100, height: 120 }
    };

    return standards[type] || {};
  }

  /**
   * Construit les notes pour une référence
   */
  private buildNotes(ref: any): string {
    const notes: string[] = [];

    if (ref.notes) {
      notes.push(ref.notes);
    }

    if (ref.partiallyVisible) {
      notes.push('Partiellement visible');
    }

    if (ref.occluded) {
      notes.push('Partiellement occulté');
    }

    if (ref.lighting) {
      notes.push(`Éclairage: ${ref.lighting}`);
    }

    return notes.join('. ');
  }

  /**
   * Évalue la qualité d'une référence détectée
   */
  private evaluateReferenceQuality(ref: DetectedReference): DetectedReference {
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';

    // Critères de qualité
    const hasGoodConfidence = ref.confidence >= 0.85;
    const hasBothDimensions = ref.pixelDimensions.width > 0 && ref.pixelDimensions.height > 0;
    const hasPosition = ref.pixelDimensions.x !== undefined && ref.pixelDimensions.y !== undefined;
    const hasReasonableSize = 
      ref.pixelDimensions.width >= 10 && 
      ref.pixelDimensions.height >= 10 &&
      ref.pixelDimensions.width <= 2000 &&
      ref.pixelDimensions.height <= 2000;

    // Évaluation
    if (hasGoodConfidence && hasBothDimensions && hasPosition && hasReasonableSize) {
      quality = 'excellent';
    } else if (hasGoodConfidence && hasBothDimensions && hasReasonableSize) {
      quality = 'good';
    } else if (ref.confidence >= 0.6 && (ref.pixelDimensions.width > 0 || ref.pixelDimensions.height > 0)) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    return {
      ...ref,
      quality
    };
  }

  /**
   * Filtre les références par qualité minimale
   */
  filterByQuality(
    references: DetectedReference[],
    minQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair'
  ): DetectedReference[] {
    const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
    const minLevel = qualityOrder[minQuality];

    return references.filter(ref => qualityOrder[ref.quality] >= minLevel);
  }

  /**
   * Trie les références par priorité (type + confiance)
   */
  sortByPriority(references: DetectedReference[]): DetectedReference[] {
    const typePriority: Record<string, number> = {
      door: 10,
      doorFrame: 9,
      tile: 8,
      window: 7,
      lightSwitch: 6,
      outlet: 5,
      baseboard: 4
    };

    return references.sort((a, b) => {
      const priorityDiff = (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Si même priorité, trier par confiance
      return b.confidence - a.confidence;
    });
  }
}

// Instance singleton
export const referenceObjectDetector = new ReferenceObjectDetector();

