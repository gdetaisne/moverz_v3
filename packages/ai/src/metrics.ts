// AI Metrics - Télémétrie minimale pour le moteur IA
import fs from 'fs';
import path from 'path';

export interface AIMetric {
  operation: string;
  timestamp: string;
  latency_ms: number;
  success: boolean;
  model: string;
  input_size_bytes: number;
  error_code?: string;
}

// Stockage en mémoire (pour dev/tests)
const metrics: AIMetric[] = [];

// Chemin du fichier de metrics
const METRICS_FILE = process.env.AI_METRICS_FILE || 
  path.join(process.cwd(), '.next', 'metrics', 'ai-metrics.json');

/**
 * Enregistrer une métrique
 */
export function recordMetric(metric: AIMetric): void {
  metrics.push(metric);
  
  // Écriture en fichier (asynchrone, non bloquant)
  if (process.env.AI_METRICS_ENABLED !== 'false') {
    writeMetricToFile(metric).catch(err => {
      console.warn('[AI Metrics] Failed to write metric to file:', err.message);
    });
  }
}

/**
 * Écrire une métrique dans le fichier JSON
 */
async function writeMetricToFile(metric: AIMetric): Promise<void> {
  try {
    const dir = path.dirname(METRICS_FILE);
    
    // Créer le dossier si nécessaire
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Lire les métriques existantes
    let existingMetrics: AIMetric[] = [];
    if (fs.existsSync(METRICS_FILE)) {
      const content = fs.readFileSync(METRICS_FILE, 'utf-8');
      try {
        existingMetrics = JSON.parse(content);
      } catch {
        // Fichier corrompu, on recommence
        existingMetrics = [];
      }
    }
    
    // Ajouter la nouvelle métrique
    existingMetrics.push(metric);
    
    // Limiter à 1000 métriques (rotation)
    if (existingMetrics.length > 1000) {
      existingMetrics = existingMetrics.slice(-1000);
    }
    
    // Écrire le fichier
    fs.writeFileSync(METRICS_FILE, JSON.stringify(existingMetrics, null, 2));
  } catch (error) {
    // Silently fail - metrics ne doivent pas bloquer l'app
    console.warn('[AI Metrics] Write error:', error);
  }
}

/**
 * Obtenir toutes les métriques collectées
 */
export function getMetrics(): AIMetric[] {
  return [...metrics];
}

/**
 * Obtenir les statistiques agrégées
 */
export function getMetricsStats(): {
  total: number;
  success: number;
  failed: number;
  avgLatencyMs: number;
  operations: Record<string, { count: number; avgLatency: number; successRate: number }>;
} {
  const total = metrics.length;
  const success = metrics.filter(m => m.success).length;
  const failed = total - success;
  const avgLatencyMs = total > 0 
    ? metrics.reduce((sum, m) => sum + m.latency_ms, 0) / total 
    : 0;
  
  const operations: Record<string, { count: number; avgLatency: number; successRate: number }> = {};
  
  for (const metric of metrics) {
    if (!operations[metric.operation]) {
      operations[metric.operation] = { count: 0, avgLatency: 0, successRate: 0 };
    }
    
    operations[metric.operation].count++;
  }
  
  for (const [op, stats] of Object.entries(operations)) {
    const opMetrics = metrics.filter(m => m.operation === op);
    stats.avgLatency = opMetrics.reduce((sum, m) => sum + m.latency_ms, 0) / opMetrics.length;
    stats.successRate = opMetrics.filter(m => m.success).length / opMetrics.length;
  }
  
  return { total, success, failed, avgLatencyMs, operations };
}

/**
 * Réinitialiser les métriques (pour les tests)
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Lire les métriques depuis le fichier
 */
export function readMetricsFromFile(): AIMetric[] {
  try {
    if (!fs.existsSync(METRICS_FILE)) {
      return [];
    }
    
    const content = fs.readFileSync(METRICS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('[AI Metrics] Read error:', error);
    return [];
  }
}

/**
 * Métrique spécifique pour le classifieur de pièces (A/B test)
 * LOT 18 - Room Classifier A/B Testing
 */
export interface RoomClassifierMetric {
  variant: 'A' | 'B';
  success: boolean;
  latencyMs: number;
  roomType: string;
  confidence: number;
  userId?: string;
  batchId?: string;
  photoId?: string;
  fallback?: boolean;  // true si B a échoué et on est revenu à A
  errorCode?: string;
  timestamp: string;
}

// Stockage en mémoire des métriques du classifier
const classifierMetrics: RoomClassifierMetric[] = [];

/**
 * Enregistre une métrique de classification de pièce
 */
export async function recordRoomClassifierMetric(
  metric: Omit<RoomClassifierMetric, 'timestamp'>
): Promise<void> {
  const fullMetric: RoomClassifierMetric = {
    ...metric,
    timestamp: new Date().toISOString(),
  };

  classifierMetrics.push(fullMetric);

  // Aussi enregistrer dans le système de métriques AI général
  recordMetric({
    operation: 'room_classify',
    timestamp: fullMetric.timestamp,
    latency_ms: metric.latencyMs,
    success: metric.success,
    model: `classifier_v${metric.variant}`,
    input_size_bytes: 0, // N/A pour classifier
    error_code: metric.errorCode,
  });

  // Logger en debug
  if (process.env.LOG_LEVEL === 'debug') {
    console.log('[Room Classifier Metric]', JSON.stringify(fullMetric));
  }
}

/**
 * Obtenir les métriques du classifier (pour observabilité)
 */
export function getRoomClassifierMetrics(
  options?: {
    since?: Date;
    variant?: 'A' | 'B';
  }
): RoomClassifierMetric[] {
  let filtered = [...classifierMetrics];

  if (options?.since) {
    filtered = filtered.filter(m => new Date(m.timestamp) >= options.since!);
  }

  if (options?.variant) {
    filtered = filtered.filter(m => m.variant === options.variant);
  }

  return filtered;
}

/**
 * Statistiques agrégées du classifier A/B
 */
export function getRoomClassifierStats(since?: Date): {
  enabled: boolean;
  split: number;
  counts: {
    A: number;
    B: number;
    fallbackToA: number;
    errorsA: number;
    errorsB: number;
  };
  avgLatency: {
    A: number;
    B: number;
  };
  avgConfidence: {
    A: number;
    B: number;
  };
} {
  // Import dynamique pour éviter circular dependency
  const { getAbTestConfig } = require('@/lib/flags');
  const config = getAbTestConfig();

  const metricsToAnalyze = since 
    ? classifierMetrics.filter(m => new Date(m.timestamp) >= since)
    : classifierMetrics;

  const variantA = metricsToAnalyze.filter(m => m.variant === 'A' && !m.fallback);
  const variantB = metricsToAnalyze.filter(m => m.variant === 'B');
  const fallbacks = metricsToAnalyze.filter(m => m.fallback === true);

  const errorsA = variantA.filter(m => !m.success).length;
  const errorsB = variantB.filter(m => !m.success).length;

  const avgLatencyA = variantA.length > 0
    ? variantA.reduce((sum, m) => sum + m.latencyMs, 0) / variantA.length
    : 0;

  const avgLatencyB = variantB.length > 0
    ? variantB.reduce((sum, m) => sum + m.latencyMs, 0) / variantB.length
    : 0;

  const avgConfidenceA = variantA.length > 0
    ? variantA.reduce((sum, m) => sum + m.confidence, 0) / variantA.length
    : 0;

  const avgConfidenceB = variantB.length > 0
    ? variantB.reduce((sum, m) => sum + m.confidence, 0) / variantB.length
    : 0;

  return {
    enabled: config.enabled,
    split: config.split,
    counts: {
      A: variantA.length,
      B: variantB.length,
      fallbackToA: fallbacks.length,
      errorsA,
      errorsB,
    },
    avgLatency: {
      A: Math.round(avgLatencyA),
      B: Math.round(avgLatencyB),
    },
    avgConfidence: {
      A: Math.round(avgConfidenceA * 100) / 100,
      B: Math.round(avgConfidenceB * 100) / 100,
    },
  };
}

/**
 * Réinitialiser les métriques du classifier (pour tests)
 */
export function clearRoomClassifierMetrics(): void {
  classifierMetrics.length = 0;
}
