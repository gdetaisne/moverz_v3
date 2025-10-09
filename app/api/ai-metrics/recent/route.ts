import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';

export const runtime = 'nodejs';

/**
 * GET /api/ai-metrics/recent?limit=100
 * 
 * Recent AI metrics events
 * Dev-only endpoint for observability
 */
export async function GET(req: NextRequest) {
  // Security: Dev-only
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AI_METRICS !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    
    const metrics = await prisma.aiMetric.findMany({
      take: limit,
      orderBy: { ts: 'desc' },
      select: {
        id: true,
        ts: true,
        provider: true,
        model: true,
        operation: true,
        latencyMs: true,
        success: true,
        errorType: true,
        retries: true,
        tokensIn: true,
        tokensOut: true,
        costUsd: true,
        // Exclude sensitive meta fields
        meta: false,
      },
    });
    
    return NextResponse.json({
      count: metrics.length,
      limit,
      events: metrics.map(m => ({
        ...m,
        ts: m.ts.toISOString(),
        costUsd: Number(m.costUsd),
      })),
    });
  } catch (error) {
    console.error('[AI Metrics API] Recent error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent metrics' },
      { status: 500 }
    );
  }
}
