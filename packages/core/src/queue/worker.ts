// BullMQ Workers
import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './queue';
import { prisma } from '../db';

// Worker options
const workerOptions = {
  connection: getRedisConnection(),
  concurrency: 2, // 2 jobs en parallèle max
};

/**
 * Photo Analysis Worker
 * Processes photo analysis jobs
 */
export function createPhotoAnalyzeWorker(
  processor: (job: Job) => Promise<any>
): Worker {
  return new Worker('photo-analyze', async (job: Job) => {
    const startTime = Date.now();
    
    try {
      console.log(`[Worker] Processing photo-analyze job ${job.id}`, job.data);
      
      // Execute the processor
      const result = await processor(job);
      
      // Update Job in DB
      const jobDuration = Date.now() - startTime;
      await prisma.job.updateMany({
        where: { 
          type: 'analyze_photo',
          // Match by metadata if available
        },
        data: {
          status: 'COMPLETED',
          progress: 100,
          result: result,
          completedAt: new Date(),
        },
      });
      
      // Log metrics
      console.info('[Worker] Photo analysis completed', {
        jobId: job.id,
        duration_ms: jobDuration,
        attempts: job.attemptsMade,
      });
      
      return result;
    } catch (error) {
      const jobDuration = Date.now() - startTime;
      
      console.error('[Worker] Photo analysis failed', {
        jobId: job.id,
        error: (error as Error).message,
        duration_ms: jobDuration,
        attempts: job.attemptsMade,
      });
      
      // Update Job in DB
      await prisma.job.updateMany({
        where: { 
          type: 'analyze_photo',
        },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
          completedAt: new Date(),
        },
      });
      
      throw error; // Re-throw for BullMQ retry
    }
  }, workerOptions);
}

/**
 * Inventory Sync Worker
 * Aggregates inventory results
 */
export function createInventorySyncWorker(
  processor: (job: Job) => Promise<any>
): Worker {
  return new Worker('inventory-sync', async (job: Job) => {
    const startTime = Date.now();
    
    try {
      console.log(`[Worker] Processing inventory-sync job ${job.id}`, job.data);
      
      // Execute the processor
      const result = await processor(job);
      
      // Update Job in DB
      const jobDuration = Date.now() - startTime;
      await prisma.job.updateMany({
        where: { 
          type: 'generate_pdf', // Or appropriate type
        },
        data: {
          status: 'COMPLETED',
          progress: 100,
          result: result,
          completedAt: new Date(),
        },
      });
      
      // Log metrics
      console.info('[Worker] Inventory sync completed', {
        jobId: job.id,
        duration_ms: jobDuration,
        attempts: job.attemptsMade,
      });
      
      return result;
    } catch (error) {
      const jobDuration = Date.now() - startTime;
      
      console.error('[Worker] Inventory sync failed', {
        jobId: job.id,
        error: (error as Error).message,
        duration_ms: jobDuration,
        attempts: job.attemptsMade,
      });
      
      // Update Job in DB
      await prisma.job.updateMany({
        where: { 
          type: 'generate_pdf',
        },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
          completedAt: new Date(),
        },
      });
      
      throw error;
    }
  }, workerOptions);
}

/**
 * Graceful shutdown
 */
export async function shutdownWorkers(workers: Worker[]) {
  console.log('[Worker] Shutting down gracefully...');
  await Promise.all(workers.map(w => w.close()));
  console.log('[Worker] All workers closed');
}
