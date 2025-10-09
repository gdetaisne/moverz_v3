/**
 * Room Classifier - Façade unifiée avec A/B testing
 * LOT 18 - A/B Testing du classifieur de pièces
 * 
 * Cette façade route entre la variante A (baseline) et B (candidate)
 * selon la configuration du feature flag, et enregistre la télémétrie.
 */

import { chooseVariant, getAbTestConfig } from '@/lib/flags';
import { logger } from '@/lib/logger';
import { classifyRoomV2, ClassifyRoomInput, ClassifyRoomResult } from './roomClassifierV2';
import { classifyRoom as classifyRoomV1 } from '@ai/adapters/smartRoomClassificationService';
import { recordRoomClassifierMetric } from '@ai/metrics';

export interface ClassifyRoomContext {
  userId?: string;
  batchId?: string;
  photoId?: string;
  seed?: string; // Si fourni, utilisé pour chooseVariant, sinon dérivé des autres IDs
}

export interface ClassifyRoomResultWithVariant extends ClassifyRoomResult {
  variant: 'A' | 'B';
}

/**
 * Classifie une pièce avec routage A/B et télémétrie
 * 
 * Si le flag A/B est désactivé ou si une erreur survient en B, 
 * utilise automatiquement la variante A (baseline).
 * 
 * @param input - Image et indices optionnels
 * @param context - Contexte de l'appel (userId, batchId, photoId)
 * @returns Résultat de classification avec la variante utilisée
 */
export async function classifyRoom(
  input: ClassifyRoomInput,
  context?: ClassifyRoomContext
): Promise<ClassifyRoomResultWithVariant> {
  const startTime = Date.now();
  const abConfig = getAbTestConfig();
  
  // Déterminer le seed pour le choix de variante
  const seed = context?.seed 
    || context?.userId 
    || context?.batchId 
    || context?.photoId 
    || 'default';

  // Choisir la variante (toujours A si flag désactivé)
  let variant = chooseVariant(seed);
  let fallbackToA = false;
  let result: ClassifyRoomResult | undefined;
  let success = true;
  let errorCode: string | undefined;

  try {
    if (variant === 'B') {
      // Tenter la variante B (candidate)
      logger.debug(`[RoomClassifier] Utilisation variante B (seed: ${seed})`);
      
      try {
        result = await classifyRoomV2(input);
        logger.info(`[RoomClassifier] Variante B OK: ${result.roomType} (confidence: ${result.confidence})`);
      } catch (errorB) {
        // Erreur en B → fallback sur A
        logger.warn(`[RoomClassifier] Erreur variante B, fallback sur A:`, errorB);
        fallbackToA = true;
        variant = 'A';
        errorCode = errorB instanceof Error ? errorB.message : 'unknown_error';
        
        result = await classifyWithBaselineV1(input);
      }
    } else {
      // Variante A (baseline)
      logger.debug(`[RoomClassifier] Utilisation variante A (baseline, seed: ${seed})`);
      result = await classifyWithBaselineV1(input);
    }
  } catch (error) {
    // Erreur même en A
    logger.error(`[RoomClassifier] Erreur variante ${variant}:`, error);
    success = false;
    errorCode = error instanceof Error ? error.message : 'unknown_error';
    
    // Retourner un résultat par défaut
    result = {
      roomType: 'autre',
      confidence: 0.3,
      meta: {
        error: errorCode,
      },
    };
  } finally {
    // Enregistrer la métrique
    const latencyMs = Date.now() - startTime;
    
    if (result) {
      await recordRoomClassifierMetric({
        variant,
        success,
        latencyMs,
        roomType: result.roomType,
        confidence: result.confidence,
        userId: context?.userId,
        batchId: context?.batchId,
        photoId: context?.photoId,
        fallback: fallbackToA,
        errorCode,
      }).catch(err => {
        // Ne pas bloquer sur une erreur de métrique
        logger.warn('[RoomClassifier] Erreur enregistrement métrique:', err);
      });

      logger.debug(`[RoomClassifier] Classification terminée: variant=${variant}, roomType=${result.roomType}, latency=${latencyMs}ms, fallback=${fallbackToA}`);
    }
  }

  // S'assurer que result est défini
  if (!result) {
    result = {
      roomType: 'autre',
      confidence: 0.3,
      meta: { error: 'No result returned' },
    };
  }

  return {
    ...result,
    variant,
  };
}

/**
 * Appelle la variante A (baseline/V1)
 * 
 * Note: classifyRoomV1 retourne juste un string (roomType).
 * On l'enveloppe dans le format ClassifyRoomResult.
 */
async function classifyWithBaselineV1(input: ClassifyRoomInput): Promise<ClassifyRoomResult> {
  // La V1 attend un Buffer, essayons de le fournir
  let buffer: Buffer;
  
  if (input.buffer) {
    buffer = input.buffer;
  } else if (input.imageUrl) {
    const base64Data = input.imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    throw new Error('imageUrl ou buffer requis pour baseline V1');
  }

  const roomType = await classifyRoomV1(buffer);
  
  return {
    roomType,
    confidence: 0.8, // Confidence par défaut pour V1
    meta: {
      provider: 'mock',
      model: 'baseline-v1',
    },
  };
}

/**
 * Export pour compatibilité avec l'existant
 */
export type { ClassifyRoomInput, ClassifyRoomResult } from './roomClassifierV2';

