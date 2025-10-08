import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserId } from '@core/auth';
import { createBatch, enqueueBatch } from '@moverz/core';
import { logger } from '@/lib/logger';

// Schema de validation
const CreateBatchSchema = z.object({
  projectId: z.string().min(1, 'projectId requis'),
  imageUrls: z.array(z.object({
    filename: z.string().min(1),
    filePath: z.string().min(1),
    url: z.string().url(),
    roomType: z.string().optional(),
  })).min(1, 'Au moins une image requise'),
});

/**
 * POST /api/batches
 * Crée un nouveau batch de photos à analyser
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Authentification
    const userId = await getUserId(req);

    // 2. Parse et valide le body
    const body = await req.json();
    const validated = CreateBatchSchema.parse(body);
    
    const { projectId, imageUrls } = validated;

    logger.info(`📦 Création batch: ${imageUrls.length} photos pour projet ${projectId}`);

    // 3. Créer le batch avec les photos
    const batch = await createBatch({
      projectId,
      userId,
      assets: imageUrls,
    });

    // 4. Enqueue tous les jobs d'analyse
    const jobs = await enqueueBatch(batch.id);

    const duration = Date.now() - startTime;

    logger.info(`✅ Batch ${batch.id} créé avec ${jobs.length} jobs enqueued en ${duration}ms`);

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      photosCount: batch.photos.length,
      jobsEnqueued: jobs.length,
    }, { status: 202 });

  } catch (error: any) {
    logger.error('❌ Erreur création batch:', error);

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

    // Erreur métier (projet non trouvé, unauthorized, etc.)
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { 
          error: error.message,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { 
          error: error.message,
          code: 'UNAUTHORIZED',
        },
        { status: 403 }
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

