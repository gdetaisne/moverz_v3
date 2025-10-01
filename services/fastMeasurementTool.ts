// services/fastMeasurementTool.ts
// Outil de mesure rapide utilisant GPT-4o-mini avec prompts optimisés

import OpenAI from "openai";

export interface FastMeasurementResult {
  length: number;
  width: number;
  height: number;
  confidence: number;
  reasoning: string;
}

/**
 * Outil de mesure rapide utilisant GPT-4o-mini
 * Optimisé pour la vitesse (2-3 secondes max)
 */
export async function fastEstimateMeasurements(
  imageUrl: string,
  objectLabel: string,
  objectCategory: string
): Promise<FastMeasurementResult> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Prompt ultra-optimisé pour la vitesse
  const fastPrompt = `
Estime rapidement les dimensions de: ${objectLabel} (${objectCategory})

RÈGLES RAPIDES:
- Porte standard: 80cm large
- Chaise: 45cm large, 45cm profondeur, 85cm haut
- Table: 75cm haut
- Canapé: 90cm profondeur, 85cm haut
- Armoire: 60cm profondeur, 200cm haut

Réponds JSON uniquement:
{"length": 100, "width": 50, "height": 80, "confidence": 0.8, "reasoning": "Estimation basée sur références visuelles"}
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Plus rapide que gpt-4o
      temperature: 0.1,
      max_tokens: 150, // Limité pour la vitesse
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: fastPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low" // Résolution réduite pour la vitesse
              }
            }
          ]
        }
      ]
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    return {
      length: result.length || 50,
      width: result.width || 30,
      height: result.height || 40,
      confidence: result.confidence || 0.6,
      reasoning: result.reasoning || "Estimation rapide"
    };

  } catch (error) {
    console.error('Erreur mesure rapide:', error);
    
    // Fallback ultra-rapide
    return getQuickFallback(objectCategory);
  }
}

/**
 * Fallback ultra-rapide par catégorie
 */
function getQuickFallback(category: string): FastMeasurementResult {
  const quickDefaults: { [key: string]: FastMeasurementResult } = {
    'furniture': {
      length: 100,
      width: 50,
      height: 80,
      confidence: 0.5,
      reasoning: "Dimensions par défaut furniture"
    },
    'appliance': {
      length: 60,
      width: 40,
      height: 50,
      confidence: 0.5,
      reasoning: "Dimensions par défaut appliance"
    },
    'art': {
      length: 30,
      width: 20,
      height: 40,
      confidence: 0.5,
      reasoning: "Dimensions par défaut art"
    },
    'misc': {
      length: 25,
      width: 25,
      height: 25,
      confidence: 0.5,
      reasoning: "Dimensions par défaut misc"
    }
  };
  
  return quickDefaults[category] || quickDefaults['misc'];
}

/**
 * Validation rapide des mesures
 */
export function quickValidateMeasurements(
  measurements: FastMeasurementResult,
  objectLabel: string
): FastMeasurementResult {
  const { length, width, height, confidence, reasoning } = measurements;
  
  // Validation ultra-rapide
  const minDim = Math.min(length, width, height);
  const maxDim = Math.max(length, width, height);
  
  if (minDim < 5) {
    return {
      length: Math.max(length, 10),
      width: Math.max(width, 10),
      height: Math.max(height, 5),
      confidence: confidence * 0.8,
      reasoning: `${reasoning} (corrigé: trop petit)`
    };
  }
  
  if (maxDim > 300) {
    return {
      length: Math.min(length, 200),
      width: Math.min(width, 200),
      height: Math.min(height, 200),
      confidence: confidence * 0.8,
      reasoning: `${reasoning} (corrigé: trop grand)`
    };
  }
  
  return measurements;
}


