import { TPhotoAnalysis } from '@/lib/schemas';
import { analyzePhotoWithClaude } from './claudeVision';
import { originalAnalyzePhotoWithVision } from './openaiVision';
import { SPECIALIZED_AI_SETTINGS } from '@/lib/specializedPrompts';
import { calculatePackagedVolume } from '@/lib/packaging';
import { calculateDismountableProbability } from '@/lib/dismountable';
import { mapToCatalog, volumeFromDims } from '@/lib/normalize';

export interface PetitsAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid';
  analysisType: 'petits';
}

/**
 * Analyse hybride spécialisée pour les PETITS OBJETS (<50cm)
 * Utilise Claude + OpenAI en parallèle avec des prompts spécialisés
 */
export async function analyzePetitsHybrid(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<PetitsAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Vérifier si Claude est configuré
    const isClaudeConfigured = !!process.env.CLAUDE_API_KEY;
    
    // Lancer les deux analyses en parallèle avec prompts spécialisés
    const [claudeResults, openaiResults] = await Promise.allSettled([
      // Claude 3.5 Haiku avec prompt petits objets
      isClaudeConfigured ? analyzePetitsWithClaude(opts) : Promise.resolve(null),
      // OpenAI GPT-4o-mini avec prompt petits objets
      analyzePetitsWithOpenAI(opts)
    ]);

    // Fusionner les résultats des deux IA
    const finalResults = mergePetitsResults(
      claudeResults.status === 'fulfilled' ? claudeResults.value : null,
      openaiResults.status === 'fulfilled' ? openaiResults.value : null
    );

    // Post-traitement spécialisé pour les petits objets
    const processedResults = await postProcessPetitsResults(finalResults);

    const processingTime = Date.now() - startTime;
    const result: PetitsAnalysisResult = {
      ...processedResults,
      processingTime,
      aiProvider: determineAIProvider(claudeResults, openaiResults),
      analysisType: 'petits',
      photo_id: opts.photoId
    };

    console.log(`Analyse petits objets terminée: ${result.items.length} objets, temps: ${processingTime}ms (${result.aiProvider})`);
    return result;

  } catch (error) {
    console.error('Erreur lors de l\'analyse petits objets:', error);
    // Fallback vers OpenAI seul
    const fallbackResult = await analyzePetitsWithOpenAI(opts);
    return {
      ...fallbackResult,
      processingTime: Date.now() - startTime,
      aiProvider: 'openai',
      analysisType: 'petits',
      photo_id: opts.photoId
    };
  }
}

/**
 * Analyse petits objets avec Claude (prompt spécialisé)
 */
async function analyzePetitsWithClaude(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<TPhotoAnalysis> {
  const settings = SPECIALIZED_AI_SETTINGS.petits;
  
  try {
    // Préparer l'image pour Claude
    const imageBuffer = await prepareImageForClaude(opts.imageUrl);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`Image Claude petits objets préparée: ${base64Image.length} bytes`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: settings.maxTokens,
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
                  data: base64Image,
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Claude API petits objets: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;
    if (!content) {
      throw new Error('Aucune réponse de Claude pour petits objets');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse Claude petits objets invalide');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return processPetitsAnalysis(analysis, opts.photoId);

  } catch (error) {
    console.error('Erreur Claude petits objets:', error);
    throw error;
  }
}

/**
 * Analyse petits objets avec OpenAI (prompt spécialisé)
 */
async function analyzePetitsWithOpenAI(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<TPhotoAnalysis> {
  const settings = SPECIALIZED_AI_SETTINGS.petits;
  
  try {
    const { getOpenAIClient } = await import('./openaiVision');
    const client = getOpenAIClient();
    
    if (!client) {
      throw new Error('Client OpenAI non configuré');
    }

    // Préparer l'image
    let imageContent;
    if (opts.imageUrl.startsWith('data:')) {
      const base64Data = opts.imageUrl.split(',')[1] || '';
      const mimeType = opts.imageUrl.split(',')[0].split(':')[1].split(';')[0];
      imageContent = { type: "image_url" as const, image_url: { url: `data:${mimeType};base64,${base64Data}` } };
    } else {
      imageContent = { type: "image_url" as const, image_url: { url: opts.imageUrl } };
    }

    const completion = await client.chat.completions.create({
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: settings.systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: settings.userPrompt },
            imageContent,
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const analysis = JSON.parse(raw);
    return processPetitsAnalysis(analysis, opts.photoId);

  } catch (error) {
    console.error('Erreur OpenAI petits objets:', error);
    throw error;
  }
}

/**
 * Traite et enrichit les résultats d'analyse petits objets
 */
function processPetitsAnalysis(analysis: any, photoId: string): TPhotoAnalysis {
  // Enrichir chaque objet avec les propriétés du catalogue et calculs
  for (const item of analysis.items ?? []) {
    const cat = mapToCatalog(item.label);
    
    // Vérifier les dimensions
    const hasValidDimensions = item.dimensions_cm && 
      item.dimensions_cm.length && item.dimensions_cm.length > 0 &&
      item.dimensions_cm.width && item.dimensions_cm.width > 0 &&
      item.dimensions_cm.height && item.dimensions_cm.height > 0;
    
    if (cat && !hasValidDimensions) {
      item.dimensions_cm = {
        length: cat.length, width: cat.width, height: cat.height, source: "catalog"
      };
    } else if (!hasValidDimensions && !cat) {
      // Dimensions par défaut pour petits objets
      item.dimensions_cm = {
        length: 20, width: 15, height: 25, source: "estimated"
      };
    }
    
    if (!item.category && cat) item.category = cat.category;
    
    // Calculer le volume
    item.volume_m3 = cat?.volume_m3 ?? volumeFromDims(
      item.dimensions_cm?.length, item.dimensions_cm?.width, item.dimensions_cm?.height
    );
    
    // Propriétés du catalogue
    if (cat) {
      if (item.fragile === undefined) item.fragile = cat.fragile ?? false;
      if (item.stackable === undefined) item.stackable = cat.stackable ?? true;
    }
    
    // Valeurs par défaut pour petits objets
    if (item.fragile === undefined) item.fragile = true; // Les petits objets sont souvent fragiles
    if (item.stackable === undefined) item.stackable = true; // Les petits objets s'empilent souvent
    
    // Calculer le volume emballé
    const packagingInfo = calculatePackagedVolume(
      item.volume_m3,
      item.fragile,
      item.category,
      item.dimensions_cm,
      item.dismountable
    );
    item.packaged_volume_m3 = packagingInfo.packagedVolumeM3;
    item.packaging_display = packagingInfo.displayValue;
    item.is_small_object = packagingInfo.isSmallObject;
    item.packaging_calculation_details = packagingInfo.calculationDetails;
    
    // Calculer la démontabilité (moins importante pour les petits objets)
    const dismountableResult = calculateDismountableProbability(
      item.label,
      item.dismountable,
      item.dismountable_confidence
    );
    item.dismountable = dismountableResult.isDismountable;
    item.dismountable_confidence = dismountableResult.confidence;
    item.dismountable_source = dismountableResult.source;
  }

  const items = analysis.items ?? [];
  const totals = {
    count_items: items.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0),
    volume_m3: Number(items.reduce((s: number, i: any) => s + (i.volume_m3 ?? 0) * (i.quantity ?? 1), 0).toFixed(3)),
  };
  
  // Gérer les special_rules (important pour les petits objets)
  if (analysis.special_rules?.autres_objets?.present) {
    totals.volume_m3 = Number((totals.volume_m3 + (analysis.special_rules.autres_objets.volume_m3 || 0)).toFixed(3));
    totals.count_items += analysis.special_rules.autres_objets.listed_items?.length || 0;
  }
  
  return {
    version: "1.0.0" as const,
    items: items,
    special_rules: analysis.special_rules || { autres_objets: { present: false, volume_m3: 0, listed_items: [] } },
    warnings: [...(analysis.warnings || []), "Analyse spécialisée petits objets"],
    errors: analysis.errors || [],
    totals,
    photo_id: photoId,
  };
}

/**
 * Fusionne les résultats Claude et OpenAI pour les petits objets
 */
function mergePetitsResults(
  claudeResults: TPhotoAnalysis | null,
  openaiResults: TPhotoAnalysis | null
): TPhotoAnalysis {
  if (!claudeResults && !openaiResults) {
    throw new Error('Aucun résultat IA disponible pour petits objets');
  }
  
  if (!claudeResults) return openaiResults!;
  if (!openaiResults) return claudeResults;

  // Fusionner les items
  const mergedItems = mergePetitsItems(claudeResults.items, openaiResults.items);
  
  const specialRules = openaiResults.special_rules || claudeResults.special_rules;
  
  const totals = {
    count_items: mergedItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    volume_m3: Number(mergedItems.reduce((sum, item) => sum + (item.volume_m3 || 0) * (item.quantity || 1), 0).toFixed(3))
  };

  const warnings = [
    ...(claudeResults.warnings || []),
    ...(openaiResults.warnings || []),
    'Analyse hybride petits objets Claude + OpenAI'
  ];

  return {
    version: "1.0.0",
    photo_id: openaiResults.photo_id || claudeResults.photo_id || '',
    items: mergedItems,
    special_rules: specialRules,
    warnings,
    errors: [...(claudeResults.errors || []), ...(openaiResults.errors || [])],
    totals
  };
}

/**
 * Fusionne les items petits objets des deux analyses
 */
function mergePetitsItems(items1: any[], items2: any[]): any[] {
  const mergedMap = new Map();
  
  // Ajouter les items de Claude
  items1.forEach(item => {
    const key = item.label.toLowerCase();
    mergedMap.set(key, { ...item, source: 'claude' });
  });
  
  // Fusionner avec les items d'OpenAI
  items2.forEach(item => {
    const key = item.label.toLowerCase();
    const existing = mergedMap.get(key);
    
    if (existing) {
      mergedMap.set(key, {
        ...item,
        quantity: Math.max(existing.quantity || 1, item.quantity || 1),
        confidence: Math.max(existing.confidence || 0.5, item.confidence || 0.5),
        source: 'hybrid'
      });
    } else {
      mergedMap.set(key, { ...item, source: 'openai' });
    }
  });
  
  return Array.from(mergedMap.values());
}

/**
 * Post-traitement spécialisé pour les petits objets
 */
async function postProcessPetitsResults(results: TPhotoAnalysis): Promise<TPhotoAnalysis> {
  // Ici on pourrait ajouter des règles spécifiques aux petits objets
  // Par exemple : regroupement des objets similaires, validation des quantités, etc.
  return results;
}

/**
 * Détermine le fournisseur IA utilisé
 */
function determineAIProvider(
  claudeResults: PromiseSettledResult<TPhotoAnalysis | null>,
  openaiResults: PromiseSettledResult<TPhotoAnalysis>
): 'claude' | 'openai' | 'hybrid' {
  const claudeSuccess = claudeResults.status === 'fulfilled' && claudeResults.value !== null;
  const openaiSuccess = openaiResults.status === 'fulfilled';
  
  if (claudeSuccess && openaiSuccess) return 'hybrid';
  if (claudeSuccess) return 'claude';
  return 'openai';
}

/**
 * Prépare l'image pour Claude
 */
async function prepareImageForClaude(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('data:')) {
    const base64Data = imageUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } else {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

