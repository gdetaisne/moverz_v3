/**
 * Agrégats A/B Testing Room Classifier par jour
 * LOT 18.1 - Monitoring Lite
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AbDailyMetric {
  date: string; // YYYY-MM-DD
  variant: 'A' | 'B';
  provider: string;
  calls: number;
  successRate: number; // 0-1
  avgLatencyMs: number;
  p95LatencyMs: number;
  avgCostUsd: number;
  errorsByCode: Array<{ code: string; count: number }>;
}

export interface AbDailyParams {
  days?: number; // Default 14
}

/**
 * Récupère les métriques A/B agrégées par jour
 */
export async function getAbDailyMetrics(
  params: AbDailyParams = {}
): Promise<AbDailyMetric[]> {
  const days = params.days || 14;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Utiliser SQL brut pour les agrégats complexes (percentile)
  const results = await prisma.$queryRaw<Array<{
    date: string;
    variant: string;
    provider: string;
    calls: bigint;
    success_rate: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    avg_cost_usd: string; // Decimal as string
  }>>`
    SELECT 
      DATE(ts AT TIME ZONE 'UTC') as date,
      COALESCE(meta->>'variant', 'A') as variant,
      provider,
      COUNT(*) as calls,
      AVG(CASE WHEN success THEN 1 ELSE 0 END) as success_rate,
      AVG(latencyMs::float) as avg_latency_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latencyMs) as p95_latency_ms,
      AVG(COALESCE(costUsd::float, 0)) as avg_cost_usd
    FROM "AiMetric"
    WHERE 
      ts >= ${startDate}
      AND operation IN ('room_classify', 'classify_room', 'analyze_photo')
    GROUP BY DATE(ts AT TIME ZONE 'UTC'), COALESCE(meta->>'variant', 'A'), provider
    ORDER BY date DESC, variant, provider
  `;

  // Pour chaque ligne, récupérer les top 3 error codes
  const metricsWithErrors = await Promise.all(
    results.map(async (row) => {
      const errorCodes = await prisma.$queryRaw<Array<{ code: string; count: bigint }>>`
        SELECT 
          COALESCE(meta->>'errorCode', 'unknown') as code,
          COUNT(*) as count
        FROM "AiMetric"
        WHERE 
          DATE(ts AT TIME ZONE 'UTC') = ${row.date}::date
          AND COALESCE(meta->>'variant', 'A') = ${row.variant}
          AND provider = ${row.provider}
          AND success = false
          AND meta->>'errorCode' IS NOT NULL
        GROUP BY COALESCE(meta->>'errorCode', 'unknown')
        ORDER BY count DESC
        LIMIT 3
      `;

      return {
        date: row.date,
        variant: row.variant as 'A' | 'B',
        provider: row.provider,
        calls: Number(row.calls),
        successRate: Number(row.success_rate),
        avgLatencyMs: Math.round(Number(row.avg_latency_ms)),
        p95LatencyMs: Math.round(Number(row.p95_latency_ms)),
        avgCostUsd: parseFloat(row.avg_cost_usd),
        errorsByCode: errorCodes.map(e => ({
          code: e.code,
          count: Number(e.count),
        })),
      };
    })
  );

  return metricsWithErrors;
}

/**
 * Version simplifiée pour dashboard (vue d'ensemble)
 */
export async function getAbSummary() {
  const last7days = new Date();
  last7days.setDate(last7days.getDate() - 7);

  const summary = await prisma.$queryRaw<Array<{
    variant: string;
    total_calls: bigint;
    success_rate: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
  }>>`
    SELECT 
      COALESCE(meta->>'variant', 'A') as variant,
      COUNT(*) as total_calls,
      AVG(CASE WHEN success THEN 1 ELSE 0 END) as success_rate,
      AVG(latencyMs::float) as avg_latency_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latencyMs) as p95_latency_ms
    FROM "AiMetric"
    WHERE 
      ts >= ${last7days}
      AND operation IN ('room_classify', 'classify_room', 'analyze_photo')
    GROUP BY COALESCE(meta->>'variant', 'A')
    ORDER BY variant
  `;

  return summary.map(row => ({
    variant: row.variant as 'A' | 'B',
    totalCalls: Number(row.total_calls),
    successRate: Number(row.success_rate),
    avgLatencyMs: Math.round(Number(row.avg_latency_ms)),
    p95LatencyMs: Math.round(Number(row.p95_latency_ms)),
  }));
}



