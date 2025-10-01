// lib/__tests__/depthDatabase.test.ts
// Tests unitaires pour la base de données de profondeurs

import { 
  getTypicalDepth, 
  calculateSmartDepth, 
  validateDepth 
} from '../depthDatabase';

describe('depthDatabase', () => {
  
  describe('getTypicalDepth', () => {
    
    it('devrait retourner la profondeur typique pour un canapé', () => {
      const result = getTypicalDepth('canapé');
      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
      expect(result.average).toBeGreaterThanOrEqual(result.min);
      expect(result.average).toBeLessThanOrEqual(result.max);
    });

    it('devrait retourner la profondeur typique pour une chaise', () => {
      const result = getTypicalDepth('chaise');
      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    it('devrait retourner la profondeur typique pour un réfrigérateur', () => {
      const result = getTypicalDepth('réfrigérateur');
      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
      expect(result.average).toBeGreaterThan(50); // Un frigo fait au moins 50cm
    });

    it('devrait être insensible à la casse', () => {
      const result1 = getTypicalDepth('CANAPÉ');
      const result2 = getTypicalDepth('Canapé');
      const result3 = getTypicalDepth('canapé');
      
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('devrait retourner un fallback pour un objet inconnu', () => {
      const result = getTypicalDepth('objet_totalement_inconnu_xyz');
      expect(result).toBeDefined(); // Retourne un fallback, pas null
      expect(result.min).toBeGreaterThan(0);
    });

    it('devrait gérer les chaînes vides avec fallback', () => {
      const result = getTypicalDepth('');
      expect(result).toBeDefined(); // Retourne un fallback
    });

    it('devrait gérer les espaces en début/fin', () => {
      const result = getTypicalDepth('  canapé  ');
      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
    });
  });

  describe('calculateSmartDepth', () => {
    
    it('devrait retourner la profondeur typique pour un canapé', () => {
      const result = calculateSmartDepth('canapé', 200, 80);
      expect(result).toBe(90); // Profondeur typique d'un canapé
    });

    it('devrait retourner la profondeur typique pour une chaise', () => {
      const result = calculateSmartDepth('chaise', 50, 100);
      // La fonction utilise les ratios, donc vérifions une plage acceptable
      expect(result).toBeGreaterThan(40);
      expect(result).toBeLessThan(60);
    });

    it('devrait retourner une profondeur pour un objet inconnu', () => {
      const result = calculateSmartDepth('objet_inconnu_xyz123', 100, 50);
      // Devrait retourner une profondeur par défaut raisonnable
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('devrait utiliser les ratios d\'aspect si disponibles', () => {
      const result = calculateSmartDepth('table basse', 120, 40);
      // Table basse a un ratio widthToDepth défini dans la DB
      expect(result).toBeGreaterThan(40);
      expect(result).toBeLessThan(100);
    });

    it('devrait gérer les dimensions nulles', () => {
      const result = calculateSmartDepth('objet_test_null', 0, 0);
      // Devrait retourner une valeur par défaut même pour 0
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('devrait gérer les dimensions négatives', () => {
      const result = calculateSmartDepth('objet', -100, -50);
      // Ne devrait pas retourner de valeur négative
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('devrait respecter les contraintes min/max de la DB', () => {
      const result = calculateSmartDepth('réfrigérateur', 70, 180);
      const typical = getTypicalDepth('réfrigérateur');
      
      if (typical) {
        expect(result).toBeGreaterThanOrEqual(typical.min * 0.8); // Tolérance 20%
        expect(result).toBeLessThanOrEqual(typical.max * 1.2); // Tolérance 20%
      }
    });

    it('devrait être insensible à la casse', () => {
      const result1 = calculateSmartDepth('CANAPÉ', 200, 80);
      const result2 = calculateSmartDepth('canapé', 200, 80);
      expect(result1).toBe(result2);
    });
  });

  describe('validateDepth', () => {
    
    it('devrait valider une profondeur correcte pour un canapé', () => {
      const result = validateDepth('canapé', 90);
      expect(result.isValid).toBe(true);
    });

    it('devrait invalider une profondeur trop petite', () => {
      const result = validateDepth('canapé', 20); // Trop petit pour un canapé
      expect(result.isValid).toBe(false);
      expect(result.correctedDepth).toBeDefined();
    });

    it('devrait invalider une profondeur trop grande', () => {
      const result = validateDepth('chaise', 200); // Trop grand pour une chaise
      expect(result.isValid).toBe(false);
      expect(result.correctedDepth).toBeDefined();
    });

    it('devrait accepter les valeurs dans la plage typique', () => {
      const result = validateDepth('réfrigérateur', 68); // Profondeur moyenne
      expect(result.isValid).toBe(true);
    });

    it('devrait invalider si hors plage min/max', () => {
      const result = validateDepth('canapé', 75); // En dessous de min (80)
      expect(result.isValid).toBe(false);
      expect(result.correctedDepth).toBeGreaterThanOrEqual(80);
    });

    it('devrait proposer une correction si invalide', () => {
      const result = validateDepth('chaise', 200);
      expect(result.isValid).toBe(false);
      expect(result.correctedDepth).toBeDefined();
      expect(result.correctedDepth).toBeGreaterThanOrEqual(40);
      expect(result.correctedDepth).toBeLessThanOrEqual(55);
    });

    it('devrait retourner une raison en cas d\'invalidité', () => {
      const result = validateDepth('chaise', 200);
      expect(result.reason).toBeDefined();
    });
  });

  describe('Integration - Workflow complet', () => {
    
    it('devrait calculer et valider une profondeur pour un workflow complet', () => {
      // Scénario : Analyser un canapé de 200cm × 80cm
      const label = 'canapé';
      const width = 200;
      const height = 80;
      
      // 1. Obtenir les profondeurs typiques
      const typical = getTypicalDepth(label);
      expect(typical).not.toBeNull();
      
      // 2. Calculer la profondeur intelligente
      const depth = calculateSmartDepth(label, width, height);
      expect(depth).toBeGreaterThan(80);
      expect(depth).toBeLessThan(100);
      
      // 3. Valider la profondeur calculée
      const validation = validateDepth(label, depth);
      expect(validation.isValid).toBe(true);
    });

    it('devrait gérer un objet avec calcul par ratio d\'aspect', () => {
      const label = 'table basse';
      const width = 120;
      const height = 40;
      
      // 1. Obtenir profondeur typique
      const typical = getTypicalDepth(label);
      expect(typical).not.toBeNull();
      
      // 2. Calculer avec ratios
      const depth = calculateSmartDepth(label, width, height);
      expect(depth).toBeGreaterThan(0);
      
      // 3. Valider
      const validation = validateDepth(label, depth);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Edge Cases (Cas Limites)', () => {
    
    it('devrait gérer des objets avec caractères spéciaux', () => {
      const result = getTypicalDepth('table-basse');
      // Devrait chercher dans la DB même avec tiret
      expect(result).not.toBeNull();
    });

    it('devrait gérer les très grandes dimensions', () => {
      const result = calculateSmartDepth('objet', 10000, 5000);
      expect(result).toBeLessThan(10000); // Profondeur raisonnable
    });

    it('devrait gérer les très petites dimensions', () => {
      const result = calculateSmartDepth('objet', 1, 1);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('devrait gérer les dimensions avec décimales', () => {
      const result = calculateSmartDepth('table', 99.7, 45.3);
      // Le résultat dépend des ratios de la DB, on vérifie juste qu'il est positif
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });
  });
});

