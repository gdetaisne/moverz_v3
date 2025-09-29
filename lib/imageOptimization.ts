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
  
  // Déterminer la taille optimale basée sur la taille originale
  let targetSize = 1024; // Taille par défaut maintenue pour la qualité
  if (originalSize > 5 * 1024 * 1024) { // > 5MB
    targetSize = 768; // Plus petit pour les très grandes images
  } else if (originalSize > 2 * 1024 * 1024) { // > 2MB
    targetSize = 896; // Taille intermédiaire
  }
  
  // Optimiser l'image pour l'IA : taille adaptative, qualité 80%
  // + Correction automatique de l'orientation EXIF
  const optimizedBuffer = await sharp(inputBuffer)
    .rotate() // Correction automatique de l'orientation selon EXIF
    .resize(targetSize, targetSize, { 
      fit: 'inside', 
      withoutEnlargement: true,
      fastShrinkOnLoad: true // Plus rapide pour les grandes images
    })
    .jpeg({ 
      quality: 85, // Qualité maintenue pour la précision
      progressive: true,
      mozjpeg: true, // Compression optimisée
      optimizeScans: true // Optimisation supplémentaire
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
