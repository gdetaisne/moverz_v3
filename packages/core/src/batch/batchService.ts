// LOT 11 - Batch Service
import { prisma } from '../db';
import { BatchStatus, PhotoStatus } from '@prisma/client';
import crypto from 'crypto';

export interface CreateBatchInput {
  projectId: string;
  userId: string;
  assets: Array<{
    filename: string;
    filePath: string;
    url: string;
    roomType?: string;
  }>;
}

export interface BatchProgress {
  batchId: string;
  status: BatchStatus;
  progress: number; // 0-100
  counts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  photos: Array<{
    id: string;
    filename: string;
    status: PhotoStatus;
    roomType?: string;
    errorCode?: string;
    errorMessage?: string;
  }>;
  inventorySummary?: {
    totalItems: number;
    totalVolume: number;
    rooms: Array<{
      roomType: string;
      itemsCount: number;
      volume_m3: number;
    }>;
  };
}

/**
 * Génère un checksum simple pour détecter les duplicates
 */
function generateChecksum(filename: string, url: string): string {
  return crypto.createHash('md5').update(`${filename}:${url}`).digest('hex');
}

/**
 * Crée un nouveau batch avec les photos associées
 */
export async function createBatch(input: CreateBatchInput) {
  const { projectId, userId, assets } = input;

  // Vérifier que le projet existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (project.userId !== userId) {
    throw new Error(`Unauthorized: project ${projectId} does not belong to user ${userId}`);
  }

  // Créer le batch avec les photos en transaction
  const batch = await prisma.$transaction(async (tx) => {
    // Créer le batch
    const newBatch = await tx.batch.create({
      data: {
        projectId,
        userId,
        status: 'QUEUED',
        countsQueued: assets.length,
        countsProcessing: 0,
        countsCompleted: 0,
        countsFailed: 0,
        inventoryQueued: false,
      },
    });

    // Créer les photos avec checksums
    const photosData = assets.map((asset) => ({
      projectId,
      batchId: newBatch.id,
      filename: asset.filename,
      filePath: asset.filePath,
      url: asset.url,
      roomType: asset.roomType || null,
      status: 'PENDING' as PhotoStatus,
      checksum: generateChecksum(asset.filename, asset.url),
    }));

    await tx.photo.createMany({
      data: photosData,
    });

    // Récupérer les photos créées avec leurs IDs
    const createdPhotos = await tx.photo.findMany({
      where: { batchId: newBatch.id },
      select: { id: true, filename: true, checksum: true },
    });

    return {
      ...newBatch,
      photos: createdPhotos,
    };
  });

  console.log(`✅ Batch ${batch.id} créé avec ${batch.photos.length} photos`);

  return batch;
}

/**
 * Met à jour les compteurs et le statut d'un batch après changement d'état d'une photo
 */
export async function updateBatchCounts(batchId: string) {
  // Récupérer le batch et ses photos
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      photos: {
        select: { status: true },
      },
    },
  });

  if (!batch) {
    throw new Error(`Batch ${batchId} not found`);
  }

  // Compter les photos par statut
  const counts = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  for (const photo of batch.photos) {
    if (photo.status === 'PENDING') counts.queued++;
    else if (photo.status === 'PROCESSING') counts.processing++;
    else if (photo.status === 'DONE') counts.completed++;
    else if (photo.status === 'ERROR') counts.failed++;
  }

  const total = batch.photos.length;

  // Calculer le nouveau statut du batch
  let newStatus: BatchStatus = batch.status;

  if (counts.processing > 0 || (counts.queued > 0 && counts.completed + counts.failed > 0)) {
    newStatus = 'PROCESSING';
  } else if (counts.completed === total) {
    newStatus = 'COMPLETED';
  } else if (counts.failed === total) {
    newStatus = 'FAILED';
  } else if (counts.completed > 0 && counts.failed > 0 && counts.queued === 0 && counts.processing === 0) {
    newStatus = 'PARTIAL';
  }

  // Mettre à jour le batch
  const updated = await prisma.batch.update({
    where: { id: batchId },
    data: {
      status: newStatus,
      countsQueued: counts.queued,
      countsProcessing: counts.processing,
      countsCompleted: counts.completed,
      countsFailed: counts.failed,
    },
  });

  console.log(`📊 Batch ${batchId} mis à jour: ${newStatus} (${counts.completed}/${total} OK, ${counts.failed} KO)`);

  return {
    batch: updated,
    counts,
    isComplete: counts.queued === 0 && counts.processing === 0,
  };
}

/**
 * Calcule la progression d'un batch (0-100)
 */
export async function computeBatchProgress(batchId: string): Promise<BatchProgress> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      photos: {
        select: {
          id: true,
          filename: true,
          status: true,
          roomType: true,
          errorCode: true,
          errorMessage: true,
          analysis: true,
        },
      },
    },
  });

  if (!batch) {
    throw new Error(`Batch ${batchId} not found`);
  }

  const total = batch.photos.length;
  const completed = batch.countsCompleted + batch.countsFailed;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const result: BatchProgress = {
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
    photos: batch.photos.map((p) => ({
      id: p.id,
      filename: p.filename,
      status: p.status,
      roomType: p.roomType || undefined,
      errorCode: p.errorCode || undefined,
      errorMessage: p.errorMessage || undefined,
    })),
  };

  // Si le batch est terminé (completed ou partial), calculer l'inventorySummary
  if (batch.status === 'COMPLETED' || batch.status === 'PARTIAL') {
    const roomsMap = new Map<string, { itemsCount: number; volume_m3: number }>();
    let totalItems = 0;
    let totalVolume = 0;

    for (const photo of batch.photos) {
      if (photo.status === 'DONE' && photo.analysis) {
        const analysis = photo.analysis as any;
        const roomType = photo.roomType || 'unknown';
        const itemsCount = analysis?.items?.length || 0;
        const volume = analysis?.totals?.volume_m3 || 0;

        if (!roomsMap.has(roomType)) {
          roomsMap.set(roomType, { itemsCount: 0, volume_m3: 0 });
        }

        const room = roomsMap.get(roomType)!;
        room.itemsCount += itemsCount;
        room.volume_m3 += volume;

        totalItems += itemsCount;
        totalVolume += volume;
      }
    }

    result.inventorySummary = {
      totalItems,
      totalVolume: Math.round(totalVolume * 1000) / 1000,
      rooms: Array.from(roomsMap.entries()).map(([roomType, data]) => ({
        roomType,
        itemsCount: data.itemsCount,
        volume_m3: Math.round(data.volume_m3 * 1000) / 1000,
      })),
    };
  }

  return result;
}

/**
 * Vérifie si le batch doit déclencher l'inventory-sync
 * Retourne true si c'est la première fois qu'on le déclenche
 */
export async function shouldTriggerInventorySync(batchId: string): Promise<boolean> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { 
      id: true, 
      inventoryQueued: true,
      countsQueued: true,
      countsProcessing: true,
    },
  });

  if (!batch) {
    return false;
  }

  // Si déjà déclenché, ne pas re-déclencher
  if (batch.inventoryQueued) {
    return false;
  }

  // Si toutes les photos sont traitées (completed ou failed)
  const isComplete = batch.countsQueued === 0 && batch.countsProcessing === 0;

  if (isComplete) {
    // Marquer comme déclenché
    await prisma.batch.update({
      where: { id: batchId },
      data: { inventoryQueued: true },
    });

    return true;
  }

  return false;
}

