/**
 * Tests unitaires pour la façade roomClassifier avec A/B testing
 * LOT 18 - Room Classifier A/B Testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { classifyRoom } from '../roomClassifier';
import { clearRoomClassifierMetrics, getRoomClassifierMetrics } from '@ai/metrics';

// Mock les dépendances
vi.mock('@/lib/flags', () => ({
  chooseVariant: vi.fn((seed: string) => {
    // Déterministe basé sur le seed
    return seed.includes('user-b') ? 'B' : 'A';
  }),
  getAbTestConfig: vi.fn(() => ({
    enabled: true,
    split: 50,
  })),
}));

vi.mock('../roomClassifierV2', () => ({
  classifyRoomV2: vi.fn(async () => ({
    roomType: 'salon',
    confidence: 0.9,
    meta: { provider: 'claude' },
  })),
}));

vi.mock('@ai/adapters/smartRoomClassificationService', () => ({
  classifyRoom: vi.fn(async () => 'chambre'),
}));

describe('Room Classifier Façade', () => {
  beforeEach(() => {
    clearRoomClassifierMetrics();
    vi.clearAllMocks();
  });

  describe('classifyRoom', () => {
    it('devrait utiliser la variante A pour un seed A', async () => {
      const buffer = Buffer.from('fake-image');
      const result = await classifyRoom(
        { buffer },
        { userId: 'user-a', photoId: 'photo-1' }
      );

      expect(result.variant).toBe('A');
      expect(result.roomType).toBe('chambre'); // Mock de V1
    });

    it('devrait utiliser la variante B pour un seed B', async () => {
      const buffer = Buffer.from('fake-image');
      const result = await classifyRoom(
        { buffer },
        { userId: 'user-b', photoId: 'photo-2' }
      );

      expect(result.variant).toBe('B');
      expect(result.roomType).toBe('salon'); // Mock de V2
    });

    it('devrait enregistrer une métrique', async () => {
      const buffer = Buffer.from('fake-image');
      
      await classifyRoom(
        { buffer },
        { userId: 'user-test', photoId: 'photo-test' }
      );

      const metrics = getRoomClassifierMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        success: true,
        userId: 'user-test',
        photoId: 'photo-test',
      });
    });

    it('devrait enregistrer latency dans les métriques', async () => {
      const buffer = Buffer.from('fake-image');
      
      await classifyRoom(
        { buffer },
        { userId: 'user-test' }
      );

      const metrics = getRoomClassifierMetrics();
      expect(metrics[0].latencyMs).toBeGreaterThan(0);
    });

    it('devrait gérer une erreur en B et faire fallback sur A', async () => {
      const { classifyRoomV2 } = await import('../roomClassifierV2');
      const { classifyRoom: classifyRoomV1 } = await import('@ai/adapters/smartRoomClassificationService');
      
      // Mock V2 qui throw
      vi.mocked(classifyRoomV2).mockRejectedValueOnce(new Error('V2 error'));
      
      const buffer = Buffer.from('fake-image');
      const result = await classifyRoom(
        { buffer },
        { userId: 'user-b' } // Normalement B
      );

      // Devrait avoir fallback sur A
      expect(result.variant).toBe('A');
      expect(result.roomType).toBe('chambre');
      
      // Métrique devrait marquer le fallback
      const metrics = getRoomClassifierMetrics();
      expect(metrics[0].fallback).toBe(true);
      expect(metrics[0].errorCode).toBe('V2 error');
    });

    it('devrait retourner "autre" si les deux variantes échouent', async () => {
      const { classifyRoomV2 } = await import('../roomClassifierV2');
      const { classifyRoom: classifyRoomV1 } = await import('@ai/adapters/smartRoomClassificationService');
      
      // Mock les deux qui throw
      vi.mocked(classifyRoomV2).mockRejectedValueOnce(new Error('V2 error'));
      vi.mocked(classifyRoomV1).mockRejectedValueOnce(new Error('V1 error'));
      
      const buffer = Buffer.from('fake-image');
      const result = await classifyRoom(
        { buffer },
        { userId: 'user-b' }
      );

      expect(result.roomType).toBe('autre');
      expect(result.confidence).toBeLessThan(1);
      
      // Métrique devrait marquer l'échec
      const metrics = getRoomClassifierMetrics();
      expect(metrics[0].success).toBe(false);
    });

    it('devrait accepter imageUrl ou buffer', async () => {
      // Test avec buffer
      const buffer = Buffer.from('fake-image');
      const result1 = await classifyRoom({ buffer }, { userId: 'user-1' });
      expect(result1.roomType).toBeDefined();

      // Test avec imageUrl
      const imageUrl = 'data:image/jpeg;base64,fakedata';
      const result2 = await classifyRoom({ imageUrl }, { userId: 'user-2' });
      expect(result2.roomType).toBeDefined();
    });

    it('devrait utiliser seed fourni en priorité', async () => {
      const buffer = Buffer.from('fake-image');
      
      // Avec seed explicite
      const result = await classifyRoom(
        { buffer },
        { seed: 'user-b-explicit', userId: 'user-a' }
      );

      // Devrait utiliser le seed fourni (user-b-explicit) -> variante B
      expect(result.variant).toBe('B');
    });
  });
});



