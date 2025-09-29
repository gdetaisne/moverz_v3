import { TPhotoAnalysis } from "@/lib/schemas";
import { getAISettings } from "@/lib/settings";
import { optimizeImageForAI } from "@/lib/imageOptimization";

export async function analyzePhotoWithClaude(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<TPhotoAnalysis> {
  const settings = getAISettings();
  const isClaudeApiKeyConfigured = !!process.env.CLAUDE_API_KEY;

  if (!isClaudeApiKeyConfigured) {
    console.warn('Aucune clé Claude configurée - using mock mode');
    return {
      version: "1.0.0" as const,
      items: [{ 
        label: "Table", 
        category: "furniture" as const,
        quantity: 1, 
        dimensions_cm: { length: 120, width: 80, height: 75, source: "estimated" as const }, 
        volume_m3: 0.72, 
        confidence: 0.8, 
        fragile: false,
        stackable: false,
        notes: "Table rectangulaire estimée" 
      }],
      special_rules: { autres_objets: { present: false, volume_m3: 0, listed_items: [] } },
      warnings: ["Mode mock - clé Claude non configurée"],
      errors: [],
      totals: { count_items: 1, volume_m3: 0.72 },
      photo_id: opts.photoId,
    };
  }

  try {
    // Préparer l'image pour Claude
    const imageBuffer = await prepareImageForClaude(opts.imageUrl);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`Image Claude préparée: ${base64Image.length} bytes`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        temperature: settings.temperature,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${settings.systemPrompt}\n\n${settings.userPrompt}`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Claude API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Réponse Claude reçue:', data);

    // Parser la réponse Claude
    const content = data.content[0]?.text;
    if (!content) {
      throw new Error('Aucune réponse de Claude');
    }

    // Parser le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse Claude invalide');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Valider et formater la réponse
    const formattedAnalysis: TPhotoAnalysis = {
      version: "1.0.0" as const,
      items: analysis.items || [],
      special_rules: analysis.special_rules || { autres_objets: { present: false, volume_m3: 0, listed_items: [] } },
      warnings: analysis.warnings || [],
      errors: analysis.errors || [],
      totals: analysis.totals || { count_items: 0, volume_m3: 0 },
      photo_id: opts.photoId,
    };

    console.log(`Analyse Claude terminée: ${formattedAnalysis.items.length} objets détectés`);
    return formattedAnalysis;

  } catch (error) {
    console.error('Erreur lors de l\'analyse Claude:', error);
    throw error;
  }
}

async function prepareImageForClaude(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('data:')) {
    // Image Base64
    const base64Data = imageUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } else {
    // URL d'image
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
