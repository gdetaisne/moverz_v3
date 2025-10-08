import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';

export const runtime = 'nodejs';

/**
 * GET /api/ai-metrics/summary
 * 
 * Aggregated metrics for the last 24 hours
 * Dev-only endpoint for observability
 */
export async function GET(req: NextRequest) {
  // Security: Dev-only
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AI_METRICS !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  try {
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    // Default: last 24 hours
    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Fetch all metrics in range
    const metrics = await prisma.aiMetric.findMany({
      where: {
        ts: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { ts: 'asc' },
    });
    
    if (metrics.length === 0) {
      return NextResponse.json({
        range: { from: from.toISOString(), to: to.toISOString() },
        total: 0,
        success: 0,
        failed: 0,
        successRate: 0,
        latency: { p50: 0, p95: 0, max: 0 },
        retriesAvg: 0,
        tokensAvg: { in: 0, out: 0 },
        costTotal: 0,
        byProvider: {},
        byModel: {},
        byOperation: {},
      });
    }
    
    // Calculate aggregations
    const total = metrics.length;
    const success = metrics.filter(m => m.success).length;
    const failed = total - success;
    const successRate = (success / total) * 100;
    
    // Latency percentiles
    const latencies = metrics.map(m => m.latencyMs).sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const max = latencies[latencies.length - 1];
    
    // Retries average
    const retriesAvg = metrics.reduce((sum, m) => sum + m.retries, 0) / total;
    
    // Tokens average
    const tokensInTotal = metrics.reduce((sum, m) => sum + (m.tokensIn || 0), 0);
    const tokensOutTotal = metrics.reduce((sum, m) => sum + (m.tokensOut || 0), 0);
    const tokensAvg = {
      in: tokensInTotal / total,
      out: tokensOutTotal / total,
    };
    
    // Cost total
    const costTotal = metrics.reduce((sum, m) => sum + Number(m.costUsd), 0);
    
    // Breakdown by provider
    const byProvider: Record<string, { count: number; cost: number }> = {};
    for (const m of metrics) {
      if (!byProvider[m.provider]) {
        byProvider[m.provider] = { count: 0, cost: 0 };
      }
      byProvider[m.provider].count++;
      byProvider[m.provider].cost += Number(m.costUsd);
    }
    
    // Breakdown by model
    const byModel: Record<string, { count: number; cost: number }> = {};
    for (const m of metrics) {
      if (!byModel[m.model]) {
        byModel[m.model] = { count: 0, cost: 0 };
      }
      byModel[m.model].count++;
      byModel[m.model].cost += Number(m.costUsd);
    }
    
    // Breakdown by operation
    const byOperation: Record<string, { count: number; avgLatency: number; successRate: number }> = {};
    for (const m of metrics) {
      if (!byOperation[m.operation]) {
        byOperation[m.operation] = { count: 0, avgLatency: 0, successRate: 0 };
      }
      byOperation[m.operation].count++;
    }
    
    // Calculate averages for operations
    for (const [op, stats] of Object.entries(byOperation)) {
      const opMetrics = metrics.filter(m => m.operation === op);
      stats.avgLatency = opMetrics.reduce((sum, m) => sum + m.latencyMs, 0) / opMetrics.length;
      stats.successRate = (opMetrics.filter(m => m.success).length / opMetrics.length) * 100;
    }
    
    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      total,
      success,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      latency: { p50, p95, max },
      retriesAvg: Math.round(retriesAvg * 100) / 100,
      tokensAvg: {
        in: Math.round(tokensAvg.in),
        out: Math.round(tokensAvg.out),
      },
      costTotal: Math.round(costTotal * 1000000) / 1000000, // 6 decimals
      byProvider,
      byModel,
      byOperation,
    });
  } catch (error) {
    console.error('[AI Metrics API] Summary error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
