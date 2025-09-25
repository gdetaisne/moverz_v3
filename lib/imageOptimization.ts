import sharp from "sharp";
import crypto from "crypto";

export interface OptimizedImage {
  buffer: Buffer;
  hash: string;
  originalSize: number;
  optimizedSize: number;
}

export async function optimizeImageForAI(inputBuffer: Buffer): Promise<OptimizedImage> {
  const originalSize = inputBuffer.length;
  
  // Optimiser l'image pour l'IA : 1024x1024 max, qualité 85%
  // + Correction automatique de l'orientation EXIF
  const optimizedBuffer = await sharp(inputBuffer)
    .rotate() // Correction automatique de l'orientation selon EXIF
    .resize(1024, 1024, { 
      fit: 'inside', 
      withoutEnlargement: true,
      fastShrinkOnLoad: false // Meilleure qualité
    })
    .jpeg({ 
      quality: 85,
      progressive: true,
      mozjpeg: true // Compression optimisée
    })
    .toBuffer();

  // Générer un hash pour le cache
  const hash = crypto.createHash('sha256').update(optimizedBuffer).digest('hex');

  return {
    buffer: optimizedBuffer,
    hash,
    originalSize,
    optimizedSize: optimizedBuffer.length
  };
}

export function getImageHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
