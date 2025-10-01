// services/contextualAnalysisService.ts
// Service d'analyse contextuelle pour améliorer la cohérence entre objets détectés

import { logger as loggingService } from './core/loggingService';
import { DetectedObject } from '../types/measurements';
import { spatialRelationsDetector, SpatialRelation } from './spatialRelationsDetector';

export interface ContextualAnalysisResult {
  objects: DetectedObject[];
  globalScale: number; // cm/pixel estimé globalement
  consistency: number; // Score de cohérence 0-1
  relationships: SpatialRelation[];
  adjustments: ObjectAdjustment[];
  reasoning: string;
}

export interface ObjectAdjustment {
  objectId: string;
  field: 'length' | 'width' | 'height';
  originalValue: number;
  adjustedValue: number;
  reason: string;
  confidence: number;
}

export interface ContextualConstraint {
  minSize: number; // cm
  maxSize: number; // cm
  type: 'length' | 'width' | 'height';
  reason: string;
}

/**
 * Service d'analyse contextuelle pour améliorer la cohérence des mesures
 * entre plusieurs objets détectés dans une même scène.
 * 
 * AMÉLIORATIONS SPRINT 2 :
 * - Détection de relations spatiales (sur/sous, à côté, etc.)
 * - Calcul d'échelle globale cohérente
 * - Validation croisée entre objets
 * - Ajustements contextuels automatiques
 */
export class ContextualAnalysisService {
  
  /**
   * Analyse un ensemble d'objets détectés pour améliorer la cohérence
   */
  async analyzeContext(objects: DetectedObject[]): Promise<ContextualAnalysisResult> {
    try {
      loggingService.info(`Analyse contextuelle de ${objects.length} objets`, 'ContextualAnalysisService');

      if (objects.length < 2) {
        // Pas assez d'objets pour une analyse contextuelle
        return {
          objects,
          globalScale: 0,
          consistency: 1.0,
          relationships: [],
          adjustments: [],
          reasoning: 'Analyse contextuelle non applicable (moins de 2 objets)'
        };
      }

      // 1. Détecter les relations spatiales entre objets
      const relationships = await spatialRelationsDetector.detectRelationships(objects);

      // 2. Calculer l'échelle globale optimale
      const globalScale = this.calculateGlobalScale(objects, relationships);

      // 3. Identifier les incohérences
      const inconsistencies = this.detectInconsistencies(objects, relationships, globalScale);

      // 4. Générer les ajustements
      const adjustments = this.generateAdjustments(objects, inconsistencies, relationships, globalScale);

      // 5. Appliquer les ajustements
      const adjustedObjects = this.applyAdjustments(objects, adjustments);

      // 6. Calculer le score de cohérence
      const consistency = this.calculateConsistencyScore(adjustedObjects, relationships);

      loggingService.info(
        `Analyse contextuelle terminée: ${relationships.length} relations, ${adjustments.length} ajustements, cohérence=${consistency.toFixed(2)}`,
        'ContextualAnalysisService'
      );

      return {
        objects: adjustedObjects,
        globalScale,
        consistency,
        relationships,
        adjustments,
        reasoning: this.generateReasoning(relationships, adjustments, consistency)
      };

    } catch (error) {
      loggingService.error('Erreur lors de l\'analyse contextuelle', 'ContextualAnalysisService', error);
      return {
        objects,
        globalScale: 0,
        consistency: 0.5,
        relationships: [],
        adjustments: [],
        reasoning: 'Erreur lors de l\'analyse contextuelle'
      };
    }
  }

  /**
   * Calcule une échelle globale optimale en cm/pixel
   * basée sur les relations entre objets connus
   */
  private calculateGlobalScale(objects: DetectedObject[], relationships: SpatialRelation[]): number {
    const scales: Array<{ scale: number; confidence: number }> = [];

    // Pour chaque objet avec des dimensions connues typiques
    for (const obj of objects) {
      const typicalSize = this.getTypicalSize(obj.label);
      if (!typicalSize) continue;

      // Estimer l'échelle à partir de cet objet
      // Note: On suppose que obj.dimensions.length est en cm et qu'on a les pixels quelque part
      // Pour simplifier, on utilise une estimation basée sur la taille typique
      
      const estimatedScale = typicalSize.typical / (obj.dimensions.length || 100);
      
      scales.push({
        scale: estimatedScale,
        confidence: obj.confidence || 0.5
      });
    }

    // Moyenne pondérée par la confiance
    if (scales.length === 0) return 0;

    const totalWeight = scales.reduce((sum, s) => sum + s.confidence, 0);
    const weightedScale = scales.reduce((sum, s) => sum + (s.scale * s.confidence), 0) / totalWeight;

    return weightedScale;
  }

  /**
   * Détecte les incohérences dimensionnelles entre objets
   */
  private detectInconsistencies(
    objects: DetectedObject[],
    relationships: SpatialRelation[],
    globalScale: number
  ): Array<{ objectId: string; issue: string; severity: number }> {
    const inconsistencies: Array<{ objectId: string; issue: string; severity: number }> = [];

    // Vérifier chaque relation spatiale
    for (const rel of relationships) {
      const obj1 = objects.find(o => o.id === rel.object1Id);
      const obj2 = objects.find(o => o.id === rel.object2Id);

      if (!obj1 || !obj2) continue;

      // Vérifier les contraintes physiques
      if (rel.relationType === 'on' || rel.relationType === 'above') {
        // obj1 est sur obj2 : obj1 devrait être plus petit ou égal
        if (obj1.dimensions.length > obj2.dimensions.length * 1.5) {
          inconsistencies.push({
            objectId: obj1.id || obj1.label,
            issue: `${obj1.label} semble trop grand pour être sur ${obj2.label}`,
            severity: 0.7
          });
        }
      }

      if (rel.relationType === 'beside' || rel.relationType === 'next_to') {
        // Objets côte à côte : vérifier échelle cohérente
        const ratio = obj1.dimensions.height / obj2.dimensions.height;
        const expectedRatio = this.getExpectedSizeRatio(obj1.label, obj2.label);
        
        if (expectedRatio && Math.abs(ratio - expectedRatio) > expectedRatio * 0.5) {
          inconsistencies.push({
            objectId: obj1.id || obj1.label,
            issue: `Ratio de taille incohérent entre ${obj1.label} et ${obj2.label}`,
            severity: 0.6
          });
        }
      }
    }

    // Vérifier les tailles absolues
    for (const obj of objects) {
      const typicalSize = this.getTypicalSize(obj.label);
      if (!typicalSize) continue;

      const maxDim = Math.max(obj.dimensions.length, obj.dimensions.width, obj.dimensions.height);
      
      if (maxDim < typicalSize.min * 0.5) {
        inconsistencies.push({
          objectId: obj.id || obj.label,
          issue: `${obj.label} semble trop petit (${maxDim}cm vs ${typicalSize.min}cm min)`,
          severity: 0.8
        });
      }

      if (maxDim > typicalSize.max * 2) {
        inconsistencies.push({
          objectId: obj.id || obj.label,
          issue: `${obj.label} semble trop grand (${maxDim}cm vs ${typicalSize.max}cm max)`,
          severity: 0.8
        });
      }
    }

    return inconsistencies;
  }

  /**
   * Génère des ajustements pour corriger les incohérences
   */
  private generateAdjustments(
    objects: DetectedObject[],
    inconsistencies: Array<{ objectId: string; issue: string; severity: number }>,
    relationships: SpatialRelation[],
    globalScale: number
  ): ObjectAdjustment[] {
    const adjustments: ObjectAdjustment[] = [];

    for (const inconsistency of inconsistencies) {
      const obj = objects.find(o => (o.id || o.label) === inconsistency.objectId);
      if (!obj) continue;

      const typicalSize = this.getTypicalSize(obj.label);
      if (!typicalSize) continue;

      // Ajuster vers la taille typique si l'écart est important
      if (inconsistency.severity > 0.7) {
        const maxDim = Math.max(obj.dimensions.length, obj.dimensions.width, obj.dimensions.height);
        
        if (maxDim < typicalSize.min) {
          // Trop petit : augmenter proportionnellement
          const factor = typicalSize.typical / maxDim;
          
          adjustments.push({
            objectId: inconsistency.objectId,
            field: 'length',
            originalValue: obj.dimensions.length,
            adjustedValue: obj.dimensions.length * factor,
            reason: `Ajusté vers taille typique (trop petit détecté)`,
            confidence: inconsistency.severity
          });

          adjustments.push({
            objectId: inconsistency.objectId,
            field: 'height',
            originalValue: obj.dimensions.height,
            adjustedValue: obj.dimensions.height * factor,
            reason: `Ajusté vers taille typique (trop petit détecté)`,
            confidence: inconsistency.severity
          });
        }

        if (maxDim > typicalSize.max * 1.5) {
          // Trop grand : réduire proportionnellement
          const factor = typicalSize.typical / maxDim;
          
          adjustments.push({
            objectId: inconsistency.objectId,
            field: 'length',
            originalValue: obj.dimensions.length,
            adjustedValue: obj.dimensions.length * factor,
            reason: `Ajusté vers taille typique (trop grand détecté)`,
            confidence: inconsistency.severity
          });

          adjustments.push({
            objectId: inconsistency.objectId,
            field: 'height',
            originalValue: obj.dimensions.height,
            adjustedValue: obj.dimensions.height * factor,
            reason: `Ajusté vers taille typique (trop grand détecté)`,
            confidence: inconsistency.severity
          });
        }
      }
    }

    return adjustments;
  }

  /**
   * Applique les ajustements aux objets
   */
  private applyAdjustments(
    objects: DetectedObject[],
    adjustments: ObjectAdjustment[]
  ): DetectedObject[] {
    const adjustedObjects = objects.map(obj => ({ ...obj }));

    for (const adjustment of adjustments) {
      const obj = adjustedObjects.find(o => (o.id || o.label) === adjustment.objectId);
      if (!obj) continue;

      // Appliquer uniquement si la confiance de l'ajustement est suffisante
      if (adjustment.confidence > 0.6) {
        obj.dimensions[adjustment.field] = Math.round(adjustment.adjustedValue);
        
        // Recalculer le volume
        obj.volume = Math.round(
          obj.dimensions.length * obj.dimensions.width * obj.dimensions.height / 1000000
        );
      }
    }

    return adjustedObjects;
  }

  /**
   * Calcule un score de cohérence global (0-1)
   */
  private calculateConsistencyScore(
    objects: DetectedObject[],
    relationships: SpatialRelation[]
  ): number {
    let totalScore = 0;
    let totalChecks = 0;

    // Vérifier la cohérence des tailles absolues
    for (const obj of objects) {
      const typicalSize = this.getTypicalSize(obj.label);
      if (!typicalSize) continue;

      const maxDim = Math.max(obj.dimensions.length, obj.dimensions.width, obj.dimensions.height);
      
      // Score basé sur la proximité avec la taille typique
      const deviation = Math.abs(maxDim - typicalSize.typical) / typicalSize.typical;
      const score = Math.max(0, 1 - deviation);
      
      totalScore += score;
      totalChecks++;
    }

    // Vérifier la cohérence des relations
    for (const rel of relationships) {
      if (rel.confidence > 0.7) {
        totalScore += rel.confidence;
        totalChecks++;
      }
    }

    return totalChecks > 0 ? totalScore / totalChecks : 0.5;
  }

  /**
   * Génère un raisonnement textuel sur l'analyse
   */
  private generateReasoning(
    relationships: SpatialRelation[],
    adjustments: ObjectAdjustment[],
    consistency: number
  ): string {
    const parts: string[] = [];

    if (relationships.length > 0) {
      parts.push(`Détecté ${relationships.length} relation(s) spatiale(s)`);
    }

    if (adjustments.length > 0) {
      parts.push(`Appliqué ${adjustments.length} ajustement(s) contextuel(s)`);
    }

    parts.push(`Score de cohérence: ${(consistency * 100).toFixed(0)}%`);

    return parts.join('. ') + '.';
  }

  /**
   * Retourne les tailles typiques pour un objet donné
   */
  private getTypicalSize(label: string): { min: number; max: number; typical: number } | null {
    const sizes: Record<string, { min: number; max: number; typical: number }> = {
      // Meubles
      'canapé': { min: 150, max: 250, typical: 200 },
      'fauteuil': { min: 70, max: 100, typical: 85 },
      'chaise': { min: 40, max: 60, typical: 50 },
      'table basse': { min: 60, max: 120, typical: 90 },
      'table à manger': { min: 120, max: 220, typical: 170 },
      'bureau': { min: 100, max: 180, typical: 140 },
      'lit double': { min: 140, max: 200, typical: 160 },
      'lit simple': { min: 90, max: 120, typical: 100 },
      'armoire': { min: 80, max: 250, typical: 150 },
      'commode': { min: 60, max: 140, typical: 100 },
      'bibliothèque': { min: 80, max: 200, typical: 120 },
      
      // Électroménager
      'réfrigérateur': { min: 55, max: 80, typical: 65 },
      'lave-linge': { min: 50, max: 70, typical: 60 },
      'four': { min: 50, max: 70, typical: 60 },
      'micro-ondes': { min: 40, max: 60, typical: 50 },
      
      // Décoration
      'télévision': { min: 80, max: 200, typical: 120 },
      'lampe': { min: 30, max: 180, typical: 100 },
      'tapis': { min: 100, max: 300, typical: 180 },
      
      // Cartons et divers
      'carton': { min: 30, max: 80, typical: 50 },
      'valise': { min: 40, max: 80, typical: 60 }
    };

    const normalized = label.toLowerCase().trim();
    return sizes[normalized] || null;
  }

  /**
   * Retourne le ratio de taille attendu entre deux types d'objets
   */
  private getExpectedSizeRatio(label1: string, label2: string): number | null {
    // Ratios connus (hauteur obj1 / hauteur obj2)
    const ratios: Record<string, Record<string, number>> = {
      'lampe': { 'table basse': 1.5, 'bureau': 0.8 },
      'chaise': { 'table à manger': 0.6 },
      'télévision': { 'meuble TV': 0.8 },
      'carton': { 'armoire': 0.3 }
    };

    const norm1 = label1.toLowerCase().trim();
    const norm2 = label2.toLowerCase().trim();

    return ratios[norm1]?.[norm2] || ratios[norm2]?.[norm1] || null;
  }
}

// Export singleton
export const contextualAnalysisService = new ContextualAnalysisService();

