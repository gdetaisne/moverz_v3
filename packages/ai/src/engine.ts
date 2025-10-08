// AI Engine - Façade unique pour tous les services IA
import { analyzePhotoWithClaude } from './adapters/claudeVision';
import { analyzePhotoWithOpenAI } from './adapters/openaiVision';
import { detectRoomType } from './adapters/roomDetection';
import { analyzeByRoom } from './adapters/roomBasedAnalysis';

export interface PhotoAnalysis {
  items: Array<{
    name: string;
    category: string;
    dismountable?: boolean;
    fragile?: boolean;
    selected?: boolean;
  }>;
  roomType?: string;
  confidence?: number;
}

export interface RoomAnalysis {
  roomType: string;
  items: Array<{
    name: string;
    category: string;
    dismountable?: boolean;
    fragile?: boolean;
    selected?: boolean;
  }>;
  confidence: number;
}

export interface AnalyzePhotoOptions {
  provider?: 'claude' | 'openai';
  roomType?: string;
  userId?: string;
}

/**
 * Analyser une photo et détecter les objets
 */
export async function analyzePhoto(
  imageBuffer: Buffer,
  options: AnalyzePhotoOptions = {}
): Promise<PhotoAnalysis> {
  const { provider = 'claude' } = options;
  
  try {
    if (provider === 'claude') {
      return await analyzePhotoWithClaude(imageBuffer, options);
    } else if (provider === 'openai') {
      return await analyzePhotoWithOpenAI(imageBuffer, options);
    } else {
      throw new Error(`Provider non supporté: ${provider}`);
    }
  } catch (error) {
    console.error('Erreur analyse photo:', error);
    throw error;
  }
}

/**
 * Détecter le type de pièce à partir d'une image
 */
export async function detectRoom(imageBuffer: Buffer): Promise<string> {
  try {
    return await detectRoomType(imageBuffer);
  } catch (error) {
    console.error('Erreur détection pièce:', error);
    throw error;
  }
}

/**
 * Analyser une pièce avec ses photos
 */
export async function analyzeByRoomType(
  roomType: string,
  photos: Array<{ buffer: Buffer; url: string }>
): Promise<RoomAnalysis> {
  try {
    return await analyzeByRoom(roomType, photos);
  } catch (error) {
    console.error('Erreur analyse par pièce:', error);
    throw error;
  }
}
