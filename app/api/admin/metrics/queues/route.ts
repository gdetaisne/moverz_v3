/**
 * Endpoint snapshot queues BullMQ
 * GET /api/admin/metrics/queues
 * LOT 18.1 - Monitoring Lite
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_utils/auth';
import { getQueuesMetrics } from '@core/metrics/queues';

export async function GET(request: NextRequest) {
  // Guard admin
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const data = await getQueuesMetrics();
    
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[Queue Metrics] Erreur:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des métriques queues',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

