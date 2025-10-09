/**
 * Endpoint d'observabilité pour l'A/B test du classifieur de pièces
 * LOT 18 - Room Classifier A/B Testing
 * 
 * GET /api/ab-status
 * Retourne l'état du flag, le split, et les statistiques agrégées des dernières 24h
 */

import { NextResponse } from 'next/server';
import { getRoomClassifierStats } from '@ai/metrics';

export async function GET(request: Request) {
  try {
    // Calculer le timestamp 24h en arrière
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Obtenir les stats depuis les 24 dernières heures
    const stats = getRoomClassifierStats(since);

    return NextResponse.json({
      enabled: stats.enabled,
      split: stats.split,
      counts: stats.counts,
      avgLatency: stats.avgLatency,
      avgConfidence: stats.avgConfidence,
      period: '24h',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AB Status] Erreur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des statistiques A/B',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


