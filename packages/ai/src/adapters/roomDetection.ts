/**
 * Room detection adapter
 * LOT 18 - Intégration avec le système d'A/B testing
 * 
 * Cette fonction wrape la façade roomClassifier pour maintenir
 * la compatibilité avec l'interface existante.
 */

export async function detectRoomType(imageBuffer: Buffer, context?: { userId?: string; batchId?: string; photoId?: string }): Promise<string> {
  try {
    // Import dynamique pour éviter les problèmes de path
    const { classifyRoom } = await import('../../../../services/roomClassifier');
    
    // Appeler la façade avec A/B testing
    const result = await classifyRoom(
      { buffer: imageBuffer },
      context
    );
    
    return result.roomType;
  } catch (error) {
    console.error('[Room Detection Adapter] Erreur:', error);
    // Fallback sur 'autre' en cas d'erreur
    return 'autre';
  }
}