import crypto from 'crypto';
import sharp from 'sharp';

export interface DuplicateInfo {
  isDuplicate: boolean;
  similarityScore: number;
  duplicateOf?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ImageFingerprint {
  perceptualHash: string;
  colorHash: string;
  dimensions: { width: number; height: number };
  fileSize: number;
  timestamp: number;
}

// Cache des empreintes d'images
const imageFingerprints = new Map<string, ImageFingerprint>();

export async function detectImageDuplicates(
  imageUrl: string,
  photoId: string
): Promise<DuplicateInfo> {
  try {
    // Générer l'empreinte de l'image
    const fingerprint = await generateImageFingerprint(imageUrl);
    
    // Chercher des doublons potentiels
    const duplicates = findPotentialDuplicates(fingerprint, photoId);
    
    if (duplicates.length === 0) {
      // Stocker l'empreinte pour les futures comparaisons
      imageFingerprints.set(photoId, fingerprint);
      return {
        isDuplicate: false,
        similarityScore: 0,
        confidence: 'low'
      };
    }

    // Trouver le meilleur match
    const bestMatch = duplicates[0];
    const similarityScore = calculateSimilarity(fingerprint, bestMatch.fingerprint);
    
    return {
      isDuplicate: similarityScore > 0.85, // Seuil de similarité
      similarityScore,
      duplicateOf: bestMatch.photoId,
      confidence: similarityScore > 0.95 ? 'high' : similarityScore > 0.85 ? 'medium' : 'low'
    };

  } catch (error) {
    console.error('Erreur lors de la détection de doublons:', error);
    return {
      isDuplicate: false,
      similarityScore: 0,
      confidence: 'low'
    };
  }
}

async function generateImageFingerprint(imageUrl: string): Promise<ImageFingerprint> {
  const imageBuffer = await loadImageBuffer(imageUrl);
  
  // Hash perceptuel (comparaison de structure)
  const perceptualHash = await generatePerceptualHash(imageBuffer);
  
  // Hash de couleur (comparaison de couleurs dominantes)
  const colorHash = await generateColorHash(imageBuffer);
  
  // Métadonnées de l'image
  const metadata = await sharp(imageBuffer).metadata();
  
  return {
    perceptualHash,
    colorHash,
    dimensions: {
      width: metadata.width || 0,
      height: metadata.height || 0
    },
    fileSize: imageBuffer.length,
    timestamp: Date.now()
  };
}

async function generatePerceptualHash(imageBuffer: Buffer): Promise<string> {
  // Redimensionner l'image à 8x8 pour le hash perceptuel
  const resized = await sharp(imageBuffer)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();
  
  // Calculer la moyenne des pixels
  let sum = 0;
  for (let i = 0; i < resized.length; i++) {
    sum += resized[i];
  }
  const average = sum / resized.length;
  
  // Générer le hash binaire
  let hash = '';
  for (let i = 0; i < resized.length; i++) {
    hash += resized[i] > average ? '1' : '0';
  }
  
  return hash;
}

async function generateColorHash(imageBuffer: Buffer): Promise<string> {
  // Extraire les couleurs dominantes
  const { data } = await sharp(imageBuffer)
    .resize(1, 1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Créer un hash basé sur les couleurs RGB
  const r = data[0];
  const g = data[1];
  const b = data[2];
  
  return crypto.createHash('md5')
    .update(`${r},${g},${b}`)
    .digest('hex')
    .substring(0, 16);
}

function findPotentialDuplicates(
  fingerprint: ImageFingerprint,
  currentPhotoId: string
): Array<{ photoId: string; fingerprint: ImageFingerprint }> {
  const candidates: Array<{ photoId: string; fingerprint: ImageFingerprint }> = [];
  
  for (const [photoId, storedFingerprint] of imageFingerprints.entries()) {
    if (photoId === currentPhotoId) continue;
    
    // Vérifier les dimensions similaires
    const dimensionMatch = Math.abs(fingerprint.dimensions.width - storedFingerprint.dimensions.width) < 50 &&
                          Math.abs(fingerprint.dimensions.height - storedFingerprint.dimensions.height) < 50;
    
    if (dimensionMatch) {
      candidates.push({ photoId, fingerprint: storedFingerprint });
    }
  }
  
  return candidates;
}

function calculateSimilarity(fingerprint1: ImageFingerprint, fingerprint2: ImageFingerprint): number {
  // Comparer les hashs perceptuels (distance de Hamming)
  const perceptualSimilarity = calculateHammingDistance(
    fingerprint1.perceptualHash,
    fingerprint2.perceptualHash
  );
  
  // Comparer les hashs de couleur
  const colorSimilarity = fingerprint1.colorHash === fingerprint2.colorHash ? 1 : 0;
  
  // Comparer les tailles de fichier
  const sizeSimilarity = 1 - Math.abs(fingerprint1.fileSize - fingerprint2.fileSize) / 
    Math.max(fingerprint1.fileSize, fingerprint2.fileSize);
  
  // Score composite (poids: 60% perceptuel, 30% couleur, 10% taille)
  return (perceptualSimilarity * 0.6) + (colorSimilarity * 0.3) + (sizeSimilarity * 0.1);
}

function calculateHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 0;
  
  let matches = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  
  return matches / hash1.length;
}

async function loadImageBuffer(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('data:')) {
    const base64Data = imageUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } else {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Fonction utilitaire pour nettoyer le cache
export function clearDuplicateCache(): void {
  imageFingerprints.clear();
}

// Fonction utilitaire pour obtenir les statistiques du cache
export function getDuplicateCacheStats(): { size: number; entries: string[] } {
  return {
    size: imageFingerprints.size,
    entries: Array.from(imageFingerprints.keys())
  };
}
