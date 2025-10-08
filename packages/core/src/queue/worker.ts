// BullMQ Workers - LOT 10: AI Pipeline Integration
import { Worker, Job } from 'bullmq';
import { getRedisConnection, enqueueInventorySync } from './queue';
import { prisma } from '../db';
import { mapError } from './errorMapping';
import { updateBatchCounts, shouldTriggerInventorySync } from '../batch/batchService';
import fs from 'fs/promises';
import path from 'path';

// Worker options
const workerOptions = {
  connection: getRedisConnection(),
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '2'),
};

/**
 * Handle batch photo completion: update counts and trigger inventory-sync if needed
 */
async function handleBatchPhotoCompletion(batchId: string, photoId: string, projectId: string) {
  try {
    console.log(`[Worker] 📊 Updating batch ${batchId} after photo ${photoId} completion`);

    // Mettre à jour les compteurs du batch
    const { isComplete, batch } = await updateBatchCounts(batchId);

    // Si le batch est complet, déclencher l'inventory-sync (une seule fois)
    if (isComplete && await shouldTriggerInventorySync(batchId)) {
      console.log(`[Worker] 🎯 Batch ${batchId} complet, déclenchement inventory-sync`);

      // Récupérer l'userId du batch
      const batchData = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { userId: true, projectId: true },
      });

      if (batchData) {
        await enqueueInventorySync({
          projectId: batchData.projectId,
          userId: batchData.userId,
          batchId,
        });
        console.log(`[Worker] ✅ Inventory-sync enqueued for batch ${batchId}`);
      }
    }
  } catch (error) {
    console.error(`[Worker] ❌ Error handling batch completion:`, error);
    // Ne pas re-throw pour ne pas faire échouer le job photo
  }
}

/**
 * Load image buffer from file path or URL
 */
async function loadImageBuffer(photo: { filePath: string; url: string }): Promise<Buffer> {
  try {
    // Si filePath existe localement, le charger
    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    const filename = path.basename(photo.filePath);
    const fullPath = path.join(uploadsDir, filename);
    
    try {
      return await fs.readFile(fullPath);
    } catch {
      // Sinon, essayer de fetch depuis URL (si S3)
      if (photo.url.startsWith('http')) {
        const response = await fetch(photo.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      throw new Error(`Cannot load image from ${photo.filePath}`);
    }
  } catch (error) {
    throw new Error(`Failed to load image: ${error}`);
  }
}

/**
 * Photo Analysis Worker
 * Processes photo analysis jobs with AI engine
 */
export function createPhotoAnalyzeWorker(): Worker {
  return new Worker('photo-analyze', async (job: Job) => {
    const startTime = Date.now();
    const { photoId, userId, roomType: providedRoomType, batchId } = job.data;
    
    console.log(`[Worker] 🔄 Processing photo-analyze job ${job.id} (photo: ${photoId}${batchId ? `, batch: ${batchId}` : ''})`);
    
    try {
      // 1. Récupérer la photo depuis DB
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
        select: {
          id: true,
          status: true,
          filePath: true,
          url: true,
          roomType: true,
          analysis: true,
        },
      });

      if (!photo) {
        throw new Error(`Photo ${photoId} not found`);
      }

      // 2. Idempotence: skip si déjà DONE (sauf si force re-analyze)
      if (photo.status === 'DONE' && !job.data.force) {
        console.log(`[Worker] ⏭️  Photo ${photoId} already processed, skipping`);
        return { status: 'skipped', reason: 'already_done' };
      }

      // 3. Marquer comme PROCESSING
      await prisma.photo.update({
        where: { id: photoId },
        data: {
          status: 'PROCESSING',
          errorCode: null,
          errorMessage: null,
        },
      });

      // 4. Charger l'image
      const imageBuffer = await loadImageBuffer(photo);
      console.log(`[Worker] 📷 Image loaded: ${imageBuffer.length} bytes`);

      // 5. Analyse IA (dynamique import pour éviter erreurs build)
      let aiEngine: any;
      try {
        aiEngine = await import('@moverz/ai/engine');
      } catch {
        throw new Error('AI engine not available (mock mode)');
      }

      let detectedRoomType = providedRoomType || photo.roomType;
      let analysis: any = null;

      // 5a. Détecter le type de pièce si absent
      if (!detectedRoomType) {
        console.log(`[Worker] 🔍 Detecting room type...`);
        const detectStart = Date.now();
        
        try {
          detectedRoomType = await aiEngine.detectRoom(imageBuffer, {
            timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000'),
          });
          
          // Écrire métrique detectRoom
          await prisma.aiMetric.create({
            data: {
              provider: 'anthropic',
              model: 'claude-3-sonnet',
              operation: 'detect_room',
              latencyMs: Date.now() - detectStart,
              success: true,
              retries: job.attemptsMade,
              meta: { photoId, userId },
            },
          });
          
          console.log(`[Worker] ✅ Room detected: ${detectedRoomType}`);
        } catch (error) {
          // Log métrique en échec mais continuer sans roomType
          await prisma.aiMetric.create({
            data: {
              provider: 'anthropic',
              model: 'claude-3-sonnet',
              operation: 'detect_room',
              latencyMs: Date.now() - detectStart,
              success: false,
              errorType: mapError(error).errorCode,
              retries: job.attemptsMade,
              meta: { photoId, userId, error: String(error) },
            },
          });
          console.warn(`[Worker] ⚠️  Room detection failed, continuing without roomType`);
        }
      }

      // 5b. Analyser les objets
      console.log(`[Worker] 🧠 Analyzing photo items...`);
      const analyzeStart = Date.now();
      
      analysis = await aiEngine.analyzePhoto(imageBuffer, {
        provider: process.env.AI_PROVIDER || 'claude',
        roomType: detectedRoomType,
        userId,
        timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000'),
      });

      const analyzeLatency = Date.now() - analyzeStart;

      // Écrire métrique analyze_photo
      await prisma.aiMetric.create({
        data: {
          provider: process.env.AI_PROVIDER || 'anthropic',
          model: process.env.AI_PROVIDER === 'openai' ? 'gpt-4-vision' : 'claude-3-sonnet',
          operation: 'analyze_photo',
          latencyMs: analyzeLatency,
          success: true,
          retries: job.attemptsMade,
          meta: { 
            photoId, 
            userId, 
            roomType: detectedRoomType,
            itemsCount: analysis?.items?.length || 0,
          },
        },
      });

      console.log(`[Worker] ✅ Analysis complete: ${analysis?.items?.length || 0} items`);

      // 6. Persister le résultat avec transaction
      await prisma.photo.update({
        where: { id: photoId },
        data: {
          status: 'DONE',
          roomType: detectedRoomType,
          analysis: analysis as any,
          processedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });

      const totalDuration = Date.now() - startTime;
      console.log(`[Worker] ✅ Photo ${photoId} processed in ${totalDuration}ms (${job.attemptsMade} attempts)`);

      // 7. Si batch: mettre à jour les compteurs et déclencher inventory-sync si nécessaire
      if (batchId) {
        await handleBatchPhotoCompletion(batchId, photoId, photo.projectId);
      }

      return {
        photoId,
        roomType: detectedRoomType,
        itemsCount: analysis?.items?.length || 0,
        duration_ms: totalDuration,
      };

    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      const mapped = mapError(error);

      console.error(`[Worker] ❌ Photo ${photoId} failed:`, mapped.errorCode, mapped.errorMessage);

      // Persister l'erreur
      await prisma.photo.update({
        where: { id: photoId },
        data: {
          status: 'ERROR',
          errorCode: mapped.errorCode,
          errorMessage: mapped.errorMessage,
          processedAt: new Date(),
        },
      });

      // Écrire métrique en échec
      await prisma.aiMetric.create({
        data: {
          provider: process.env.AI_PROVIDER || 'anthropic',
          model: 'unknown',
          operation: 'analyze_photo',
          latencyMs: totalDuration,
          success: false,
          errorType: mapped.errorCode,
          retries: job.attemptsMade,
          meta: { photoId, userId, error: mapped.errorMessage },
        },
      });

      // Si batch: mettre à jour les compteurs même en cas d'erreur
      if (batchId) {
        try {
          const photo = await prisma.photo.findUnique({
            where: { id: photoId },
            select: { projectId: true },
          });
          if (photo) {
            await handleBatchPhotoCompletion(batchId, photoId, photo.projectId);
          }
        } catch (batchError) {
          console.error(`[Worker] ⚠️  Failed to update batch ${batchId}:`, batchError);
        }
      }

      // Re-throw pour BullMQ retry si retryable
      if (mapped.retryable && job.attemptsMade < 3) {
        throw error;
      }

      // Sinon, marquer comme failed définitif
      return {
        error: mapped.errorCode,
        message: mapped.errorMessage,
        retryable: false,
      };
    }
  }, workerOptions);
}

/**
 * Inventory Sync Worker
 * Aggregates inventory results from completed photos
 */
export function createInventorySyncWorker(): Worker {
  return new Worker('inventory-sync', async (job: Job) => {
    const startTime = Date.now();
    const { projectId, userId, batchId } = job.data;
    
    console.log(`[Worker] 📊 Processing inventory-sync job ${job.id} (project: ${projectId}${batchId ? `, batch: ${batchId}` : ''})`);
    
    try {
      // 1. Récupérer toutes les photos DONE du projet (ou du batch si spécifié)
      const whereClause: any = {
        projectId,
        status: 'DONE',
        analysis: { not: null },
      };

      if (batchId) {
        whereClause.batchId = batchId;
      }

      const photos = await prisma.photo.findMany({
        where: whereClause,
        select: {
          id: true,
          roomType: true,
          analysis: true,
          processedAt: true,
        },
      });

      console.log(`[Worker] 📷 Found ${photos.length} analyzed photos`);

      if (photos.length === 0) {
        return {
          projectId,
          totalItems: 0,
          totalVolume: 0,
          rooms: [],
          message: 'No analyzed photos found',
        };
      }

      // 2. Agréger les items par pièce
      const roomsMap = new Map<string, any>();
      let totalItems = 0;
      let totalVolume = 0;

      for (const photo of photos) {
        const analysis = photo.analysis as any;
        const roomType = photo.roomType || 'unknown';

        if (!roomsMap.has(roomType)) {
          roomsMap.set(roomType, {
            roomType,
            itemsCount: 0,
            volume_m3: 0,
            photos: [],
          });
        }

        const room = roomsMap.get(roomType);
        const itemsCount = analysis?.items?.length || 0;
        const volume = analysis?.totals?.volume_m3 || 0;

        room.itemsCount += itemsCount;
        room.volume_m3 += volume;
        room.photos.push(photo.id);

        totalItems += itemsCount;
        totalVolume += volume;
      }

      const rooms = Array.from(roomsMap.values());

      // 3. Persister le résultat (à améliorer: table dédiée ou champ Project.inventorySummary)
      // Pour l'instant, on log juste le résultat
      const summary = {
        projectId,
        batchId: batchId || null,
        totalItems,
        totalVolume: Math.round(totalVolume * 1000) / 1000,
        rooms,
        syncedAt: new Date().toISOString(),
      };

      const duration = Date.now() - startTime;
      console.log(`[Worker] ✅ Inventory synced for project ${projectId}${batchId ? ` (batch ${batchId})` : ''} in ${duration}ms`);
      console.log(`[Worker] 📦 Total: ${totalItems} items, ${summary.totalVolume} m³ across ${rooms.length} rooms`);

      return summary;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[Worker] ❌ Inventory sync failed for project ${projectId}:`, error);

      throw error; // Re-throw pour BullMQ retry
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
