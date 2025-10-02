/**
 * 🛋️ ANALYSE CANAPÉS - Service spécialisé
 * 
 * Raisonnement contextuel basé sur Gemini + GPT-4 :
 * - Compter le nombre de places assises
 * - Identifier le type (droit, angle, méridienne)
 * - FORMULE EXPLICITE : L = Places × 60cm + 2 × Accoudoirs
 * - Déterminer profondeur selon style (classique 85-95cm, lounge 100-110cm)
 * 
 * Impact attendu : ±0.2-0.4 m³ par canapé
 * Priorité : HAUTE (volume élevé, erreur accoudoirs fréquente)
 */

/**
 * 🚨 CRITIQUE - ANALYSE CANAPÉS
 * 
 * Ce service utilise les prompts spécialisés CANAPES_SYSTEM_PROMPT et CANAPES_USER_PROMPT
 * qui EXCLUENT explicitement les chaises, fauteuils, sièges, armoires et tables.
 * 
 * ⚠️ PROBLÈME RÉSOLU : Les fonctions analyzeCanapesWithClaude et analyzeCanapesWithOpenAI
 * utilisent maintenant correctement les prompts spécialisés au lieu du prompt par défaut.
 * 
 * 📊 RÉSULTAT ATTENDU : 0 canapés détectés sur une image avec 5 chaises
 * 
 * 🔍 DIAGNOSTIC : Vérifier les logs "MERGE 5 ANALYSES" - Canapés doit être 0
 */

import { TPhotoAnalysis, TInventoryItem } from '@/lib/schemas';
import { SPECIALIZED_AI_SETTINGS } from '@/lib/specializedPrompts';
import { analyzePhotoWithClaude } from './claudeVision';
import { originalAnalyzePhotoWithVision } from './openaiVision';

export interface CanapesAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid';
  analysisType: 'canapes';
}

/**
 * Analyse hybride spécialisée pour les CANAPÉS
 * Utilise Claude + OpenAI en parallèle avec prompts spécialisés CANAPÉS
 */
export async function analyzeCanapesHybrid(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<CanapesAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Vérifier si Claude est configuré
    const isClaudeConfigured = !!process.env.CLAUDE_API_KEY;
    
    console.log('🛋️  Analyse CANAPÉS démarrée...');
    
    // Lancer les deux analyses en parallèle avec prompts CANAPÉS
    const [claudeResults, openaiResults] = await Promise.allSettled([
      isClaudeConfigured ? analyzeCanapesWithClaude(opts) : Promise.resolve(null),
      analyzeCanapesWithOpenAI(opts)
    ]);

    // Fusionner les résultats
    const finalResults = mergeCanapesResults(
      claudeResults.status === 'fulfilled' ? claudeResults.value : null,
      openaiResults.status === 'fulfilled' ? openaiResults.value : null
    );

    // Validation des dimensions (formule)
    const validatedResults = validateCanapesDimensions(finalResults);

    const processingTime = Date.now() - startTime;
    const result: CanapesAnalysisResult = {
      ...validatedResults,
      processingTime,
      aiProvider: determineAIProvider(claudeResults, openaiResults),
      analysisType: 'canapes',
      photo_id: opts.photoId
    };

    console.log(`✅ Analyse CANAPÉS terminée: ${result.items.length} canapé(s), temps: ${processingTime}ms (${result.aiProvider})`);
    return result;

  } catch (error) {
    console.error('❌ Erreur analyse CANAPÉS:', error);
    // Fallback vers OpenAI seul
    const fallbackResult = await analyzeCanapesWithOpenAI(opts);
    return {
      ...fallbackResult,
      processingTime: Date.now() - startTime,
      aiProvider: 'openai',
      analysisType: 'canapes',
      photo_id: opts.photoId
    };
  }
}

/**
 * Analyse avec Claude
 */
async function analyzeCanapesWithClaude(opts: { imageUrl: string }): Promise<TPhotoAnalysis | null> {
  try {
    const settings = SPECIALIZED_AI_SETTINGS.canapes;
    
    const analysis = await analyzePhotoWithClaude({
      photoId: 'canape-analysis',
      imageUrl: opts.imageUrl,
      systemPrompt: settings.systemPrompt,
      userPrompt: settings.userPrompt
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 RÉPONSE BRUTE CLAUDE CANAPÉS:');
    console.log(JSON.stringify(analysis, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return analysis;
  } catch (error) {
    console.error('Erreur Claude CANAPÉS:', error);
    return null;
  }
}

/**
 * Analyse avec OpenAI
 */
async function analyzeCanapesWithOpenAI(opts: { imageUrl: string }): Promise<TPhotoAnalysis> {
  const settings = SPECIALIZED_AI_SETTINGS.canapes;
  
  const analysis = await originalAnalyzePhotoWithVision({
    photoId: 'canape-analysis',
    imageUrl: opts.imageUrl,
    systemPrompt: settings.systemPrompt,
    userPrompt: settings.userPrompt
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 RÉPONSE BRUTE OPENAI CANAPÉS:');
  console.log(JSON.stringify(analysis, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return analysis;
}

/**
 * Fusion des résultats Claude + OpenAI
 */
function mergeCanapesResults(
  claudeResults: TPhotoAnalysis | null,
  openaiResults: TPhotoAnalysis | null
): TPhotoAnalysis {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔀 MERGE CANAPÉS - AVANT:');
  console.log('Claude items:', JSON.stringify(claudeResults?.items, null, 2));
  console.log('OpenAI items:', JSON.stringify(openaiResults?.items, null, 2));

  if (!claudeResults && !openaiResults) {
    return {
      version: "1.0.0",
      photo_id: "canape-analysis",
      items: [],
      totals: { volume_m3: 0, count_items: 0 },
      warnings: [],
      errors: []
    };
  }

  if (!claudeResults) return openaiResults!;
  if (!openaiResults) return claudeResults;

  // Privilégier Claude si confidence > OpenAI
  const mergedItems: TInventoryItem[] = [];
  
  for (const claudeItem of claudeResults.items) {
    const openaiMatch = openaiResults.items.find(
      item => item.label.toLowerCase().includes('canapé') || 
              item.label.toLowerCase().includes('sofa') ||
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

  console.log('🔀 MERGE CANAPÉS - APRÈS:');
  console.log('Merged items:', JSON.stringify(mergedItems, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    version: "1.0.0",
    photo_id: "canape-analysis",
    items: mergedItems,
    totals: {
      volume_m3: mergedItems.reduce((sum, item) => sum + item.volume_m3, 0),
      count_items: mergedItems.length
    },
    warnings: [],
    errors: []
  };
}

/**
 * VALIDATION DIMENSIONS CANAPÉS
 * Vérifie formule : L = Places × 60 + 2 × Accoudoirs
 */
function validateCanapesDimensions(analysis: TPhotoAnalysis): TPhotoAnalysis {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VALIDATION DIMENSIONS CANAPÉS - AVANT:');
  console.log(JSON.stringify(analysis.items, null, 2));

  const validatedItems = analysis.items.map(item => {
    const detectedFeatures = (item as any).detected_features;
    
    if (!detectedFeatures?.nb_places) {
      console.log(`⚠️  Item "${item.label}" sans nb_places, skip validation`);
      return item;
    }

    const nbPlaces = detectedFeatures.nb_places;
    const type = detectedFeatures.type || 'droit';
    const accoudoirs = detectedFeatures.accoudoirs || 'standard';
    
    console.log(`🛋️  Canapé "${item.label}": ${nbPlaces} places, type ${type}, accoudoirs ${accoudoirs}`);

    // Calculer dimensions attendues selon formule
    const expectedDims = calculateCanapeDimensions(nbPlaces, type, accoudoirs);
    
    if (expectedDims && item.dimensions_cm) {
      const { length } = item.dimensions_cm;
      
      // Vérifier largeur (dimension critique pour canapés)
      const lengthDiff = Math.abs((length || 0) - expectedDims.length) / expectedDims.length;
      
      if (lengthDiff > 0.15) { // 15% tolérance
        console.log(`⚠️  Largeur hors standard: ${length}cm vs attendu ${expectedDims.length}cm (formule)`);
        console.log(`   → Formule: ${nbPlaces}×60 + 2×${accoudoirs === 'larges' ? 20 : 10} = ${expectedDims.length}cm`);
        
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

  console.log('🔍 VALIDATION DIMENSIONS CANAPÉS - APRÈS:');
  console.log(JSON.stringify(validatedItems, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    ...analysis,
    items: validatedItems
  };
}

/**
 * Calcul dimensions canapé selon formule
 * L = Places × 60cm + 2 × Accoudoirs
 */
function calculateCanapeDimensions(
  nbPlaces: number,
  type: string,
  accoudoirs: string
): { length: number; width: number; height: number } {
  // Largeur par place
  const largeurPlace = 60; // cm
  
  // Largeur accoudoirs
  const largeurAccoudoir = accoudoirs === 'larges' ? 20 : 10; // cm
  
  // Formule : L = Places × 60 + 2 × Accoudoirs
  const length = nbPlaces * largeurPlace + 2 * largeurAccoudoir;
  
  // Profondeur selon style
  const width = accoudoirs === 'larges' ? 95 : 90; // Lounge vs classique
  
  // Hauteur standard
  const height = 85;
  
  return { length, width, height };
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

