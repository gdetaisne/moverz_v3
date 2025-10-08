import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';
import { z } from 'zod';

export const runtime = 'nodejs';

// Validation schema
const callbackSchema = z.object({
  assetId: z.string().cuid(),
  success: z.boolean(),
  sizeBytes: z.number().optional(),
  error: z.string().optional(),
});

/**
 * POST /api/upload/callback
 * 
 * Called after direct S3 upload to update Asset status
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const validation = callbackSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { assetId, success, sizeBytes, error } = validation.data;
    
    // Update Asset status
    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: success ? 'UPLOADED' : 'ERROR',
        uploadedAt: success ? new Date() : null,
        sizeBytes: sizeBytes || 0,
      },
    });
    
    // Log upload metrics
    const latencyMs = Date.now() - startTime;
    console.info('[Upload Callback]', {
      assetId,
      success,
      latencyMs,
      sizeBytes,
      error,
    });
    
    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        status: asset.status,
        s3Key: asset.s3Key,
      },
    });
  } catch (error) {
    console.error('[Upload Callback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update asset status' },
      { status: 500 }
    );
  }
}
