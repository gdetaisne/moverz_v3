import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';
import { validateUpload, generateS3Key, generateSignedUploadUrl } from '@core/s3Client';
import { z } from 'zod';

export const runtime = 'nodejs';

// Validation schema
const signRequestSchema = z.object({
  filename: z.string().min(1, 'Filename required'),
  mime: z.string().min(1, 'MIME type required'),
  size: z.number().optional(),
  userId: z.string().min(1, 'User ID required'),
  projectId: z.string().optional(),
});

/**
 * GET /api/upload/sign
 * 
 * Generate presigned S3 URL for direct upload
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = signRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { filename, mime, size, userId, projectId } = validation.data;
    
    // Validate upload constraints
    const uploadValidation = validateUpload({ filename, mime, size });
    if (!uploadValidation.valid) {
      return NextResponse.json(
        { error: uploadValidation.error },
        { status: 400 }
      );
    }
    
    // Generate S3 key
    const s3Key = generateS3Key(userId, filename);
    
    // Create Asset record in DB (PENDING status)
    const asset = await prisma.asset.create({
      data: {
        userId,
        projectId,
        filename,
        s3Key,
        mime,
        sizeBytes: size || 0,
        status: 'PENDING',
      },
    });
    
    // Generate presigned URL
    const uploadUrl = await generateSignedUploadUrl({
      s3Key,
      mime,
    });
    
    return NextResponse.json({
      assetId: asset.id,
      uploadUrl,
      s3Key,
      expiresIn: 600, // 10 minutes
    });
  } catch (error) {
    console.error('[Upload Sign] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
