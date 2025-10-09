import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { enqueuePhotoAnalysis } from '@moverz/core/queue/queue';
import { logger } from '@/lib/logger';

// Schema de validation
const EnqueuePhotoSchema = z.object({
  photoId: z.string().min(1, 'photoId requis'),
  userId: z.string().min(1, 'userId requis'),
  roomType: z.string().optional(),
});

/**
 * POST /api/photos/enqueue
 * Enqueue une photo pour analyse IA asynchrone
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Parse et valide le body
    const body = await req.json();
    const validated = EnqueuePhotoSchema.parse(body);
    
    const { photoId, userId, roomType } = validated;

    // 2. Vérifier que la photo existe
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      select: { 
        id: true, 
        projectId: true,
        status: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo non trouvée', code: 'PHOTO_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Vérifier que la photo n'est pas déjà en traitement
    if (photo.status === 'PROCESSING') {
      logger.warn(`Photo ${photoId} déjà en traitement, skip enqueue`);
      return NextResponse.json({
        success: true,
        status: 'already_processing',
        photoId,
      });
    }

    // 4. Si déjà DONE, permettre re-traitement (idempotence)
    if (photo.status === 'DONE') {
      logger.info(`Photo ${photoId} déjà analysée, re-enqueue autorisé`);
    }

    // 5. Enqueue le job BullMQ
    const job = await enqueuePhotoAnalysis({
      photoId,
      userId,
      roomType,
    });

    // 6. Mettre à jour le statut en PENDING
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        status: 'PENDING',
        errorCode: null,
        errorMessage: null,
        processedAt: null,
      },
    });

    const duration = Date.now() - startTime;

    logger.info(`✅ Photo ${photoId} enqueued (job ${job.id}) en ${duration}ms`);

    return NextResponse.json({
      success: true,
      status: 'enqueued',
      jobId: job.id,
      photoId,
      queuePosition: await job.getState(),
    }, { status: 202 });

  } catch (error: any) {
    logger.error('❌ Erreur enqueue photo:', error);

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation échouée', 
          details: error.errors,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Erreur générique
    return NextResponse.json(
      { 
        error: error.message || 'Erreur serveur',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}



