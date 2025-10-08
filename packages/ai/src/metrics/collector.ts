// AI Metrics Collector - Async queue with DB + JSONL persistence
import fs from 'fs';
import path from 'path';

// Type definitions
export interface AiMetricEvent {
  ts: number;                        // Date.now()
  provider: 'openai' | 'anthropic' | 'google' | 'aws' | 'mock';
  model: string;
  operation: string;                 // 'analyzePhoto' | 'detectRoom' | etc.
  success: boolean;
  error_code?: string;
  latency_ms: number;
  retries: number;
  input_size_bytes: number;
  output_size_bytes: number;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  meta?: Record<string, any>;
}

export interface AiCollector {
  enqueue(event: AiMetricEvent): void;
  flush(): Promise<void>;
  getStats(): { queueSize: number; totalProcessed: number; errors: number };
}

// Configuration from env
const CONFIG = {
  enabled: process.env.AI_METRICS_ENABLED !== 'false',
  queueMax: parseInt(process.env.AI_METRICS_QUEUE_MAX || '1000'),
  flushMs: parseInt(process.env.AI_METRICS_FLUSH_MS || '2000'),
  dir: process.env.AI_METRICS_DIR || '.next/metrics',
  batchSize: 50, // Max events per DB batch
};

// In-memory queue
const queue: AiMetricEvent[] = [];
let totalProcessed = 0;
let totalErrors = 0;
let isProcessing = false;

// Lazy load Prisma to avoid circular deps
let prisma: any = null;
function getPrisma() {
  if (!prisma) {
    // Dynamic import to avoid issues during build
    try {
      const { prisma: client } = require('@core/db');
      prisma = client;
    } catch (err) {
      console.warn('[AI Metrics] Prisma not available, DB writes disabled');
    }
  }
  return prisma;
}

/**
 * Enqueue a metric event (non-blocking)
 */
export function enqueue(event: AiMetricEvent): void {
  if (!CONFIG.enabled) return;
  
  // Drop events if queue is full (back-pressure)
  if (queue.length >= CONFIG.queueMax) {
    console.warn('[AI Metrics] Queue full, dropping event');
    return;
  }
  
  queue.push(event);
}

/**
 * Flush all pending events to DB and JSONL
 */
export async function flush(): Promise<void> {
  if (queue.length === 0 || isProcessing) return;
  
  isProcessing = true;
  
  try {
    // Take batch from queue
    const batch = queue.splice(0, CONFIG.batchSize);
    
    // Write to DB (async, non-blocking)
    await writeToDB(batch).catch(err => {
      console.error('[AI Metrics] DB write failed:', err.message);
      totalErrors++;
    });
    
    // Write to JSONL (async, best-effort)
    await writeToJSONL(batch).catch(err => {
      console.warn('[AI Metrics] JSONL write failed:', err.message);
    });
    
    totalProcessed += batch.length;
  } finally {
    isProcessing = false;
    
    // Continue processing if queue still has items
    if (queue.length > 0) {
      setImmediate(() => flush());
    }
  }
}

/**
 * Write events to PostgreSQL
 */
async function writeToDB(events: AiMetricEvent[]): Promise<void> {
  const db = getPrisma();
  if (!db) return;
  
  try {
    await db.aiMetric.createMany({
      data: events.map(e => ({
        ts: new Date(e.ts),
        provider: e.provider,
        model: e.model,
        operation: e.operation,
        latencyMs: e.latency_ms,
        success: e.success,
        errorType: e.error_code || null,
        retries: e.retries,
        tokensIn: e.input_tokens || null,
        tokensOut: e.output_tokens || null,
        costUsd: e.cost_usd || 0,
        meta: e.meta || null,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    // Re-throw to be caught by caller
    throw new Error(`DB write failed: ${(error as Error).message}`);
  }
}

/**
 * Write events to JSONL file (daily rotation)
 */
async function writeToJSONL(events: AiMetricEvent[]): Promise<void> {
  try {
    // Create directory if needed
    const dir = path.resolve(process.cwd(), CONFIG.dir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Daily rotation: filename includes date
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filepath = path.join(dir, `ai-metrics-${date}.jsonl`);
    
    // Append events as JSONL (one JSON per line)
    const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n';
    
    fs.appendFileSync(filepath, lines, 'utf-8');
  } catch (error) {
    // Silent fail - JSONL is best-effort
    console.warn('[AI Metrics] JSONL write error:', (error as Error).message);
  }
}

/**
 * Get collector statistics
 */
export function getStats(): { queueSize: number; totalProcessed: number; errors: number } {
  return {
    queueSize: queue.length,
    totalProcessed,
    errors: totalErrors,
  };
}

/**
 * Start auto-flush timer
 */
let flushTimer: NodeJS.Timeout | null = null;

export function startAutoFlush(): void {
  if (flushTimer || !CONFIG.enabled) return;
  
  flushTimer = setInterval(() => {
    flush().catch(err => {
      console.error('[AI Metrics] Auto-flush error:', err);
    });
  }, CONFIG.flushMs);
}

/**
 * Stop auto-flush timer
 */
export function stopAutoFlush(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

// Start auto-flush on module load (if enabled)
if (CONFIG.enabled) {
  startAutoFlush();
}

// Export collector interface
export const collector: AiCollector = {
  enqueue,
  flush,
};
