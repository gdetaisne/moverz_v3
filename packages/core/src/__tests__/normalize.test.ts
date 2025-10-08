import { describe, it, expect } from 'vitest';
import { normalizeString, normalizeRoomType } from '../normalize';

describe('normalize', () => {
  describe('normalizeString', () => {
    it('should trim and lowercase strings', () => {
      expect(normalizeString('  Hello World  ')).toBe('hello world');
    });

    it('should handle empty strings', () => {
      expect(normalizeString('')).toBe('');
    });

    it('should handle already normalized strings', () => {
      expect(normalizeString('test')).toBe('test');
    });
  });

  describe('normalizeRoomType', () => {
    it('should normalize room type with spaces', () => {
      expect(normalizeRoomType('Living Room')).toBe('living_room');
    });

    it('should handle single word', () => {
      expect(normalizeRoomType('Kitchen')).toBe('kitchen');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeRoomType('  Big   Room  ')).toBe('big_room');
    });
  });
});
