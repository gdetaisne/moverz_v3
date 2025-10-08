// S3 Client - Compatible MinIO with signed URLs
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Configuration from env
const S3_CONFIG = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET || 'moverz-uploads',
  accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || true,
};

// Validation configuration
const UPLOAD_CONFIG = {
  maxSizeMB: parseInt(process.env.UPLOAD_MAX_MB || '50'),
  allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  signedUrlTTL: parseInt(process.env.UPLOAD_SIGNED_URL_TTL || '600'), // 10 minutes
};

// S3 Client instance
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: S3_CONFIG.endpoint,
      region: S3_CONFIG.region,
      credentials: {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey,
      },
      forcePathStyle: S3_CONFIG.forcePathStyle,
    });
  }
  return s3Client;
}

/**
 * Validate upload request
 */
export function validateUpload(params: {
  filename: string;
  mime: string;
  size?: number;
}): { valid: boolean; error?: string } {
  // Check mime type
  if (!UPLOAD_CONFIG.allowedMimes.includes(params.mime)) {
    return {
      valid: false,
      error: `Type MIME non autorisé. Autorisés: ${UPLOAD_CONFIG.allowedMimes.join(', ')}`,
    };
  }

  // Check file size
  if (params.size && params.size > UPLOAD_CONFIG.maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `Taille maximale: ${UPLOAD_CONFIG.maxSizeMB} MB`,
    };
  }

  return { valid: true };
}

/**
 * Generate S3 key with pattern: userId/yyyy/mm/dd/<uuid>.<ext>
 */
export function generateS3Key(userId: string, filename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Extract extension
  const ext = filename.split('.').pop() || 'jpg';
  const uuid = randomUUID();
  
  return `${userId}/${year}/${month}/${day}/${uuid}.${ext}`;
}

/**
 * Generate presigned URL for direct S3 upload
 */
export async function generateSignedUploadUrl(params: {
  s3Key: string;
  mime: string;
  expiresIn?: number;
}): Promise<string> {
  const client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: params.s3Key,
    ContentType: params.mime,
  });
  
  const signedUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresIn || UPLOAD_CONFIG.signedUrlTTL,
  });
  
  return signedUrl;
}

/**
 * Get public URL for an S3 object
 */
export function getPublicUrl(s3Key: string): string {
  if (S3_CONFIG.forcePathStyle) {
    return `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${s3Key}`;
  }
  return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${s3Key}`;
}

/**
 * Get S3 configuration (for info/debugging)
 */
export function getS3Config() {
  return {
    endpoint: S3_CONFIG.endpoint,
    bucket: S3_CONFIG.bucket,
    region: S3_CONFIG.region,
    maxSizeMB: UPLOAD_CONFIG.maxSizeMB,
    allowedMimes: UPLOAD_CONFIG.allowedMimes,
    signedUrlTTL: UPLOAD_CONFIG.signedUrlTTL,
  };
}
