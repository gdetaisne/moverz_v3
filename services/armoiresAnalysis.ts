/**
 * 🚪 ANALYSE ARMOIRES / PENDERIES - Service spécialisé
 * 
 * Raisonnement contextuel basé sur Gemini + GPT-4 :
 * - Compter le nombre de portes
 * - Calculer largeur : 50-60cm/porte battante, 80cm coulissante
 * - Évaluer hauteur par rapport au plafond (240-250cm)
 * - Déterminer profondeur selon type (penderie 60cm, fine 40cm)
 * 
 * Impact attendu : ±1-1.5 m³ sur total déménagement
 * Priorité : CRITIQUE (volume individuel très élevé × 3-4 par foyer)
 */

import { TPhotoAnalysis, TInventoryItem } from '@/lib/schemas';
import { SPECIALIZED_AI_SETTINGS } from '@/lib/specializedPrompts';
import { analyzePhotoWithClaude } from './claudeVision';
import { originalAnalyzePhotoWithVision } from './openaiVision';

export interface ArmoiresAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid';
  analysisType: 'armoires';
}

/**
 * Analyse hybride spécialisée pour les ARMOIRES / PENDERIES
 * Utilise Claude + OpenAI en parallèle avec prompts spécialisés ARMOIRES
 */
export async function analyzeArmoiresHybrid(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<ArmoiresAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Vérifier si Claude est configuré
    const isClaudeConfigured = !!process.env.CLAUDE_API_KEY;
    
    console.log('🚪 Analyse ARMOIRES démarrée...');
    
    // Lancer les deux analyses en parallèle avec prompts ARMOIRES
    const [claudeResults, openaiResults] = await Promise.allSettled([
      isClaudeConfigured ? analyzeArmoiresWithClaude(opts) : Promise.resolve(null),
      analyzeArmoiresWithOpenAI(opts)
    ]);

    // Fusionner les résultats
    const finalResults = mergeArmoiresResults(
      claudeResults.status === 'fulfilled' ? claudeResults.value : null,
      openaiResults.status === 'fulfilled' ? openaiResults.value : null
    );

    // Validation des dimensions
    const validatedResults = validateArmoiresDimensions(finalResults);

    const processingTime = Date.now() - startTime;
    const result: ArmoiresAnalysisResult = {
      ...validatedResults,
      processingTime,
      aiProvider: determineAIProvider(claudeResults, openaiResults),
      analysisType: 'armoires',
      photo_id: opts.photoId
    };

    console.log(`✅ Analyse ARMOIRES terminée: ${result.items.length} armoire(s), temps: ${processingTime}ms (${result.aiProvider})`);
    return result;

  } catch (error) {
    console.error('❌ Erreur analyse ARMOIRES:', error);
    // Fallback vers OpenAI seul
    const fallbackResult = await analyzeArmoiresWithOpenAI(opts);
    return {
      ...fallbackResult,
      processingTime: Date.now() - startTime,
      aiProvider: 'openai',
      analysisType: 'armoires',
      photo_id: opts.photoId
    };
  }
}

/**
 * Analyse avec Claude
 */
async function analyzeArmoiresWithClaude(opts: { imageUrl: string }): Promise<TPhotoAnalysis | null> {
  try {
    const settings = SPECIALIZED_AI_SETTINGS.armoires;
    
    const analysis = await analyzePhotoWithClaude({
      photoId: 'armoire-analysis',
      imageUrl: opts.imageUrl
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 RÉPONSE BRUTE CLAUDE ARMOIRES:');
    console.log(JSON.stringify(analysis, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return analysis;
  } catch (error) {
    console.error('Erreur Claude ARMOIRES:', error);
    return null;
  }
}

/**
 * Analyse avec OpenAI
 */
async function analyzeArmoiresWithOpenAI(opts: { imageUrl: string }): Promise<TPhotoAnalysis> {
  const settings = SPECIALIZED_AI_SETTINGS.armoires;
  
  const analysis = await originalAnalyzePhotoWithVision({
    photoId: 'armoire-analysis',
    imageUrl: opts.imageUrl
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 RÉPONSE BRUTE OPENAI ARMOIRES:');
  console.log(JSON.stringify(analysis, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return analysis;
}

/**
 * Fusion des résultats Claude + OpenAI
 */
function mergeArmoiresResults(
  claudeResults: TPhotoAnalysis | null,
  openaiResults: TPhotoAnalysis | null
): TPhotoAnalysis {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔀 MERGE ARMOIRES - AVANT:');
  console.log('Claude items:', JSON.stringify(claudeResults?.items, null, 2));
  console.log('OpenAI items:', JSON.stringify(openaiResults?.items, null, 2));

  if (!claudeResults && !openaiResults) {
    return { items: [], totals: { volume_m3: 0, count_items: 0 } };
  }

  if (!claudeResults) return openaiResults!;
  if (!openaiResults) return claudeResults;

  // Privilégier Claude si confidence > OpenAI
  const mergedItems: TInventoryItem[] = [];
  
  for (const claudeItem of claudeResults.items) {
    const openaiMatch = openaiResults.items.find(
      item => item.label.toLowerCase().includes('armoire') || 
              item.label.toLowerCase().includes('penderie') ||
              claudeItem.label.toLowerCase().includes(item.label.toLowerCase())
    );

    if (openaiMatch) {
      // Prendre celui avec meilleure confidence
      mergedItems.push(claudeItem.confidence > openaiMatch.confidence ? claudeItem : openaiMatch);
    } else {
      mergedItems.push(claudeItem);
    }
  }

  // Ajouter items OpenAI non matchés
  for (const openaiItem of openaiResults.items) {
    const alreadyAdded = mergedItems.some(
      item => item.label.toLowerCase() === openaiItem.label.toLowerCase()
    );
    if (!alreadyAdded) {
      mergedItems.push(openaiItem);
    }
  }

  console.log('🔀 MERGE ARMOIRES - APRÈS:');
  console.log('Merged items:', JSON.stringify(mergedItems, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    items: mergedItems,
    totals: {
      total_volume_m3: mergedItems.reduce((sum, item) => sum + item.volume_m3, 0),
      total_items: mergedItems.length
    }
  };
}

/**
 * VALIDATION DIMENSIONS ARMOIRES
 * Vérifie cohérence avec standards selon nombre de portes
 */
function validateArmoiresDimensions(analysis: TPhotoAnalysis): TPhotoAnalysis {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VALIDATION DIMENSIONS ARMOIRES - AVANT:');
  console.log(JSON.stringify(analysis.items, null, 2));

  const validatedItems = analysis.items.map(item => {
    const detectedFeatures = (item as any).detected_features;
    
    if (!detectedFeatures?.nb_portes) {
      console.log(`⚠️  Item "${item.label}" sans nb_portes, skip validation`);
      return item;
    }

    const nbPortes = detectedFeatures.nb_portes;
    const typePortes = detectedFeatures.type_portes || 'battantes';
    
    console.log(`🚪 Armoire "${item.label}": ${nbPortes} porte(s) ${typePortes}`);

    // Calculer dimensions attendues selon nombre de portes
    const expectedDims = getExpectedDimensionsForArmoire(nbPortes, typePortes);
    
    if (expectedDims && item.dimensions_cm) {
      const { length, width, height } = item.dimensions_cm;
      
      // Vérifier largeur (dimension la plus critique)
      const lengthDiff = Math.abs(length - expectedDims.length) / expectedDims.length;
      
      if (lengthDiff > 0.20) { // 20% tolérance
        console.log(`⚠️  Largeur hors standard: ${length}cm vs attendu ${expectedDims.length}cm`);
        console.log(`   → Application dimensions standard`);
        
        item.dimensions_cm = {
          length: expectedDims.length,
          width: expectedDims.width,
          height: expectedDims.height,
          source: 'reasoned'
        };
        
        // Recalculer volume
        item.volume_m3 = (expectedDims.length * expectedDims.width * expectedDims.height) / 1_000_000;
        
        console.log(`✅ Dimensions corrigées: ${expectedDims.length}×${expectedDims.width}×${expectedDims.height}cm`);
      } else {
        console.log(`✅ Dimensions OK (écart ${(lengthDiff * 100).toFixed(1)}%)`);
      }
    }

    return item;
  });

  console.log('🔍 VALIDATION DIMENSIONS ARMOIRES - APRÈS:');
  console.log(JSON.stringify(validatedItems, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    ...analysis,
    items: validatedItems
  };
}

/**
 * Standards dimensions armoires selon nombre et type de portes
 */
function getExpectedDimensionsForArmoire(
  nbPortes: number,
  typePortes: string
): { length: number; width: number; height: number } | null {
  const largeurParPorte = typePortes === 'coulissantes' ? 80 : 55; // cm
  const montants = 10; // cm pour les montants
  
  const standards: Record<number, { length: number; width: number; height: number }> = {
    1: { length: 70, width: 50, height: 190 },
    2: { length: nbPortes * largeurParPorte + montants, width: 60, height: 210 },
    3: { length: nbPortes * largeurParPorte + montants, width: 60, height: 220 },
    4: { length: nbPortes * largeurParPorte + montants, width: 65, height: 230 }
  };

  return standards[nbPortes] || null;
}

/**
 * Détermine le provider AI utilisé
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

