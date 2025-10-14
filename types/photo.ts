/**
 * Types cohérents pour la gestion des photos
 * Alignement parfait avec la base de données PostgreSQL
 */

// Statuts de la base de données (PostgreSQL)
export type PhotoStatusDB = 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';

// Statuts de l'application (alignés avec la DB)
export type PhotoStatus = PhotoStatusDB;

// Interface photo côté client (alignée avec la DB)
export interface PhotoClient {
  id: string;
  photoId: string;
  file: File | null;
  fileUrl: string;
  analysis: any;
  status: PhotoStatus; // ✅ Utilise les vrais statuts DB
  error?: string;
  selectedItems: Set<number>;
  progress: number;
  roomName?: string;
  roomConfidence?: number;
  roomType?: string;
  userId: string;
}

// Interface photo côté base de données
export interface PhotoDB {
  id: string;
  projectId: string;
  batchId?: string;
  filename: string;
  filePath: string;
  url: string;
  roomType?: string;
  analysis?: any;
  status: PhotoStatus;
  errorCode?: string;
  errorMessage?: string;
  processedAt?: Date;
  checksum?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fonction de mapping sécurisée DB → Client
 */
export function mapPhotoDBToClient(photoDB: PhotoDB, userId: string): PhotoClient {
  // Si la photo a un roomType, elle est considérée comme analysée pour la détection de pièce
  const effectiveStatus = photoDB.roomType ? 'DONE' : photoDB.status;
  
  return {
    id: photoDB.id,
    photoId: photoDB.id,
    file: null, // Les photos de la DB n'ont pas de File object
    fileUrl: photoDB.url,
    analysis: photoDB.analysis,
    status: effectiveStatus, // ✅ Considère DONE si roomType présent
    error: photoDB.errorMessage,
    selectedItems: new Set<number>(),
    progress: effectiveStatus === 'DONE' ? 100 : 
              effectiveStatus === 'PROCESSING' ? 50 : 
              effectiveStatus === 'ERROR' ? 0 : 25,
    roomName: photoDB.roomType,
    roomConfidence: 0.9, // Valeur par défaut
    roomType: photoDB.roomType,
    userId: userId
  };
}

/**
 * Fonction de mapping sécurisée Client → DB (pour les updates)
 */
export function mapPhotoClientToDB(photoClient: PhotoClient): Partial<PhotoDB> {
  return {
    id: photoClient.id,
    url: photoClient.fileUrl,
    roomType: photoClient.roomType,
    analysis: photoClient.analysis,
    status: photoClient.status,
    errorMessage: photoClient.error,
    processedAt: photoClient.status === 'DONE' ? new Date() : undefined
  };
}
