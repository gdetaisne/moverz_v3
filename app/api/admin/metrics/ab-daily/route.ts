/**
 * Endpoint agrégats A/B Room Classifier par jour
 * GET /api/admin/metrics/ab-daily?days=14
 * LOT 18.1 - Monitoring Lite
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_utils/auth';
import { getAbDailyMetrics, getAbSummary } from '@core/metrics/abDaily';

export async function GET(request: NextRequest) {
  // Guard admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14', 10);
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      // Vue d'ensemble
      const data = await getAbSummary();
      return NextResponse.json({
        success: true,
        data,
      });
    } else {
      // Détail par jour
      const data = await getAbDailyMetrics({ days });
      return NextResponse.json({
        success: true,
        days,
        data,
      });
    }
  } catch (error) {
    console.error('[AB Daily Metrics] Erreur:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des métriques A/B',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

