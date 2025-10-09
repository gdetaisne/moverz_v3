/**
 * Tests unitaires pour le système de feature flags A/B
 * LOT 18 - Room Classifier A/B Testing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAbEnabled, getAbSplit, chooseVariant, getAbTestConfig } from '../flags';

describe('Feature Flags A/B', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.ROOM_CLASSIFIER_AB_ENABLED;
    delete process.env.ROOM_CLASSIFIER_AB_SPLIT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAbEnabled', () => {
    it('devrait retourner false par défaut', () => {
      expect(isAbEnabled()).toBe(false);
    });

    it('devrait retourner true si ROOM_CLASSIFIER_AB_ENABLED=true', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'true';
      expect(isAbEnabled()).toBe(true);
    });

    it('devrait retourner true si ROOM_CLASSIFIER_AB_ENABLED=1', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = '1';
      expect(isAbEnabled()).toBe(true);
    });

    it('devrait retourner false si ROOM_CLASSIFIER_AB_ENABLED=false', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'false';
      expect(isAbEnabled()).toBe(false);
    });

    it('devrait retourner false si ROOM_CLASSIFIER_AB_ENABLED=0', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = '0';
      expect(isAbEnabled()).toBe(false);
    });
  });

  describe('getAbSplit', () => {
    it('devrait retourner 10 par défaut', () => {
      expect(getAbSplit()).toBe(10);
    });

    it('devrait retourner la valeur configurée', () => {
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '25';
      expect(getAbSplit()).toBe(25);
    });

    it('devrait cap à 0 si valeur négative', () => {
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '-10';
      expect(getAbSplit()).toBe(0);
    });

    it('devrait cap à 100 si valeur > 100', () => {
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '150';
      expect(getAbSplit()).toBe(100);
    });

    it('devrait retourner 10 si valeur invalide', () => {
      process.env.ROOM_CLASSIFIER_AB_SPLIT = 'invalid';
      expect(getAbSplit()).toBe(10);
    });
  });

  describe('chooseVariant', () => {
    it('devrait toujours retourner A si flag désactivé', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'false';
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '50';
      
      expect(chooseVariant('user-123')).toBe('A');
      expect(chooseVariant('user-456')).toBe('A');
      expect(chooseVariant('user-789')).toBe('A');
    });

    it('devrait toujours retourner A si split=0', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'true';
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '0';
      
      expect(chooseVariant('user-123')).toBe('A');
      expect(chooseVariant('user-456')).toBe('A');
    });

    it('devrait toujours retourner B si split=100', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'true';
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '100';
      
      expect(chooseVariant('user-123')).toBe('B');
      expect(chooseVariant('user-456')).toBe('B');
    });

    it('devrait être déterministe pour un même seed', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'true';
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '50';
      
      const seed = 'test-user-123';
      const variant1 = chooseVariant(seed);
      const variant2 = chooseVariant(seed);
      const variant3 = chooseVariant(seed);
      
      expect(variant1).toBe(variant2);
      expect(variant2).toBe(variant3);
    });

    it('devrait respecter approximativement le split configuré', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'true';
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '10'; // 10% B
      
      const samples = 1000;
      let countB = 0;
      
      for (let i = 0; i < samples; i++) {
        const variant = chooseVariant(`user-${i}`);
        if (variant === 'B') countB++;
      }
      
      const percentageB = (countB / samples) * 100;
      
      // Tolérance de ±3%
      expect(percentageB).toBeGreaterThan(7);
      expect(percentageB).toBeLessThan(13);
    });

    it('devrait produire des variantes différentes pour des seeds différents', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'true';
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '50';
      
      const variants = new Set();
      for (let i = 0; i < 100; i++) {
        variants.add(chooseVariant(`user-${i}`));
      }
      
      // Avec un split de 50%, on devrait avoir les deux variantes
      expect(variants.has('A')).toBe(true);
      expect(variants.has('B')).toBe(true);
    });
  });

  describe('getAbTestConfig', () => {
    it('devrait retourner la config complète', () => {
      process.env.ROOM_CLASSIFIER_AB_ENABLED = 'true';
      process.env.ROOM_CLASSIFIER_AB_SPLIT = '25';
      
      const config = getAbTestConfig();
      
      expect(config).toEqual({
        enabled: true,
        split: 25,
      });
    });

    it('devrait retourner les valeurs par défaut', () => {
      const config = getAbTestConfig();
      
      expect(config).toEqual({
        enabled: false,
        split: 10,
      });
    });
  });
});



