/**
 * Agrégats Batches - tendance 7 derniers jours
 * LOT 18.1 - Monitoring Lite
 */

import { PrismaClient, BatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface BatchDailyMetric {
  date: string; // YYYY-MM-DD
  batchesCreated: number;
  completed: number;
  partial: number;
  failed: number;
  completionRate: number; // 0-1
  avgPhotosPerBatch: number;
  avgE2Esec: number; // Temps moyen création → complétion
}

export interface BatchMetricsParams {
  days?: number; // Default 7
}

/**
 * Récupère les métriques batches agrégées par jour
 */
export async function getBatchDailyMetrics(
  params: BatchMetricsParams = {}
): Promise<BatchDailyMetric[]> {
  const days = params.days || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await prisma.$queryRaw<Array<{
    date: string;
    batches_created: bigint;
    completed: bigint;
    partial: bigint;
    failed: bigint;
    avg_photos: number;
    avg_e2e_sec: number;
  }>>`
    SELECT 
      DATE(b.createdAt AT TIME ZONE 'UTC') as date,
      COUNT(*) as batches_created,
      COUNT(*) FILTER (WHERE b.status = 'COMPLETED') as completed,
      COUNT(*) FILTER (WHERE b.status = 'PARTIAL') as partial,
      COUNT(*) FILTER (WHERE b.status = 'FAILED') as failed,
      AVG(
        COALESCE(
          (SELECT COUNT(*) FROM "Photo" p WHERE p.batchId = b.id),
          0
        )
      ) as avg_photos,
      AVG(
        CASE 
          WHEN b.status IN ('COMPLETED', 'PARTIAL', 'FAILED') 
          THEN EXTRACT(EPOCH FROM (b.updatedAt - b.createdAt))
          ELSE NULL 
        END
      ) as avg_e2e_sec
    FROM "Batch" b
    WHERE b.createdAt >= ${startDate}
    GROUP BY DATE(b.createdAt AT TIME ZONE 'UTC')
    ORDER BY date DESC
  `;

  return results.map(row => ({
    date: row.date,
    batchesCreated: Number(row.batches_created),
    completed: Number(row.completed),
    partial: Number(row.partial),
    failed: Number(row.failed),
    completionRate: Number(row.batches_created) > 0 
      ? Number(row.completed) / Number(row.batches_created) 
      : 0,
    avgPhotosPerBatch: Math.round(Number(row.avg_photos || 0)),
    avgE2Esec: Math.round(Number(row.avg_e2e_sec || 0)),
  }));
}

/**
 * Récupère un résumé global des batches
 */
export async function getBatchSummary() {
  const last7days = new Date();
  last7days.setDate(last7days.getDate() - 7);

  const summary = await prisma.batch.aggregate({
    where: {
      createdAt: {
        gte: last7days,
      },
    },
    _count: {
      id: true,
    },
  });

  const byStatus = await prisma.batch.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: last7days,
      },
    },
    _count: {
      id: true,
    },
  });

  const statusCounts = byStatus.reduce((acc, item) => {
    acc[item.status] = item._count.id;
    return acc;
  }, {} as Record<BatchStatus, number>);

  const totalBatches = summary._count.id;
  const completed = statusCounts.COMPLETED || 0;
  const partial = statusCounts.PARTIAL || 0;
  const failed = statusCounts.FAILED || 0;

  return {
    totalBatches,
    completed,
    partial,
    failed,
    completionRate: totalBatches > 0 ? completed / totalBatches : 0,
    partialRate: totalBatches > 0 ? partial / totalBatches : 0,
    failedRate: totalBatches > 0 ? failed / totalBatches : 0,
  };
}



