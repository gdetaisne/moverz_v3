/**
 * LOT 13 - Redis Pub/Sub + Cache
 * 
 * Service centralisé pour Redis :
 * - Pub/Sub pour les updates batch
 * - Cache key-value pour les progress
 * - Métriques
 */

import Redis from 'ioredis';
import { logger } from './logger';

// Configuration Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Métriques
let cacheHits = 0;
let cacheMisses = 0;
let pubSubEvents = 0;

/**
 * Connexion principale Redis (read/write)
 */
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis error:', err.message);
});

/**
 * Connexion dédiée pour Pub/Sub (subscriber)
 * Chaque subscriber doit avoir sa propre connexion
 */
export function createSubscriber(): Redis {
  const subscriber = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });

  subscriber.on('error', (err) => {
    logger.error('❌ Redis subscriber error:', err.message);
  });

  return subscriber;
}

/**
 * Publier un événement batch sur Redis Pub/Sub
 */
export async function publishBatchUpdate(batchId: string, data: {
  batchId: string;
  status: string;
  progress: number;
  counts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
}) {
  try {
    const channel = `batch:${batchId}`;
    const message = JSON.stringify(data);
    
    await redis.publish(channel, message);
    pubSubEvents++;
    
    logger.debug(`📡 Published to ${channel}:`, data);
  } catch (error: any) {
    logger.error('❌ Error publishing batch update:', error.message);
  }
}

/**
 * S'abonner aux événements d'un batch spécifique
 */
export async function subscribeToBatch(
  batchId: string,
  callback: (data: any) => void
): Promise<{ subscriber: Redis; unsubscribe: () => Promise<void> }> {
  const subscriber = createSubscriber();
  const channel = `batch:${batchId}`;

  subscriber.on('message', (chan, message) => {
    if (chan === channel) {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error: any) {
        logger.error('❌ Error parsing batch message:', error.message);
      }
    }
  });

  await subscriber.subscribe(channel);
  logger.debug(`🎧 Subscribed to ${channel}`);

  const unsubscribe = async () => {
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
    logger.debug(`🚫 Unsubscribed from ${channel}`);
  };

  return { subscriber, unsubscribe };
}

/**
 * Cache Progress - Stocker dans Redis avec TTL
 */
export async function setCachedProgress(batchId: string, progress: any, ttlSeconds = 10) {
  try {
    const key = `batch:progress:${batchId}`;
    const value = JSON.stringify(progress);
    
    await redis.setex(key, ttlSeconds, value);
    logger.debug(`💾 Cached progress for batch ${batchId} (TTL: ${ttlSeconds}s)`);
  } catch (error: any) {
    logger.error('❌ Error caching progress:', error.message);
  }
}

/**
 * Cache Progress - Récupérer depuis Redis
 */
export async function getCachedProgress(batchId: string): Promise<any | null> {
  try {
    const key = `batch:progress:${batchId}`;
    const value = await redis.get(key);
    
    if (value) {
      cacheHits++;
      logger.debug(`✅ Cache HIT for batch ${batchId}`);
      return JSON.parse(value);
    } else {
      cacheMisses++;
      logger.debug(`❌ Cache MISS for batch ${batchId}`);
      return null;
    }
  } catch (error: any) {
    cacheMisses++;
    logger.error('❌ Error reading cached progress:', error.message);
    return null;
  }
}

/**
 * Invalider le cache d'un batch (quand status change)
 */
export async function invalidateBatchCache(batchId: string) {
  try {
    const key = `batch:progress:${batchId}`;
    await redis.del(key);
    logger.debug(`🗑️  Cache invalidated for batch ${batchId}`);
  } catch (error: any) {
    logger.error('❌ Error invalidating cache:', error.message);
  }
}

/**
 * Obtenir les métriques Redis
 */
export function getRedisMetrics() {
  const total = cacheHits + cacheMisses;
  const hitRatio = total > 0 ? (cacheHits / total) * 100 : 0;

  return {
    cacheHits,
    cacheMisses,
    cacheTotal: total,
    cacheHitRatio: hitRatio.toFixed(2) + '%',
    pubSubEvents,
  };
}

/**
 * Reset métriques (pour tests)
 */
export function resetRedisMetrics() {
  cacheHits = 0;
  cacheMisses = 0;
  pubSubEvents = 0;
}

/**
 * Fermer proprement les connexions Redis
 */
export async function closeRedis() {
  await redis.quit();
  logger.info('✅ Redis connections closed');
}



