/**
 * Transformations unifiées et mémorisées pour les photos
 * Évite les recréations d'objets et les re-renders
 */

import { PhotoClient, PhotoStatus, mapPhotoDBToClient } from '@/types/photo';

// Cache pour les transformations coûteuses
const transformCache = new Map<string, PhotoClient>();
const blobUrlCache = new Map<string, string>();

// Cache pour les URLs blob

/**
 * Génère une clé de cache unique pour une photo
 */
function getPhotoCacheKey(photo: any): string {
  if (photo.id) return photo.id;
  if (photo.photoId) return photo.photoId;
  if (photo.file) return `file-${photo.file.name}-${photo.file.size}`;
  return `unknown-${Math.random()}`;
}

/**
 * Gère les URLs blob de manière stable
 */
export function getStableBlobUrl(file: File | null): string | null {
  if (!file) return null;
  
  const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
  
  if (blobUrlCache.has(cacheKey)) {
    return blobUrlCache.get(cacheKey)!;
  }
  const blobUrl = URL.createObjectURL(file);
  blobUrlCache.set(cacheKey, blobUrl);
  
  // Nettoyer le cache après 5 minutes
  setTimeout(() => {
    if (blobUrlCache.has(cacheKey)) {
      URL.revokeObjectURL(blobUrl);
      blobUrlCache.delete(cacheKey);
    }
  }, 5 * 60 * 1000);
  
  return blobUrl;
}

/**
 * Transformation unifiée et mémorisée des photos
 */
export function transformPhoto(photo: any, userId: string): PhotoClient {
  const cacheKey = getPhotoCacheKey(photo);
  
  // Vérifier le cache
  if (transformCache.has(cacheKey)) {
    return transformCache.get(cacheKey)!;
  }
  
  let transformed: PhotoClient;
  
  // Si c'est une photo de la DB, utiliser le mapping standard
  if (photo.id && !photo.file) {
    transformed = mapPhotoDBToClient(photo, userId);
  } else {
    // Si c'est une photo uploadée, créer l'objet PhotoClient
    transformed = {
      id: photo.id || photo.photoId || `temp-${Date.now()}`,
      photoId: photo.photoId || photo.id || `temp-${Date.now()}`,
      file: photo.file || null,
      fileUrl: photo.file ? getStableBlobUrl(photo.file) : photo.fileUrl || photo.url || '',
      analysis: photo.analysis || null,
      status: (photo.status || 'PENDING') as PhotoStatus,
      error: photo.error || undefined,
      selectedItems: new Set<number>(), // Toujours nouveau Set, mais mémorisé
      progress: photo.progress || 0,
      roomName: photo.roomName || photo.roomType || undefined,
      roomConfidence: photo.roomConfidence || 0.9,
      roomType: photo.roomType || undefined,
      userId: userId
    };
  }
  
  // Mettre en cache
  transformCache.set(cacheKey, transformed);
  
  return transformed;
}

/**
 * Transformation d'un tableau de photos
 */
export function transformPhotos(photos: any[], userId: string): PhotoClient[] {
  return photos.map(photo => transformPhoto(photo, userId));
}

/**
 * Nettoyer le cache (à appeler périodiquement)
 */
export function clearTransformCache(): void {
  // Libérer les URLs blob
  blobUrlCache.forEach(url => URL.revokeObjectURL(url));
  
  // Vider les caches
  transformCache.clear();
  blobUrlCache.clear();
}

/**
 * Créer des roomGroups stables
 */
export function createStableRoomGroups(photos: PhotoClient[]): any[] {
  const groupsMap = new Map<string, any>();
  
  photos.forEach(photo => {
    const roomType = photo.roomType || photo.roomName || 'unknown';
    
    if (!groupsMap.has(roomType)) {
      groupsMap.set(roomType, {
        id: `room-${roomType}`,
        roomType,
        photos: [],
        lastModified: new Date()
      });
    }
    
    groupsMap.get(roomType)!.photos.push(photo);
  });
  
  return Array.from(groupsMap.values());
}
