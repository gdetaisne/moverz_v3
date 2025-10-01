// services/spatialRelationsDetector.ts
// Détecteur de relations spatiales entre objets dans une scène

import OpenAI from 'openai';
import { logger as loggingService } from './core/loggingService';
import { DetectedObject } from '../types/measurements';

export type RelationType = 
  | 'on' // obj1 est sur obj2
  | 'above' // obj1 est au-dessus de obj2 (sans contact)
  | 'below' // obj1 est en-dessous de obj2
  | 'beside' // obj1 est à côté de obj2
  | 'next_to' // obj1 est à côté de obj2 (synonyme)
  | 'in_front_of' // obj1 est devant obj2
  | 'behind' // obj1 est derrière obj2
  | 'inside' // obj1 est à l'intérieur de obj2
  | 'near' // obj1 est proche de obj2
  | 'far_from'; // obj1 est loin de obj2

export interface SpatialRelation {
  object1Id: string;
  object2Id: string;
  object1Label: string;
  object2Label: string;
  relationType: RelationType;
  confidence: number; // 0-1
  reasoning: string;
  constraintsImplied?: SpatialConstraint[];
}

export interface SpatialConstraint {
  description: string;
  type: 'size' | 'position' | 'scale';
  affectedObjectId: string;
  expectedRange?: { min: number; max: number };
}

/**
 * Détecteur de relations spatiales entre objets
 * Utilise GPT-4 Vision pour analyser la scène et détecter les relations
 * 
 * SPRINT 2 - AMÉLIORATION
 */
export class SpatialRelationsDetector {
  private openaiClient: OpenAI;

  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Détecte les relations spatiales entre les objets d'une image
   */
  async detectRelationships(objects: DetectedObject[], imageUrl?: string): Promise<SpatialRelation[]> {
    try {
      loggingService.info(`Détection relations spatiales entre ${objects.length} objets`, 'SpatialRelationsDetector');

      if (objects.length < 2) {
        return [];
      }

      // Si on a l'URL de l'image, utiliser GPT-4 Vision pour une analyse visuelle
      if (imageUrl) {
        return await this.detectWithVision(objects, imageUrl);
      }

      // Sinon, faire une analyse basée sur les positions (si disponibles)
      return this.detectFromPositions(objects);

    } catch (error) {
      loggingService.error('Erreur détection relations spatiales', 'SpatialRelationsDetector', error);
      return [];
    }
  }

  /**
   * Détecte les relations avec GPT-4 Vision (méthode la plus précise)
   */
  private async detectWithVision(objects: DetectedObject[], imageUrl: string): Promise<SpatialRelation[]> {
    try {
      // Créer une liste des objets détectés
      const objectsList = objects.map((obj, idx) => 
        `${idx + 1}. ${obj.label} (${obj.dimensions.length}x${obj.dimensions.width}x${obj.dimensions.height} cm)`
      ).join('\n');

      const prompt = `
Tu es un expert en analyse spatiale d'images pour déménagement.

Analyse cette image et identifie les RELATIONS SPATIALES entre ces objets détectés:

${objectsList}

Pour chaque paire d'objets significative, détermine:
1. Le type de relation (on, above, below, beside, in_front_of, behind, inside, near, far_from)
2. La confiance dans cette relation (0-1)
3. Les contraintes dimensionnelles que cela implique (ex: si A est sur B, A doit être <= B en taille)

Réponds au format JSON strict:
{
  "relationships": [
    {
      "object1Label": "string",
      "object2Label": "string",
      "relationType": "on|above|below|beside|in_front_of|behind|inside|near|far_from",
      "confidence": number (0-1),
      "reasoning": "string",
      "constraints": [
        {
          "description": "string",
          "type": "size|position|scale",
          "affectedObjectLabel": "string"
        }
      ]
    }
  ]
}

IMPORTANT:
- Focus sur les relations UTILES pour valider les dimensions
- Ignore les relations triviales ou évidentes
- Priorise les relations qui impliquent des contraintes physiques
- Maximum 10 relations les plus pertinentes
`;

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }
            ]
          }
        ]
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      const detectedRelationships = result.relationships || [];

      // Convertir en SpatialRelation avec les IDs
      const relations: SpatialRelation[] = [];

      for (const rel of detectedRelationships) {
        const obj1 = objects.find(o => o.label.toLowerCase() === rel.object1Label.toLowerCase());
        const obj2 = objects.find(o => o.label.toLowerCase() === rel.object2Label.toLowerCase());

        if (obj1 && obj2) {
          relations.push({
            object1Id: obj1.id || obj1.label,
            object2Id: obj2.id || obj2.label,
            object1Label: obj1.label,
            object2Label: obj2.label,
            relationType: rel.relationType,
            confidence: rel.confidence || 0.5,
            reasoning: rel.reasoning || 'Détecté visuellement',
            constraintsImplied: rel.constraints?.map((c: { description: string; type: string; affectedObjectLabel?: string }) => ({
              description: c.description,
              type: c.type,
              affectedObjectId: objects.find(o => o.label.toLowerCase() === c.affectedObjectLabel?.toLowerCase())?.id || ''
            })) || []
          });
        }
      }

      loggingService.info(`Détecté ${relations.length} relations spatiales avec GPT-4 Vision`, 'SpatialRelationsDetector');
      return relations;

    } catch (error) {
      loggingService.error('Erreur détection Vision', 'SpatialRelationsDetector', error);
      return this.detectFromPositions(objects);
    }
  }

  /**
   * Détecte les relations basées sur les positions (fallback)
   */
  private detectFromPositions(objects: DetectedObject[]): SpatialRelation[] {
    const relations: SpatialRelation[] = [];

    // Analyse heuristique basée sur les tailles et labels
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i];
        const obj2 = objects[j];

        // Règles heuristiques simples
        const relation = this.inferRelationFromContext(obj1, obj2);
        if (relation) {
          relations.push(relation);
        }
      }
    }

    loggingService.info(`Détecté ${relations.length} relations par heuristique`, 'SpatialRelationsDetector');
    return relations;
  }

  /**
   * Infère une relation à partir du contexte et des labels
   */
  private inferRelationFromContext(obj1: DetectedObject, obj2: DetectedObject): SpatialRelation | null {
    const label1 = obj1.label.toLowerCase();
    const label2 = obj2.label.toLowerCase();

    // Règles basées sur la connaissance du domaine
    const knownRelations: Record<string, Record<string, RelationType>> = {
      'lampe': { 'table basse': 'on', 'bureau': 'on' },
      'télévision': { 'meuble tv': 'on' },
      'ordinateur': { 'bureau': 'on' },
      'livre': { 'bibliothèque': 'inside', 'étagère': 'on' },
      'assiette': { 'table à manger': 'on' },
      'chaise': { 'table à manger': 'beside', 'bureau': 'beside' },
      'tapis': { 'canapé': 'below', 'fauteuil': 'below' },
      'tableau': { 'canapé': 'above', 'fauteuil': 'above' },
      'coussin': { 'canapé': 'on', 'fauteuil': 'on', 'lit': 'on' }
    };

    const relType = knownRelations[label1]?.[label2];
    
    if (relType) {
      return {
        object1Id: obj1.id || obj1.label,
        object2Id: obj2.id || obj2.label,
        object1Label: obj1.label,
        object2Label: obj2.label,
        relationType: relType,
        confidence: 0.6, // Confiance moyenne car c'est heuristique
        reasoning: 'Inféré à partir du contexte typique',
        constraintsImplied: this.generateConstraints(obj1, obj2, relType)
      };
    }

    // Vérifier la relation inverse
    const reverseRelType = knownRelations[label2]?.[label1];
    if (reverseRelType) {
      return {
        object1Id: obj2.id || obj2.label,
        object2Id: obj1.id || obj1.label,
        object1Label: obj2.label,
        object2Label: obj1.label,
        relationType: reverseRelType,
        confidence: 0.6,
        reasoning: 'Inféré à partir du contexte typique',
        constraintsImplied: this.generateConstraints(obj2, obj1, reverseRelType)
      };
    }

    return null;
  }

  /**
   * Génère les contraintes spatiales impliquées par une relation
   */
  private generateConstraints(
    obj1: DetectedObject,
    obj2: DetectedObject,
    relationType: RelationType
  ): SpatialConstraint[] {
    const constraints: SpatialConstraint[] = [];

    switch (relationType) {
      case 'on':
        // obj1 sur obj2 : obj1 doit être <= obj2 en dimensions horizontales
        constraints.push({
          description: `${obj1.label} doit avoir des dimensions <= ${obj2.label}`,
          type: 'size',
          affectedObjectId: obj1.id || obj1.label,
          expectedRange: {
            min: 0,
            max: Math.max(obj2.dimensions.length, obj2.dimensions.width)
          }
        });
        break;

      case 'inside':
        // obj1 dans obj2 : obj1 doit être significativement < obj2
        constraints.push({
          description: `${obj1.label} doit être contenu dans ${obj2.label}`,
          type: 'size',
          affectedObjectId: obj1.id || obj1.label,
          expectedRange: {
            min: 0,
            max: Math.min(obj2.dimensions.length, obj2.dimensions.width, obj2.dimensions.height) * 0.8
          }
        });
        break;

      case 'beside':
      case 'next_to':
        // Objets côte à côte : échelle cohérente
        constraints.push({
          description: `${obj1.label} et ${obj2.label} doivent avoir une échelle cohérente`,
          type: 'scale',
          affectedObjectId: obj1.id || obj1.label
        });
        break;
    }

    return constraints;
  }

  /**
   * Valide si une relation est physiquement possible
   */
  validateRelation(relation: SpatialRelation, objects: DetectedObject[]): boolean {
    const obj1 = objects.find(o => (o.id || o.label) === relation.object1Id);
    const obj2 = objects.find(o => (o.id || o.label) === relation.object2Id);

    if (!obj1 || !obj2) return false;

    // Vérifier les contraintes physiques de base
    switch (relation.relationType) {
      case 'on':
        // obj1 ne peut pas être sur obj2 si obj1 est beaucoup plus grand
        const maxDim1 = Math.max(obj1.dimensions.length, obj1.dimensions.width);
        const maxDim2 = Math.max(obj2.dimensions.length, obj2.dimensions.width);
        return maxDim1 <= maxDim2 * 2; // Tolérance de 2x

      case 'inside':
        // obj1 doit être plus petit que obj2 dans toutes les dimensions
        return (
          obj1.dimensions.length < obj2.dimensions.length &&
          obj1.dimensions.width < obj2.dimensions.width &&
          obj1.dimensions.height < obj2.dimensions.height
        );

      default:
        return true; // Autres relations sont généralement valides
    }
  }
}

// Export singleton
export const spatialRelationsDetector = new SpatialRelationsDetector();

