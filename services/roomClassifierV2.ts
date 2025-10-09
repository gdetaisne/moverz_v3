/**
 * Room Classifier V2 - Candidate implementation
 * LOT 18 - A/B Testing du classifieur de pièces
 * 
 * Cette implémentation utilise Claude ou OpenAI pour classifier une pièce
 * à partir d'une image. C'est la variante "B" dans l'A/B test.
 */

import { getAISettings } from '@/lib/settings';
import { optimizeImageForAI } from '@/lib/imageOptimization';
import { normalizeRoomType } from '@/lib/roomTypeNormalizer';
import { logger } from '@/lib/logger';
import { config } from '../config/app';
import OpenAI from 'openai';

export interface ClassifyRoomInput {
  imageUrl?: string;  // Base64 data URL ou URL externe
  buffer?: Buffer;    // Buffer d'image
  hints?: string[];   // Indices optionnels (ex: ["bedroom", "living room"])
}

export interface ClassifyRoomResult {
  roomType: string;      // Type normalisé
  confidence: number;    // 0-1
  meta?: {
    rawResponse?: string;
    provider?: 'claude' | 'openai' | 'mock';
    model?: string;
    error?: string;      // Message d'erreur si applicable
  };
}

/**
 * Prompt système pour la classification de pièce
 */
const CLASSIFICATION_SYSTEM_PROMPT = `Tu es un expert en classification de pièces pour inventaire de déménagement.

Analyse l'image et détermine le type de pièce parmi :
- salon (living room, séjour)
- chambre (bedroom)
- cuisine (kitchen)
- salle_de_bain (bathroom)
- bureau (office, study)
- salle_a_manger (dining room)
- entree (entrance, hall)
- couloir (corridor)
- wc (toilet)
- cave (cellar, basement storage)
- grenier (attic)
- garage
- buanderie (laundry room)
- dressing (walk-in closet)
- veranda (conservatory, sunroom)
- terrasse (terrace, patio)
- balcon (balcony)
- jardin (garden)
- autre (other)

RÈGLES:
- Base ta classification sur les meubles, équipements et agencement visibles
- Si incertain, utilise "autre"
- Retourne UNIQUEMENT un JSON avec: { "roomType": "...", "confidence": 0.X }`;

/**
 * Classifie une pièce à partir d'une image (variante V2)
 * 
 * @param input - Image et indices optionnels
 * @returns Type de pièce normalisé et confidence
 */
export async function classifyRoomV2(input: ClassifyRoomInput): Promise<ClassifyRoomResult> {
  try {
    // Préparer l'image
    let imageBuffer: Buffer;
    
    if (input.buffer) {
      imageBuffer = input.buffer;
    } else if (input.imageUrl) {
      // Convertir data URL en buffer
      const base64Data = input.imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('imageUrl ou buffer requis');
    }

    // Optimiser l'image
    const optimized = await optimizeImageForAI(imageBuffer);
    const base64Image = optimized.buffer.toString('base64');

    // Construire le prompt utilisateur avec hints si fournis
    let userPrompt = 'Classifie cette pièce.';
    if (input.hints && input.hints.length > 0) {
      userPrompt += ` Indices possibles: ${input.hints.join(', ')}.`;
    }

    // Tenter Claude en priorité
    const isClaudeConfigured = !!config.claude?.apiKey;
    
    if (isClaudeConfigured) {
      logger.debug('[ClassifierV2] Utilisation de Claude');
      const result = await classifyWithClaude(base64Image, userPrompt);
      return result;
    }

    // Fallback sur OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      logger.debug('[ClassifierV2] Utilisation d\'OpenAI');
      const result = await classifyWithOpenAI(base64Image, userPrompt, openaiKey);
      return result;
    }

    // Mode mock si aucune clé configurée
    logger.warn('[ClassifierV2] Aucune clé IA configurée, mode mock');
    return {
      roomType: 'salon',
      confidence: 0.5,
      meta: {
        provider: 'mock',
        rawResponse: 'Mock response - no AI key configured',
      },
    };
  } catch (error) {
    logger.error('[ClassifierV2] Erreur classification:', error);
    throw error;
  }
}

/**
 * Classification avec Claude
 */
async function classifyWithClaude(
  base64Image: string,
  userPrompt: string
): Promise<ClassifyRoomResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.claude.apiKey!,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${CLASSIFICATION_SYSTEM_PROMPT}\n\n${userPrompt}` },
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
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Claude API: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;

  if (!content) {
    throw new Error('Réponse Claude vide');
  }

  // Parser le JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Format JSON invalide dans la réponse Claude');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    roomType: normalizeRoomType(parsed.roomType || 'autre'),
    confidence: parsed.confidence || 0.7,
    meta: {
      provider: 'claude',
      model: 'claude-3-5-haiku-20241022',
      rawResponse: content,
    },
  };
}

/**
 * Classification avec OpenAI
 */
async function classifyWithOpenAI(
  base64Image: string,
  userPrompt: string,
  apiKey: string
): Promise<ClassifyRoomResult> {
  const client = new OpenAI({ apiKey });
  const settings = getAISettings();

  const completion = await client.chat.completions.create({
    model: settings.model,
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw);

  return {
    roomType: normalizeRoomType(parsed.roomType || 'autre'),
    confidence: parsed.confidence || 0.7,
    meta: {
      provider: 'openai',
      model: settings.model,
      rawResponse: raw,
    },
  };
}

