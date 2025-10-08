import { TPhotoAnalysis } from "@/lib/schemas";
import { optimizeImageForAI } from "@/lib/imageOptimization";
import { normalizeRoomType } from "@/lib/roomTypeNormalizer";

export interface RoomDetectionResult {
  roomType: string;
  confidence: number;
  reasoning: string;
}

/**
 * Détecte le type de pièce à partir d'une image
 */
export async function detectRoomType(photoAnalysis: TPhotoAnalysis, imageUrl?: string): Promise<RoomDetectionResult> {
  try {
    // Utiliser Claude pour la détection de pièce (plus rapide)
    const isClaudeConfigured = !!process.env.CLAUDE_API_KEY;
    
    if (isClaudeConfigured) {
      return await detectRoomTypeWithClaude(photoAnalysis, imageUrl);
    } else {
      return await detectRoomTypeWithOpenAI(photoAnalysis);
    }
  } catch (error) {
    console.warn('Erreur lors de la détection de pièce:', error);
    return {
      roomType: 'pièce inconnue',
      confidence: 0.1,
      reasoning: 'Erreur de détection'
    };
  }
}

async function detectRoomTypeWithClaude(photoAnalysis: TPhotoAnalysis, imageUrl?: string): Promise<RoomDetectionResult> {
  const anthropic = new (await import("@anthropic-ai/sdk")).default({ 
    apiKey: process.env.CLAUDE_API_KEY 
  });

  // Si on a l'URL de l'image, l'analyser directement
  if (imageUrl) {
    console.log('🔍 Analyse de l\'image pour détection de pièce...');
    return await detectRoomTypeFromImage(anthropic, imageUrl);
  }

  // Sinon, analyser les objets détectés (fallback)
  console.log('⚠️ Fallback: analyse basée sur les objets détectés');
  
  // Vérification de sécurité pour photoAnalysis.items
  if (!photoAnalysis.items || !Array.isArray(photoAnalysis.items) || photoAnalysis.items.length === 0) {
    console.log('⚠️ Aucun objet détecté, retour type par défaut');
    return {
      roomType: 'pièce inconnue',
      confidence: 0.1,
      reasoning: 'Aucun objet détecté pour classification'
    };
  }
  
  const prompt = `Analyse cette liste d'objets détectés dans une photo et détermine le type de pièce.

Objets détectés:
${photoAnalysis.items.map(item => `- ${item.label} (${item.category})`).join('\n')}

Types de pièces possibles:
- jardin (herbe, mobilier extérieur, plantes, barbecue, terrasse, patio)
- salon (canapés, tables basses, TV, fauteuils, lampes, intérieur)
- cuisine (électroménagers, plan de travail, vaisselle, réfrigérateur)
- chambre (lit, commode, armoire, table de chevet)
- salle de bain (baignoire, douche, lavabo, miroir)
- bureau (bureau, chaise, ordinateur, étagères, intérieur)
- garage (outils, voiture, rangement)
- couloir (miroir, console, éclairage)
- salle à manger (table à manger, chaises, buffet, intérieur)
- dressing (armoires, commodes, miroirs)

RÈGLES IMPORTANTES:
- Si tu vois de l'herbe, du gazon, des plantes extérieures → JARDIN
- Si tu vois une table à manger avec chaises → SALLE À MANGER
- Si tu vois du mobilier extérieur → JARDIN
- Si tu vois un bureau avec ordinateur → BUREAU
- Si tu vois un canapé et TV → SALON

Réponds UNIQUEMENT avec un JSON:
{
  "roomType": "type_de_piece",
  "confidence": 0.95,
  "reasoning": "explication basée sur les objets détectés"
}`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 200,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0]);
    // Normaliser le type de pièce détecté
    result.roomType = normalizeRoomType(result.roomType);
    return result;
  }
  
  throw new Error('Réponse Claude invalide pour la détection de pièce');
}

async function detectRoomTypeFromImage(anthropic: any, imageUrl: string): Promise<RoomDetectionResult> {
  // Préparer l'image pour Claude
  const imageBuffer = await optimizeImageForAI(Buffer.from(imageUrl.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')).then(result => result.buffer);
  const base64Image = imageBuffer.toString('base64');

  const prompt = `Analyse cette image et détermine le type de pièce visible.

Types de pièces possibles:
- jardin (herbe, gazon, plantes extérieures, mobilier extérieur, terrasse, patio, barbecue)
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
- Si tu vois de l'herbe, du gazon, des plantes extérieures → JARDIN
- Si tu vois une table à manger avec chaises → SALLE À MANGER
- Si tu vois du mobilier extérieur (fauteuils de jardin, tables de jardin) → JARDIN
- Si tu vois un bureau avec ordinateur → BUREAU
- Si tu vois un canapé et TV → SALON
- Regarde l'environnement global, pas seulement les objets

Réponds UNIQUEMENT avec un JSON:
{
  "roomType": "type_de_piece",
  "confidence": 0.95,
  "reasoning": "explication basée sur l'analyse visuelle de l'image"
}`;

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
    // Normaliser le type de pièce détecté
    result.roomType = normalizeRoomType(result.roomType);
    return result;
  }
  
  throw new Error('Réponse Claude invalide pour la détection de pièce');
}


async function detectRoomTypeWithOpenAI(photoAnalysis: TPhotoAnalysis): Promise<RoomDetectionResult> {
  const OpenAI = (await import("openai")).default;
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `Analyse cette liste d'objets détectés dans une photo et détermine le type de pièce.

Objets détectés:
${photoAnalysis.items.map(item => `- ${item.label} (${item.category})`).join('\n')}

Types de pièces possibles:
- salon (canapés, tables basses, TV, fauteuils, lampes)
- cuisine (électroménagers, plan de travail, vaisselle, réfrigérateur)
- chambre (lit, commode, armoire, table de chevet)
- salle de bain (baignoire, douche, lavabo, miroir)
- bureau (bureau, chaise, ordinateur, étagères)
- jardin (mobilier extérieur, plantes, barbecue)
- garage (outils, voiture, rangement)
- couloir (miroir, console, éclairage)
- salle à manger (table à manger, chaises, buffet)
- dressing (armoires, commodes, miroirs)

Réponds UNIQUEMENT avec un JSON:
{
  "roomType": "type_de_piece",
  "confidence": 0.95,
  "reasoning": "explication basée sur les objets détectés"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 200
  });

  const content = response.choices[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Réponse OpenAI invalide pour la détection de pièce');
}

/**
 * Groupe les photos par type de pièce et numérote les pièces du même type
 */
export function groupPhotosByRoomType(photosWithRoomTypes: Array<{
  photoAnalysis: TPhotoAnalysis;
  roomDetection: RoomDetectionResult;
}>): Record<string, TPhotoAnalysis[]> {
  const roomGroups: Record<string, TPhotoAnalysis[]> = {};
  const roomTypeCounters: Record<string, number> = {};

  photosWithRoomTypes.forEach(({ photoAnalysis, roomDetection }) => {
    const roomType = roomDetection.roomType.toLowerCase();
    
    // Incrémenter le compteur pour ce type de pièce
    if (!roomTypeCounters[roomType]) {
      roomTypeCounters[roomType] = 0;
    }
    roomTypeCounters[roomType]++;

    // Créer le nom de la pièce avec numérotation
    const roomName = roomTypeCounters[roomType] === 1 
      ? capitalizeFirstLetter(roomType)
      : `${capitalizeFirstLetter(roomType)} ${roomTypeCounters[roomType]}`;

    // Ajouter la photo au groupe
    if (!roomGroups[roomName]) {
      roomGroups[roomName] = [];
    }
    roomGroups[roomName].push(photoAnalysis);
  });

  return roomGroups;
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
