import { describe, it, expect } from 'vitest';
import { estimateCost, getModelPricing } from '../metrics/cost';

describe('cost', () => {
  describe('estimateCost', () => {
    it('should calculate cost for Claude Haiku', () => {
      const cost = estimateCost('claude-3-5-haiku', 1000, 1000);
      // $0.25/1K input + $1.25/1K output = $1.50/1K total
      expect(cost).toBeCloseTo(1.5, 2);
    });

    it('should calculate cost for GPT-4o-mini', () => {
      const cost = estimateCost('gpt-4o-mini', 1000, 1000);
      // $0.15/1K input + $0.60/1K output = $0.75/1K total
      expect(cost).toBeCloseTo(0.75, 2);
    });

    it('should handle zero tokens', () => {
      expect(estimateCost('claude-3-5-haiku', 0, 0)).toBe(0);
    });

    it('should handle partial usage', () => {
      const cost = estimateCost('gpt-4o-mini', 500, 0);
      // $0.15/1K * 0.5 = $0.075
      expect(cost).toBeCloseTo(0.075, 3);
    });

    it('should use default pricing for unknown models', () => {
      const cost = estimateCost('unknown-model', 1000, 1000);
      // Default: $1/1K input + $2/1K output = $3/1K total
      expect(cost).toBeCloseTo(3.0, 2);
    });

    it('should handle model name normalization', () => {
      // Should match "gpt-4o" even with version suffix
      const cost1 = estimateCost('gpt-4o-2024-05-13', 1000, 1000);
      const cost2 = estimateCost('gpt-4o', 1000, 1000);
      expect(cost1).toBe(cost2);
    });
  });

  describe('getModelPricing', () => {
    it('should return pricing for known models', () => {
      const pricing = getModelPricing('claude-3-5-haiku');
      expect(pricing).toBeDefined();
      expect(pricing?.inputPer1K).toBe(0.25);
      expect(pricing?.outputPer1K).toBe(1.25);
    });

    it('should return undefined for unknown models', () => {
      const pricing = getModelPricing('nonexistent-model');
      expect(pricing).toBeDefined(); // Returns default
    });
  });
});
