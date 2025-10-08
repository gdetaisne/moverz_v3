import { NextRequest, NextResponse } from 'next/server';
import { enqueuePhotoAnalysis, getQueueStats } from '@core/queue/queue';
import { prisma } from '@core/db';

export const runtime = 'nodejs';

/**
 * POST /api/queue/test
 * 
 * Test endpoint to enqueue a photo analysis job
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || 'test-user';
    const photoId = body.photoId || `photo-${Date.now()}`;
    
    // Create Job record in DB
    const job = await prisma.job.create({
      data: {
        type: 'analyze_photo',
        assetId: null,
        userId,
        status: 'PENDING',
      },
    });
    
    // Enqueue to BullMQ
    const bullJob = await enqueuePhotoAnalysis({
      photoId,
      userId,
      roomType: body.roomType || 'salon',
    });
    
    // Update Job with BullMQ job ID
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      bullJobId: bullJob.id,
      queuePosition: await bullJob.getState(),
    });
  } catch (error) {
    console.error('[Queue Test] Error:', error);
    return NextResponse.json(
      { error: 'Failed to enqueue job', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/queue/test
 * 
 * Get queue statistics
 */
export async function GET(req: NextRequest) {
  try {
    const stats = await Promise.all([
      getQueueStats('photo-analyze'),
      getQueueStats('inventory-sync'),
    ]);
    
    return NextResponse.json({
      queues: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Queue Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue stats', details: (error as Error).message },
      { status: 500 }
    );
  }
}
