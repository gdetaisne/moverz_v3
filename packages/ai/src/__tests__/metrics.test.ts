import { describe, it, expect, beforeEach } from 'vitest';
import { recordMetric, getMetrics, getMetricsStats, clearMetrics } from '../metrics';

describe('AI Metrics', () => {
  beforeEach(() => {
    clearMetrics();
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      recordMetric({
        operation: 'analyzePhoto',
        timestamp: '2025-10-08T10:00:00Z',
        latency_ms: 500,
        success: true,
        model: 'claude-3-sonnet',
        input_size_bytes: 1024,
      });

      const metrics = getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('analyzePhoto');
      expect(metrics[0].latency_ms).toBe(500);
      expect(metrics[0].success).toBe(true);
    });

    it('should record multiple metrics', () => {
      recordMetric({
        operation: 'detectRoom',
        timestamp: '2025-10-08T10:00:00Z',
        latency_ms: 300,
        success: true,
        model: 'claude-3-sonnet',
        input_size_bytes: 512,
      });

      recordMetric({
        operation: 'analyzePhoto',
        timestamp: '2025-10-08T10:00:01Z',
        latency_ms: 600,
        success: false,
        model: 'gpt-4-vision',
        input_size_bytes: 2048,
        error_code: 'TIMEOUT',
      });

      const metrics = getMetrics();
      expect(metrics).toHaveLength(2);
    });
  });

  describe('getMetricsStats', () => {
    it('should calculate stats correctly', () => {
      recordMetric({
        operation: 'analyzePhoto',
        timestamp: '2025-10-08T10:00:00Z',
        latency_ms: 400,
        success: true,
        model: 'claude-3-sonnet',
        input_size_bytes: 1024,
      });

      recordMetric({
        operation: 'analyzePhoto',
        timestamp: '2025-10-08T10:00:01Z',
        latency_ms: 600,
        success: false,
        model: 'claude-3-sonnet',
        input_size_bytes: 1024,
        error_code: 'TIMEOUT',
      });

      const stats = getMetricsStats();
      
      expect(stats.total).toBe(2);
      expect(stats.success).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.avgLatencyMs).toBe(500);
      expect(stats.operations['analyzePhoto'].count).toBe(2);
      expect(stats.operations['analyzePhoto'].avgLatency).toBe(500);
      expect(stats.operations['analyzePhoto'].successRate).toBe(0.5);
    });

    it('should handle empty metrics', () => {
      const stats = getMetricsStats();
      
      expect(stats.total).toBe(0);
      expect(stats.success).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.avgLatencyMs).toBe(0);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      recordMetric({
        operation: 'test',
        timestamp: '2025-10-08T10:00:00Z',
        latency_ms: 100,
        success: true,
        model: 'test',
        input_size_bytes: 100,
      });

      expect(getMetrics()).toHaveLength(1);
      
      clearMetrics();
      
      expect(getMetrics()).toHaveLength(0);
    });
  });
});
