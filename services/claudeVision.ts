import { TPhotoAnalysis } from "@/lib/schemas";
import { getAISettings } from "@/lib/settings";
import { optimizeImageForAI } from "@/lib/imageOptimization";
import { mapToCatalog, volumeFromDims } from "@/lib/normalize";
import { calculatePackagedVolume } from "@/lib/packaging";
import { calculateDismountableProbability, requiresVisualCheck } from "@/lib/dismountable";

import { getEstimatedDimensions, hasValidDimensions, validateObjectDimensions, calculateVolumeFromDimensions } from './core/measurementUtils';
import { config, getApiConfig } from '../config/app';

export async function analyzePhotoWithClaude(opts: {
  photoId: string;
  imageUrl: string;
  systemPrompt?: string;
  userPrompt?: string;
}): Promise<TPhotoAnalysis> {
  const settings = getAISettings();
  
  // Utiliser les prompts spécialisés si fournis, sinon utiliser les prompts par défaut
  const systemPrompt = opts.systemPrompt || settings.systemPrompt;
  const userPrompt = opts.userPrompt || settings.userPrompt;
  const isClaudeApiKeyConfigured = !!config.claude.apiKey;

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
    const imageBuffer = await optimizeImageForAI(Buffer.from(opts.imageUrl.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')).then(result => result.buffer);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`Image Claude préparée: ${base64Image.length} bytes`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.claude.apiKey!,
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
                text: `${systemPrompt}\n\n${userPrompt}`
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
    
    // Traitement post-IA identique à OpenAI (forcer le calcul du volume)
    for (const it of analysis.items ?? []) {
      const cat = mapToCatalog(it.label);
      
    // Vérifier si les dimensions sont valides
    const dimensionsValid = hasValidDimensions(it.dimensions_cm);
      
      if (cat && !dimensionsValid) {
        it.dimensions_cm = {
          length: cat.length, width: cat.width, height: cat.height, source: "catalog"
        };
      } else if (!dimensionsValid && !cat) {
        // Fallback : dimensions estimées basées sur la catégorie
        const estimatedDims = getEstimatedDimensions(it.category || 'misc');
        it.dimensions_cm = {
          length: estimatedDims.length,
          width: estimatedDims.width, 
          height: estimatedDims.height,
          source: "estimated"
        };
      }
      if (!it.category && cat) it.category = cat.category;
      
      // TOUJOURS calculer le volume nous-mêmes à partir des dimensions (plus fiable)
      it.volume_m3 = cat?.volume_m3 ?? calculateVolumeFromDimensions(it.dimensions_cm);
      
      // Enrichir avec les propriétés du catalogue
      if (cat) {
        if (it.fragile === undefined) it.fragile = cat.fragile ?? false;
        if (it.stackable === undefined) it.stackable = cat.stackable ?? true;
      }
      // Valeurs par défaut
      if (it.fragile === undefined) it.fragile = false;
      if (it.stackable === undefined) it.stackable = true;
      
      // Calculer le volume emballé
      const packagingInfo = calculatePackagedVolume(
        it.volume_m3,
        it.fragile,
        it.category,
        it.dimensions_cm,
        it.dismountable
      );
      it.packaged_volume_m3 = packagingInfo.packagedVolumeM3;
      it.packaging_display = packagingInfo.displayValue;
      it.is_small_object = packagingInfo.isSmallObject;
      it.packaging_calculation_details = packagingInfo.calculationDetails;
      
      // Calculer la démontabilité (approche hybride)
      const dismountableResult = calculateDismountableProbability(
        it.label,
        it.dismountable,
        it.dismountable_confidence
      );
      it.dismountable = dismountableResult.isDismountable;
      it.dismountable_confidence = dismountableResult.confidence;
      it.dismountable_source = dismountableResult.source;
    }

    // Recalculer les totaux avec les volumes corrects
    const items = analysis.items ?? [];
    analysis.totals = {
      count_items: items.reduce((s:number,i:any)=> s + (i.quantity ?? 1), 0),
      volume_m3: Number(items.reduce((s:number,i:any)=> s + (i.volume_m3 ?? 0)*(i.quantity ?? 1), 0).toFixed(3)),
    };
    
    // Gérer les special_rules pour "autres objets"
    if (analysis.special_rules?.autres_objets?.present) {
      // Ajouter le volume des autres objets au total
      analysis.totals.volume_m3 = Number((analysis.totals.volume_m3 + (analysis.special_rules.autres_objets.volume_m3 || 0)).toFixed(3));
      analysis.totals.count_items += analysis.special_rules.autres_objets.listed_items?.length || 0;
    }
    
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

