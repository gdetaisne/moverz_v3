/**
 * Agrégats BullMQ Queues - snapshot temps réel
 * LOT 18.1 - Monitoring Lite
 */

export interface QueueSnapshot {
  name: string;
  waiting: number;
  active: number;
  completedLastHour: number;
  failedLastHour: number;
}

export interface QueuesMetrics {
  available: boolean;
  timestamp: string;
  queues: QueueSnapshot[];
}

/**
 * Récupère les métriques des queues BullMQ
 * Si BullMQ non disponible, retourne available: false
 */
export async function getQueuesMetrics(): Promise<QueuesMetrics> {
  try {
    // Import dynamique pour tolérer l'absence de BullMQ
    const { Queue } = await import('bullmq');
    const Redis = (await import('ioredis')).default;
    
    // Configuration Redis
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    // Liste des queues connues
    const queueNames = ['photo-analyze', 'inventory-sync'];
    const snapshots: QueueSnapshot[] = [];

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const queueName of queueNames) {
      try {
        const queue = new Queue(queueName, { connection });

        // Obtenir les compteurs
        const [waiting, active] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
        ]);

        // Compter les jobs completed et failed de la dernière heure
        // Note: ceci est une approximation, BullMQ ne garde pas tout en mémoire
        const completedJobs = await queue.getCompleted(0, 100);
        const failedJobs = await queue.getFailed(0, 100);

        const completedLastHour = completedJobs.filter(
          (job: any) => job.finishedOn && job.finishedOn >= oneHourAgo
        ).length;

        const failedLastHour = failedJobs.filter(
          (job: any) => job.finishedOn && job.finishedOn >= oneHourAgo
        ).length;

        snapshots.push({
          name: queueName,
          waiting,
          active,
          completedLastHour,
          failedLastHour,
        });

        await queue.close();
      } catch (error) {
        console.warn(`[Queues Metrics] Erreur lecture queue ${queueName}:`, error);
        // Ajouter un snapshot avec des zéros
        snapshots.push({
          name: queueName,
          waiting: 0,
          active: 0,
          completedLastHour: 0,
          failedLastHour: 0,
        });
      }
    }

    await connection.quit();

    return {
      available: true,
      timestamp: new Date().toISOString(),
      queues: snapshots,
    };
  } catch (error) {
    console.warn('[Queues Metrics] BullMQ non disponible:', error);
    
    // Retourner un résultat vide mais valide
    return {
      available: false,
      timestamp: new Date().toISOString(),
      queues: [],
    };
  }
}

