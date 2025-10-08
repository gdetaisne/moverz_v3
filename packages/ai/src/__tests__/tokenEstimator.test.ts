import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateTokensFromObject } from '../metrics/tokenEstimator';

describe('tokenEstimator', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens from text (~4 chars/token)', () => {
      const text = 'Hello, this is a test message!'; // 30 chars
      const tokens = estimateTokens(text);
      expect(tokens).toBe(8); // ceil(30/4) = 8
    });

    it('should handle empty strings', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should handle long text', () => {
      const text = 'A'.repeat(1000); // 1000 chars
      const tokens = estimateTokens(text);
      expect(tokens).toBe(250); // ceil(1000/4) = 250
    });

    it('should round up fractional tokens', () => {
      const text = 'ABC'; // 3 chars
      const tokens = estimateTokens(text);
      expect(tokens).toBe(1); // ceil(3/4) = 1
    });
  });

  describe('estimateTokensFromObject', () => {
    it('should estimate tokens from JSON object', () => {
      const obj = { name: 'Test', value: 123 };
      const tokens = estimateTokensFromObject(obj);
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle null/undefined', () => {
      expect(estimateTokensFromObject(null)).toBe(0);
      expect(estimateTokensFromObject(undefined)).toBe(0);
    });

    it('should handle complex objects', () => {
      const obj = {
        items: [
          { name: 'Chair', category: 'furniture' },
          { name: 'Table', category: 'furniture' },
        ],
      };
      const tokens = estimateTokensFromObject(obj);
      expect(tokens).toBeGreaterThan(10);
    });
  });
});
