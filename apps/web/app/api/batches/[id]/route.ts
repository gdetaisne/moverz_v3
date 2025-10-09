import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@core/auth';
import { computeBatchProgress } from '@moverz/core';
import { prisma } from '@core/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/batches/[id]
 * Récupère l'état d'avancement d'un batch (polling)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentification
    const userId = await getUserId(req);
    const { id: batchId } = await params;

    // 2. Vérifier que le batch existe et appartient à l'utilisateur
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { userId: true },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch non trouvé', code: 'BATCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (batch.userId !== userId) {
      return NextResponse.json(
        { error: 'Non autorisé', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // 3. Calculer la progression
    const progress = await computeBatchProgress(batchId);

    logger.info(`📊 Batch ${batchId}: ${progress.progress}% (${progress.status})`);

    return NextResponse.json({
      success: true,
      batch: progress,
    }, { status: 200 });

  } catch (error: any) {
    const { id } = await params;
    logger.error(`❌ Erreur récupération batch ${id}:`, error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Batch non trouvé', code: 'BATCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || 'Erreur serveur',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}




