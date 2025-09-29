import { optimizeImageForAI } from '@/lib/imageOptimization';

export interface RoomDetectionResult {
  roomType: string;
  confidence: number;
  reasoning: string;
  processingTime: number;
}

/**
 * Détection de pièce parallèle - spécialisée uniquement pour identifier le type de pièce
 * Fonctionne indépendamment de l'analyse d'objets
 */
export async function detectRoomTypeParallel(imageUrl: string): Promise<RoomDetectionResult> {
  const startTime = Date.now();
  
  try {
    // Vérifier si Claude est configuré
    const isClaudeConfigured = !!process.env.CLAUDE_API_KEY;
    
    if (!isClaudeConfigured) {
      console.warn('Claude non configuré - détection de pièce en mode mock');
      return {
        roomType: 'pièce inconnue',
        confidence: 0.1,
        reasoning: 'Claude non configuré',
        processingTime: Date.now() - startTime
      };
    }

    // Préparer l'image pour Claude
    const imageBuffer = await prepareImageForClaude(imageUrl);
    const base64Image = imageBuffer.toString('base64');

    // Prompt spécialisé pour la détection de pièce uniquement
    const prompt = `Analyse cette image et détermine le type de pièce visible.

IMPORTANT: Distingue clairement l'INTÉRIEUR de l'EXTÉRIEUR.

Types de pièces possibles:
- jardin (UNIQUEMENT si c'est vraiment extérieur: herbe au sol, ciel visible, mobilier extérieur, terrasse, patio)
- salon (canapés, tables basses, TV, fauteuils, lampes, intérieur)
- cuisine (électroménagers, plan de travail, vaisselle, réfrigérateur, intérieur)
- chambre (lit, commode, armoire, table de chevet, intérieur)
- salle de bain (baignoire, douche, lavabo, miroir, intérieur)
- bureau (bureau, chaise, ordinateur, étagères, intérieur)
- garage (outils, voiture, rangement, intérieur)
- couloir (miroir, console, éclairage, intérieur)
- salle à manger (table à manger, chaises, buffet, intérieur)
- dressing (armoires, commodes, miroirs, intérieur)

RÈGLES CRITIQUES:
- JARDIN UNIQUEMENT si: herbe au sol + ciel visible + mobilier extérieur + pas de murs intérieurs
- Si tu vois des murs, plafond, sol intérieur → C'est une pièce INTÉRIEURE, pas un jardin
- Si tu vois une table à manger avec chaises + intérieur → SALLE À MANGER
- Si tu vois un canapé et TV + intérieur → SALON
- Si tu vois un lit + intérieur → CHAMBRE
- Si tu vois des électroménagers + intérieur → CUISINE
- Regarde l'environnement global: murs, plafond, sol, éclairage intérieur

Réponds UNIQUEMENT avec un JSON:
{
  "roomType": "type_de_piece",
  "confidence": 0.95,
  "reasoning": "explication basée sur l'analyse visuelle de l'image"
}`;

    const anthropic = new (await import("@anthropic-ai/sdk")).default({ 
      apiKey: process.env.CLAUDE_API_KEY 
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ]
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        ...result,
        processingTime: Date.now() - startTime
      };
    }
    
    throw new Error('Réponse Claude invalide pour la détection de pièce');

  } catch (error) {
    console.warn('Erreur lors de la détection de pièce parallèle:', error);
    return {
      roomType: 'pièce inconnue',
      confidence: 0.1,
      reasoning: 'Erreur de détection',
      processingTime: Date.now() - startTime
    };
  }
}

async function prepareImageForClaude(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('data:')) {
    const base64Data = imageUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }
  throw new Error("Unsupported image URL type for Claude preparation.");
}

/**
 * Détection de pièce en mode fallback (sans Claude)
 */
export async function detectRoomTypeFallback(imageUrl: string): Promise<RoomDetectionResult> {
  const startTime = Date.now();
  
  // Analyse basique basée sur l'URL ou des heuristiques
  // Pour l'instant, retourner une détection par défaut
  return {
    roomType: 'pièce inconnue',
    confidence: 0.1,
    reasoning: 'Mode fallback - détection basique',
    processingTime: Date.now() - startTime
  };
}
