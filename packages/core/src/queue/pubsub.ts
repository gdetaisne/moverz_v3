/**
 * LOT 13 - Pub/Sub Helper pour Workers
 * 
 * Helpers pour publier les changements de statut batch sur Redis Pub/Sub
 */

import Redis from 'ioredis';
import { BatchStatus } from '@prisma/client';
import { prisma } from '../db';

// Configuration Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Connexion Redis dédiée pour les workers (publisher)
let redisPublisher: Redis | null = null;

/**
 * Obtenir ou créer le publisher Redis
 */
function getPublisher(): Redis {
  if (!redisPublisher) {
    redisPublisher = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false,
    });

    redisPublisher.on('error', (err) => {
      console.error('❌ Redis publisher error:', err.message);
    });

    redisPublisher.on('connect', () => {
      console.log('✅ Redis publisher connected');
    });
  }

  return redisPublisher;
}

/**
 * Publier les changements de statut d'un batch sur Redis Pub/Sub
 */
export async function publishBatchProgress(batchId: string) {
  try {
    // Récupérer l'état actuel du batch depuis la DB
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        status: true,
        countsQueued: true,
        countsProcessing: true,
        countsCompleted: true,
        countsFailed: true,
        photos: {
          select: { id: true },
        },
      },
    });

    if (!batch) {
      console.warn(`⚠️  Batch ${batchId} not found, skipping pub`);
      return;
    }

    const total = batch.photos.length;
    const completed = batch.countsCompleted + batch.countsFailed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Construire le message
    const message = {
      batchId: batch.id,
      status: batch.status,
      progress,
      counts: {
        queued: batch.countsQueued,
        processing: batch.countsProcessing,
        completed: batch.countsCompleted,
        failed: batch.countsFailed,
        total,
      },
      timestamp: Date.now(),
    };

    // Publier sur le canal batch:{batchId}
    const channel = `batch:${batchId}`;
    const publisher = getPublisher();
    
    await publisher.publish(channel, JSON.stringify(message));
    
    console.log(`📡 Published to ${channel}: ${batch.status} ${progress}%`);
  } catch (error: any) {
    console.error(`❌ Error publishing batch ${batchId}:`, error.message);
  }
}

/**
 * Invalider le cache Redis d'un batch (appelé après update DB)
 */
export async function invalidateBatchCache(batchId: string) {
  try {
    const publisher = getPublisher();
    const key = `batch:progress:${batchId}`;
    
    await publisher.del(key);
    console.log(`🗑️  Cache invalidated for batch ${batchId}`);
  } catch (error: any) {
    console.error(`❌ Error invalidating cache for batch ${batchId}:`, error.message);
  }
}

/**
 * Notifier un changement complet de batch (statut + cache + pub/sub)
 */
export async function notifyBatchUpdate(batchId: string) {
  await invalidateBatchCache(batchId);
  await publishBatchProgress(batchId);
}

/**
 * Fermer proprement la connexion Redis
 */
export async function closePubSub() {
  if (redisPublisher) {
    await redisPublisher.quit();
    redisPublisher = null;
    console.log('✅ Redis publisher closed');
  }
}



