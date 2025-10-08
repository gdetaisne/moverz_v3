import sharp from "sharp";
import crypto from "crypto";

export interface OptimizedImage {
  buffer: Buffer;
  hash: string;
  originalSize: number;
  optimizedSize: number;
}

export async function optimizeImageForAI(inputBuffer: Buffer): Promise<OptimizedImage> {
  const startTime = Date.now();
  const originalSize = inputBuffer.length;
  
  // Déterminer la taille optimale basée sur la taille originale - OPTIMISÉ MAXIMUM POUR CLAUDE
  let targetSize = 384; // Taille très réduite pour minimiser le transfert (était 512)
  if (originalSize > 5 * 1024 * 1024) { // > 5MB
    targetSize = 256; // Très petit pour les très grandes images
  } else if (originalSize > 2 * 1024 * 1024) { // > 2MB
    targetSize = 320; // Taille intermédiaire très réduite
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
      quality: 55, // Qualité très réduite pour minimiser le transfert (était 65)
      progressive: true,
      mozjpeg: true, // Compression optimisée
      optimizeScans: true, // Optimisation supplémentaire
      trellisQuantisation: true, // Compression avancée
      overshootDeringing: true // Réduction d'artefacts
    })
    .toBuffer();

  // Générer un hash pour le cache
  const hash = crypto.createHash('sha256').update(optimizedBuffer).digest('hex');
  
  const processingTime = Date.now() - startTime;
  console.log(`🖼️ [TIMING] Optimisation Sharp: ${processingTime}ms - ${originalSize}→${optimizedBuffer.length} bytes (${Math.round((1 - optimizedBuffer.length/originalSize) * 100)}% réduction)`);

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
