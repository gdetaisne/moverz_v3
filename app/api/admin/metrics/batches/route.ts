/**
 * Endpoint agrégats Batches (tendance 7 jours)
 * GET /api/admin/metrics/batches?days=7
 * LOT 18.1 - Monitoring Lite
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_utils/auth';
import { getBatchDailyMetrics, getBatchSummary } from '../../../../../../../packages/core/src/metrics/batches';

export async function GET(request: NextRequest) {
  // Guard admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      // Vue d'ensemble
      const data = await getBatchSummary();
      return NextResponse.json({
        success: true,
        data,
      });
    } else {
      // Détail par jour
      const data = await getBatchDailyMetrics({ days });
      return NextResponse.json({
        success: true,
        days,
        data,
      });
    }
  } catch (error) {
    console.error('[Batch Metrics] Erreur:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des métriques batches',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

