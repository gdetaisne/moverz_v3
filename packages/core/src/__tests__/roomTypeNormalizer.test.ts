import { describe, it, expect } from 'vitest';
import { normalizeRoomType } from '../roomTypeNormalizer';

describe('roomTypeNormalizer', () => {
  it('should normalize french room types', () => {
    expect(normalizeRoomType('Salon')).toBe('salon');
    expect(normalizeRoomType('Cuisine')).toBe('cuisine');
    expect(normalizeRoomType('Chambre')).toBe('chambre');
  });

  it('should normalize english room types', () => {
    expect(normalizeRoomType('Living Room')).toBe('salon');
    expect(normalizeRoomType('Kitchen')).toBe('cuisine');
    expect(normalizeRoomType('Bedroom')).toBe('chambre');
  });

  it('should handle case insensitivity', () => {
    expect(normalizeRoomType('SALON')).toBe('salon');
    expect(normalizeRoomType('kitchen')).toBe('cuisine');
  });

  it('should handle unknown types', () => {
    expect(normalizeRoomType('Unknown')).toBe('autre');
    expect(normalizeRoomType('Random Room')).toBe('autre');
  });

  it('should trim whitespace', () => {
    expect(normalizeRoomType('  Salon  ')).toBe('salon');
  });
});
