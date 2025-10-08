import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearMetrics, getMetricsStats } from '../metrics';

// Mock the adapters
vi.mock('../adapters/claudeVision', () => ({
  analyzePhotoWithClaude: vi.fn(),
}));

vi.mock('../adapters/openaiVision', () => ({
  analyzePhotoWithOpenAI: vi.fn(),
}));

vi.mock('../adapters/roomDetection', () => ({
  detectRoomType: vi.fn(),
}));

describe('AI Engine', () => {
  beforeEach(() => {
    clearMetrics();
    vi.clearAllMocks();
  });

  describe('analyzePhoto', () => {
    it('should analyze photo successfully', async () => {
      const { analyzePhoto } = await import('../engine');
      const { analyzePhotoWithClaude } = await import('../adapters/claudeVision');
      
      vi.mocked(analyzePhotoWithClaude).mockResolvedValue({
        items: [{ name: 'Table', category: 'mobilier', dismountable: true, fragile: false }],
        roomType: 'salon',
        confidence: 0.9,
      });

      const buffer = Buffer.from('test-image');
      const result = await analyzePhoto(buffer, { provider: 'claude' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Table');
      expect(result.roomType).toBe('salon');
      
      // Check metrics were recorded
      const stats = getMetricsStats();
      expect(stats.total).toBe(1);
      expect(stats.success).toBe(1);
    });

    it('should handle timeout errors', async () => {
      const { analyzePhoto } = await import('../engine');
      const { analyzePhotoWithClaude } = await import('../adapters/claudeVision');
      
      // Mock a slow operation
      vi.mocked(analyzePhotoWithClaude).mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 2000))
      );

      const buffer = Buffer.from('test-image');
      
      await expect(
        analyzePhoto(buffer, { provider: 'claude', timeoutMs: 100, maxRetries: 0 })
      ).rejects.toThrow('AI_TIMEOUT');
      
      // Check metrics recorded the failure
      const stats = getMetricsStats();
      expect(stats.failed).toBe(1);
    });

    it('should retry on failure', async () => {
      const { analyzePhoto } = await import('../engine');
      const { analyzePhotoWithClaude } = await import('../adapters/claudeVision');
      
      let callCount = 0;
      vi.mocked(analyzePhotoWithClaude).mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({
          items: [{ name: 'Chair', category: 'mobilier', dismountable: true, fragile: false }],
          roomType: 'salon',
          confidence: 0.8,
        });
      });

      const buffer = Buffer.from('test-image');
      const result = await analyzePhoto(buffer, { 
        provider: 'claude',
        maxRetries: 2,
        timeoutMs: 5000,
      });

      expect(result.items[0].name).toBe('Chair');
      expect(callCount).toBe(2); // 1 initial + 1 retry
    });
  });

  describe('detectRoom', () => {
    it('should detect room type', async () => {
      const { detectRoom } = await import('../engine');
      const { detectRoomType } = await import('../adapters/roomDetection');
      
      vi.mocked(detectRoomType).mockResolvedValue('cuisine');

      const buffer = Buffer.from('test-image');
      const result = await detectRoom(buffer);

      expect(result).toBe('cuisine');
      
      // Check metrics
      const stats = getMetricsStats();
      expect(stats.total).toBe(1);
      expect(stats.success).toBe(1);
    });
  });
});
