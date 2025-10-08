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
