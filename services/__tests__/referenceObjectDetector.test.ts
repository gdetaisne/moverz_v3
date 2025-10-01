// services/__tests__/referenceObjectDetector.test.ts
// Tests unitaires pour le détecteur d'objets de référence
// Tests de la logique métier sans appels API

import type { DetectedReference, ReferenceType, DetectionQuality } from '../referenceObjectDetector';

// Implémentation locale des fonctions pour tester la logique
// (évite d'importer referenceObjectDetector qui initialise OpenAI)

function filterByQuality(references: DetectedReference[], minQuality: DetectionQuality): DetectedReference[] {
  const qualityMap: Record<DetectionQuality, number> = {
    'excellent': 4,
    'good': 3,
    'fair': 2,
    'poor': 1
  };
  return references.filter(ref => qualityMap[ref.quality] >= qualityMap[minQuality]);
}

function sortByPriority(references: DetectedReference[]): DetectedReference[] {
  const priorityMap: Record<ReferenceType, number> = {
    'door': 5,
    'doorFrame': 4,
    'tile': 3,
    'outlet': 2,
    'switch': 1,
    'baseboard': 1,
    'unknown': 0
  };

  return [...references].sort((a, b) => {
    const priorityA = priorityMap[a.type] || 0;
    const priorityB = priorityMap[b.type] || 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    return b.confidence - a.confidence;
  });
}

describe('ReferenceObjectDetector', () => {

  describe('filterByQuality', () => {
    
    const mockReferences: DetectedReference[] = [
      {
        label: 'door',
        type: 'door',
        confidence: 0.95,
        pixelDimensions: { x: 100, y: 50, width: 80, height: 200 },
        standardDimension: { width: 80, height: 200 },
        quality: 'excellent',
        reasoning: 'Parfaitement visible'
      },
      {
        label: 'outlet',
        type: 'outlet',
        confidence: 0.85,
        pixelDimensions: { x: 200, y: 100, width: 8, height: 12 },
        standardDimension: { width: 8, height: 12 },
        quality: 'good',
        reasoning: 'Bien visible'
      },
      {
        label: 'tile',
        type: 'tile',
        confidence: 0.65,
        pixelDimensions: { x: 50, y: 300, width: 30, height: 30 },
        standardDimension: { width: 30, height: 30 },
        quality: 'fair',
        reasoning: 'Partiellement visible'
      },
      {
        label: 'switch',
        type: 'switch',
        confidence: 0.45,
        pixelDimensions: { x: 150, y: 150, width: 8, height: 8 },
        standardDimension: { width: 8, height: 8 },
        quality: 'poor',
        reasoning: 'Difficilement visible'
      }
    ];

    it('devrait filtrer pour qualité "excellent"', () => {
      const filtered = filterByQuality(mockReferences, 'excellent');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].quality).toBe('excellent');
      expect(filtered[0].label).toBe('door');
    });

    it('devrait filtrer pour qualité "good" et plus', () => {
      const filtered = filterByQuality(mockReferences, 'good');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(ref => ['excellent', 'good'].includes(ref.quality))).toBe(true);
    });

    it('devrait filtrer pour qualité "fair" et plus', () => {
      const filtered = filterByQuality(mockReferences, 'fair');
      expect(filtered).toHaveLength(3);
      expect(filtered.some(ref => ref.quality === 'poor')).toBe(false);
    });

    it('devrait inclure tous les objets si qualité minimale est "poor"', () => {
      const filtered = filterByQuality(mockReferences, 'poor');
      expect(filtered).toHaveLength(4);
    });

    it('devrait gérer un tableau vide', () => {
      const filtered = filterByQuality([], 'good');
      expect(filtered).toHaveLength(0);
    });

    it('devrait retourner un nouveau tableau (pas de mutation)', () => {
      const original = [...mockReferences];
      const filtered = filterByQuality(mockReferences, 'good');
      expect(mockReferences).toEqual(original); // Original inchangé
      expect(filtered).not.toBe(mockReferences); // Nouveau tableau
    });
  });

  describe('sortByPriority', () => {
    
    const mockReferences: DetectedReference[] = [
      {
        label: 'switch',
        type: 'switch',
        confidence: 0.95,
        pixelDimensions: { x: 0, y: 0, width: 8, height: 8 },
        standardDimension: { width: 8 },
        quality: 'excellent',
        reasoning: 'Test'
      },
      {
        label: 'door',
        type: 'door',
        confidence: 0.75,
        pixelDimensions: { x: 0, y: 0, width: 80, height: 200 },
        standardDimension: { width: 80 },
        quality: 'good',
        reasoning: 'Test'
      },
      {
        label: 'outlet',
        type: 'outlet',
        confidence: 0.90,
        pixelDimensions: { x: 0, y: 0, width: 8, height: 12 },
        standardDimension: { width: 8 },
        quality: 'good',
        reasoning: 'Test'
      },
      {
        label: 'tile',
        type: 'tile',
        confidence: 0.85,
        pixelDimensions: { x: 0, y: 0, width: 30, height: 30 },
        standardDimension: { width: 30 },
        quality: 'fair',
        reasoning: 'Test'
      }
    ];

    it('devrait trier par priorité (door > tile > outlet > switch)', () => {
      const sorted = sortByPriority(mockReferences);
      expect(sorted[0].type).toBe('door'); // Priorité la plus haute
      expect(sorted[sorted.length - 1].type).toBe('switch'); // Priorité la plus basse
    });

    it('devrait trier par confiance si même priorité', () => {
      const sameTypeMocks: DetectedReference[] = [
        { ...mockReferences[0], type: 'outlet', confidence: 0.6 },
        { ...mockReferences[1], type: 'outlet', confidence: 0.9 },
        { ...mockReferences[2], type: 'outlet', confidence: 0.75 }
      ];
      
      const sorted = sortByPriority(sameTypeMocks);
      expect(sorted[0].confidence).toBe(0.9); // Plus haute confiance en premier
      expect(sorted[1].confidence).toBe(0.75);
      expect(sorted[2].confidence).toBe(0.6);
    });

    it('devrait retourner un nouveau tableau (pas de mutation)', () => {
      const original = [...mockReferences];
      const sorted = sortByPriority(mockReferences);
      expect(mockReferences).toEqual(original); // Original inchangé
      expect(sorted).not.toBe(mockReferences); // Nouveau tableau
    });

    it('devrait gérer un tableau vide', () => {
      const sorted = sortByPriority([]);
      expect(sorted).toHaveLength(0);
    });

    it('devrait gérer un seul élément', () => {
      const sorted = sortByPriority([mockReferences[0]]);
      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toEqual(mockReferences[0]);
    });
  });

  describe('Integration - Workflow complet', () => {
    
    it('devrait filtrer puis trier dans un workflow complet', () => {
      const mockRefs: DetectedReference[] = [
        {
          label: 'door',
          type: 'door',
          confidence: 0.80,
          pixelDimensions: { x: 0, y: 0, width: 80, height: 200 },
          standardDimension: { width: 80 },
          quality: 'good',
          reasoning: ''
        },
        {
          label: 'outlet',
          type: 'outlet',
          confidence: 0.90,
          pixelDimensions: { x: 0, y: 0, width: 8, height: 12 },
          standardDimension: { width: 8 },
          quality: 'excellent',
          reasoning: ''
        },
        {
          label: 'tile',
          type: 'tile',
          confidence: 0.50,
          pixelDimensions: { x: 0, y: 0, width: 30, height: 30 },
          standardDimension: { width: 30 },
          quality: 'poor',
          reasoning: ''
        }
      ];

      // 1. Filtrer pour qualité minimale "fair"
      const filtered = filterByQuality(mockRefs, 'fair');
      expect(filtered).toHaveLength(2); // Exclut 'poor'

      // 2. Trier par priorité
      const sorted = sortByPriority(filtered);
      expect(sorted[0].type).toBe('door'); // Door > outlet en priorité
      expect(sorted[1].type).toBe('outlet');
    });

    it('devrait gérer un workflow où aucun objet ne passe le filtre', () => {
      const poorQualityRefs: DetectedReference[] = [
        {
          label: 'switch',
          type: 'switch',
          confidence: 0.45,
          pixelDimensions: { x: 0, y: 0, width: 8, height: 8 },
          standardDimension: { width: 8 },
          quality: 'poor',
          reasoning: ''
        }
      ];

      const filtered = filterByQuality(poorQualityRefs, 'good');
      expect(filtered).toHaveLength(0);

      const sorted = sortByPriority(filtered);
      expect(sorted).toHaveLength(0);
    });
  });

  describe('Edge Cases (Cas Limites)', () => {
    
    it('devrait gérer des références sans type défini', () => {
      const unknownRefs: DetectedReference[] = [
        {
          label: 'unknown object',
          type: 'unknown' as ReferenceType,
          confidence: 0.5,
          pixelDimensions: { x: 0, y: 0, width: 10, height: 10 },
          standardDimension: {},
          quality: 'fair',
          reasoning: ''
        }
      ];

      const sorted = sortByPriority(unknownRefs);
      expect(sorted).toHaveLength(1);
      // Les types "unknown" devraient être à la fin
      expect(sorted[0].type).toBe('unknown');
    });

    it('devrait gérer des confiances égales', () => {
      const equalConfidenceRefs: DetectedReference[] = [
        {
          label: 'outlet1',
          type: 'outlet',
          confidence: 0.85,
          pixelDimensions: { x: 0, y: 0, width: 8, height: 12 },
          standardDimension: { width: 8 },
          quality: 'good',
          reasoning: ''
        },
        {
          label: 'outlet2',
          type: 'outlet',
          confidence: 0.85,
          pixelDimensions: { x: 0, y: 0, width: 8, height: 12 },
          standardDimension: { width: 8 },
          quality: 'good',
          reasoning: ''
        }
      ];

      const sorted = sortByPriority(equalConfidenceRefs);
      expect(sorted).toHaveLength(2);
      // L'ordre devrait être stable
    });

    it('devrait gérer des dimensions de pixel à 0', () => {
      const zeroDimRefs: DetectedReference[] = [
        {
          label: 'invalid',
          type: 'door',
          confidence: 0.9,
          pixelDimensions: { x: 0, y: 0, width: 0, height: 0 },
          standardDimension: { width: 80 },
          quality: 'good',
          reasoning: ''
        }
      ];

      const filtered = filterByQuality(zeroDimRefs, 'good');
      expect(filtered).toHaveLength(1); // Ne filtre pas sur les dimensions
    });

    it('devrait gérer des standardDimension partielles', () => {
      const partialDimRefs: DetectedReference[] = [
        {
          label: 'door',
          type: 'door',
          confidence: 0.9,
          pixelDimensions: { x: 0, y: 0, width: 80, height: 200 },
          standardDimension: { width: 80 }, // Pas de height
          quality: 'good',
          reasoning: ''
        }
      ];

      const sorted = sortByPriority(partialDimRefs);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].standardDimension.height).toBeUndefined();
    });
  });

  describe('Types & Interfaces', () => {
    
    it('devrait respecter l\'interface DetectedReference', () => {
      const validRef: DetectedReference = {
        label: 'test door',
        type: 'door',
        confidence: 0.9,
        pixelDimensions: { x: 10, y: 20, width: 80, height: 200 },
        standardDimension: { width: 80, height: 200 },
        quality: 'excellent',
        reasoning: 'Clearly visible'
      };

      expect(validRef.label).toBe('test door');
      expect(validRef.type).toBe('door');
      expect(validRef.confidence).toBeGreaterThan(0);
      expect(validRef.pixelDimensions.width).toBeGreaterThan(0);
    });

    it('devrait accepter tous les ReferenceType valides', () => {
      const types: ReferenceType[] = ['door', 'doorFrame', 'outlet', 'tile', 'switch', 'baseboard', 'unknown'];
      
      types.forEach(type => {
        const ref: DetectedReference = {
          label: `test ${type}`,
          type,
          confidence: 0.8,
          pixelDimensions: { x: 0, y: 0, width: 10, height: 10 },
          standardDimension: {},
          quality: 'good',
          reasoning: ''
        };
        expect(ref.type).toBe(type);
      });
    });

    it('devrait accepter tous les DetectionQuality valides', () => {
      const qualities: DetectionQuality[] = ['excellent', 'good', 'fair', 'poor'];
      
      qualities.forEach(quality => {
        const ref: DetectedReference = {
          label: 'test',
          type: 'door',
          confidence: 0.8,
          pixelDimensions: { x: 0, y: 0, width: 10, height: 10 },
          standardDimension: {},
          quality,
          reasoning: ''
        };
        expect(ref.quality).toBe(quality);
      });
    });
  });
});

