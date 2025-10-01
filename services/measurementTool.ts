// services/measurementTool.ts
// Outil spécialisé pour l'estimation précise des mesures d'objets volumineux

import OpenAI from "openai";
import { getAISettings } from '@/lib/settings';

export interface MeasurementToolResult {
  length: number;
  width: number;
  height: number;
  confidence: number;
  reasoning: string;
  referenceObjects: string[];
}

/**
 * Outil spécialisé pour l'estimation précise des mesures
 * Utilise les capacités avancées de GPT-4o avec des prompts spécialisés
 */
export async function estimateObjectMeasurements(
  imageUrl: string,
  objectLabel: string,
  objectCategory: string,
  contextDescription?: string
): Promise<MeasurementToolResult> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const measurementPrompt = `
Tu es un expert en estimation de dimensions d'objets pour déménagement. 
Analyse cette image et estime les dimensions précises de l'objet identifié.

OBJET À MESURER: ${objectLabel} (${objectCategory})
CONTEXTE: ${contextDescription || 'Aucun contexte spécifique'}

TECHNIQUES D'ESTIMATION PRÉCISES:
1. **RÉFÉRENCES VISUELLES**: Utilise les éléments de la pièce comme références:
   - Portes standard: ~80cm de large
   - Prises électriques: ~15cm du sol
   - Carrelage: souvent 30x30cm ou 40x40cm
   - Plinthes: ~10-15cm de haut
   - Poignées de porte: ~10cm de haut

2. **PROPORTIONS RELATIVES**: Compare avec des objets de taille connue dans l'image

3. **PERSPECTIVE**: Prends en compte l'angle de vue et la déformation perspective

4. **DÉTAILS STRUCTURELS**: Observe les détails (poignées, étagères, pieds) pour estimer la taille

5. **RÈGLES DE BON SENS**: 
   - Une chaise: ~40-50cm de large, ~45-50cm de profondeur, ~80-90cm de haut
   - Une table: hauteur standard ~75cm
   - Un canapé: profondeur ~80-100cm, hauteur ~80-90cm
   - Une armoire: profondeur ~60cm, hauteur ~200-220cm

Réponds au format JSON strict:
{
  "length": number,        // en cm
  "width": number,         // en cm  
  "height": number,        // en cm
  "confidence": number,    // 0-1 (0.9+ pour très confiant)
  "reasoning": "string",   // Explication de l'estimation
  "referenceObjects": ["string"] // Objets utilisés comme références
}
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1, // Très conservateur pour les mesures
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: measurementPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high" // Haute résolution pour les mesures précises
              }
            }
          ]
        }
      ]
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    return {
      length: result.length || 0,
      width: result.width || 0,
      height: result.height || 0,
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || "Estimation basique",
      referenceObjects: result.referenceObjects || []
    };

  } catch (error) {
    console.error('Erreur lors de l\'estimation des mesures:', error);
    
    // Fallback vers des dimensions par défaut
    const defaultDimensions = getDefaultDimensions(objectCategory);
    return {
      ...defaultDimensions,
      confidence: 0.3,
      reasoning: "Estimation par défaut (erreur API)",
      referenceObjects: []
    };
  }
}

/**
 * Dimensions par défaut par catégorie (fallback)
 */
function getDefaultDimensions(category: string): Omit<MeasurementToolResult, 'confidence' | 'reasoning' | 'referenceObjects'> {
  const defaults: { [key: string]: { length: number; width: number; height: number } } = {
    'furniture': { length: 100, width: 50, height: 80 },
    'appliance': { length: 60, width: 40, height: 50 },
    'art': { length: 30, width: 20, height: 40 },
    'box': { length: 40, width: 30, height: 30 },
    'misc': { length: 25, width: 25, height: 25 }
  };
  
  return defaults[category] || defaults['misc'];
}

/**
 * Valide et corrige les mesures estimées
 */
export function validateMeasurements(
  measurements: MeasurementToolResult,
  objectLabel: string,
  category: string
): MeasurementToolResult {
  const { length, width, height, confidence, reasoning, referenceObjects } = measurements;
  
  // Vérifications de cohérence
  const minDimension = Math.min(length, width, height);
  const maxDimension = Math.max(length, width, height);
  
  // Si les mesures semblent incohérentes, les corriger
  if (minDimension < 5) {
    return {
      length: Math.max(length, 10),
      width: Math.max(width, 10),
      height: Math.max(height, 5),
      confidence: Math.max(confidence * 0.8, 0.3),
      reasoning: `${reasoning} (dimensions corrigées - trop petites)`,
      referenceObjects
    };
  }
  
  if (maxDimension > 500) {
    return {
      length: Math.min(length, 300),
      width: Math.min(width, 300),
      height: Math.min(height, 300),
      confidence: Math.max(confidence * 0.8, 0.3),
      reasoning: `${reasoning} (dimensions corrigées - trop grandes)`,
      referenceObjects
    };
  }
  
  return measurements;
}


