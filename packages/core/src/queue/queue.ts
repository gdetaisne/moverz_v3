// BullMQ Queue Setup
import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection from env
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton Redis connection
let redisConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
    });
  }
  return redisConnection;
}

// Queue options
const defaultQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 20s, 80s
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // 1 day in seconds
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
      age: 7 * 24 * 3600, // 7 days
    },
  },
};

// Queue instances
let photoAnalyzeQueue: Queue | null = null;
let inventorySyncQueue: Queue | null = null;

/**
 * Get photo-analyze queue
 */
export function getPhotoAnalyzeQueue(): Queue {
  if (!photoAnalyzeQueue) {
    photoAnalyzeQueue = new Queue('photo-analyze', defaultQueueOptions);
  }
  return photoAnalyzeQueue;
}

/**
 * Get inventory-sync queue
 */
export function getInventorySyncQueue(): Queue {
  if (!inventorySyncQueue) {
    inventorySyncQueue = new Queue('inventory-sync', defaultQueueOptions);
  }
  return inventorySyncQueue;
}

/**
 * Add job to photo-analyze queue
 */
export async function enqueuePhotoAnalysis(data: {
  photoId: string;
  userId: string;
  assetId?: string;
  roomType?: string;
  batchId?: string;
}) {
  const queue = getPhotoAnalyzeQueue();
  const job = await queue.add('analyze', data, {
    jobId: `photo-${data.photoId}`,
  });
  return job;
}

/**
 * Add job to inventory-sync queue
 */
export async function enqueueInventorySync(data: {
  projectId: string;
  userId: string;
  batchId?: string;
}) {
  const queue = getInventorySyncQueue();
  const jobIdSuffix = data.batchId ? `-batch-${data.batchId}` : '';
  const job = await queue.add('sync', data, {
    jobId: `inventory-${data.projectId}${jobIdSuffix}`,
  });
  return job;
}

/**
 * Enqueue all photos from a batch for analysis
 */
export async function enqueueBatch(batchId: string) {
  const { prisma } = await import('../db');
  
  // Récupérer toutes les photos du batch avec status PENDING
  const photos = await prisma.photo.findMany({
    where: {
      batchId,
      status: 'PENDING',
    },
    select: {
      id: true,
      roomType: true,
      batch: {
        select: {
          userId: true,
          projectId: true,
        },
      },
    },
  });

  if (photos.length === 0) {
    console.log(`⚠️  No pending photos in batch ${batchId}`);
    return [];
  }

  console.log(`📤 Enqueuing ${photos.length} photos from batch ${batchId}`);

  // Enqueue tous les jobs en parallèle
  const queue = getPhotoAnalyzeQueue();
  const jobs = await Promise.all(
    photos.map((photo) =>
      queue.add('analyze', {
        photoId: photo.id,
        userId: photo.batch!.userId,
        roomType: photo.roomType || undefined,
        batchId,
      }, {
        jobId: `photo-${photo.id}`,
      })
    )
  );

  console.log(`✅ ${jobs.length} jobs enqueued for batch ${batchId}`);

  return jobs;
}

/**
 * Get queue stats
 */
export async function getQueueStats(queueName: string) {
  const queue = queueName === 'photo-analyze' 
    ? getPhotoAnalyzeQueue() 
    : getInventorySyncQueue();
  
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);
  
  return {
    name: queueName,
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
}

/**
 * Close all connections (for graceful shutdown)
 */
export async function closeQueues() {
  const promises = [];
  
  if (photoAnalyzeQueue) {
    promises.push(photoAnalyzeQueue.close());
  }
  if (inventorySyncQueue) {
    promises.push(inventorySyncQueue.close());
  }
  if (redisConnection) {
    promises.push(redisConnection.quit());
  }
  
  await Promise.all(promises);
}
