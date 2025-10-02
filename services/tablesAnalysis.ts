/**
 * 🍽️ ANALYSE TABLES À MANGER - Service spécialisé
 * 
 * Raisonnement contextuel basé sur Gemini + GPT-4 :
 * - Compter les chaises autour de la table
 * - Déterminer la forme (carrée vs rectangulaire)
 * - VALIDATION MORPHOLOGIQUE CRITIQUE : ratio L/W
 * - Appliquer standards selon (Capacité + Forme)
 * 
 * Impact attendu : ±0.3-0.5 m³ par table
 * Priorité : HAUTE (erreur forme fréquente)
 */

import { TPhotoAnalysis, TInventoryItem } from '@/lib/schemas';
import { SPECIALIZED_AI_SETTINGS } from '@/lib/specializedPrompts';
import { analyzePhotoWithClaude } from './claudeVision';
import { originalAnalyzePhotoWithVision } from './openaiVision';

export interface TablesAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid';
  analysisType: 'tables';
}

/**
 * Analyse hybride spécialisée pour les TABLES À MANGER
 * Utilise Claude + OpenAI en parallèle avec prompts spécialisés TABLES
 */
export async function analyzeTablesHybrid(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<TablesAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Vérifier si Claude est configuré
    const isClaudeConfigured = !!process.env.CLAUDE_API_KEY;
    
    console.log('🍽️  Analyse TABLES démarrée...');
    
    // Lancer les deux analyses en parallèle avec prompts TABLES
    const [claudeResults, openaiResults] = await Promise.allSettled([
      isClaudeConfigured ? analyzeTablesWithClaude(opts) : Promise.resolve(null),
      analyzeTablesWithOpenAI(opts)
    ]);

    // Fusionner les résultats
    const finalResults = mergeTablesResults(
      claudeResults.status === 'fulfilled' ? claudeResults.value : null,
      openaiResults.status === 'fulfilled' ? openaiResults.value : null
    );

    // Validation morphologique
    const validatedResults = validateTablesMorphology(finalResults);

    const processingTime = Date.now() - startTime;
    const result: TablesAnalysisResult = {
      ...validatedResults,
      processingTime,
      aiProvider: determineAIProvider(claudeResults, openaiResults),
      analysisType: 'tables',
      photo_id: opts.photoId
    };

    console.log(`✅ Analyse TABLES terminée: ${result.items.length} table(s), temps: ${processingTime}ms (${result.aiProvider})`);
    return result;

  } catch (error) {
    console.error('❌ Erreur analyse TABLES:', error);
    // Fallback vers OpenAI seul
    const fallbackResult = await analyzeTablesWithOpenAI(opts);
    return {
      ...fallbackResult,
      processingTime: Date.now() - startTime,
      aiProvider: 'openai',
      analysisType: 'tables',
      photo_id: opts.photoId
    };
  }
}

/**
 * Analyse avec Claude
 */
async function analyzeTablesWithClaude(opts: { imageUrl: string }): Promise<TPhotoAnalysis | null> {
  try {
    const settings = SPECIALIZED_AI_SETTINGS.tables;
    
    const analysis = await analyzePhotoWithClaude({
      photoId: 'table-analysis',
      imageUrl: opts.imageUrl,
      systemPrompt: settings.systemPrompt,
      userPrompt: settings.userPrompt
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 RÉPONSE BRUTE CLAUDE TABLES:');
    console.log(JSON.stringify(analysis, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return analysis;
  } catch (error) {
    console.error('Erreur Claude TABLES:', error);
    return null;
  }
}

/**
 * Analyse avec OpenAI
 */
async function analyzeTablesWithOpenAI(opts: { imageUrl: string }): Promise<TPhotoAnalysis> {
  const settings = SPECIALIZED_AI_SETTINGS.tables;
  
  const analysis = await originalAnalyzePhotoWithVision({
    photoId: 'table-analysis',
    imageUrl: opts.imageUrl,
    systemPrompt: settings.systemPrompt,
    userPrompt: settings.userPrompt
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 RÉPONSE BRUTE OPENAI TABLES:');
  console.log(JSON.stringify(analysis, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return analysis;
}

/**
 * Fusion des résultats Claude + OpenAI
 */
function mergeTablesResults(
  claudeResults: TPhotoAnalysis | null,
  openaiResults: TPhotoAnalysis | null
): TPhotoAnalysis {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔀 MERGE TABLES - AVANT:');
  console.log('Claude items:', JSON.stringify(claudeResults?.items, null, 2));
  console.log('OpenAI items:', JSON.stringify(openaiResults?.items, null, 2));

  if (!claudeResults && !openaiResults) {
    return { items: [], totals: { total_volume_m3: 0, total_items: 0 } };
  }

  if (!claudeResults) return openaiResults!;
  if (!openaiResults) return claudeResults;

  // Privilégier Claude si confidence > OpenAI
  const mergedItems: TInventoryItem[] = [];
  
  for (const claudeItem of claudeResults.items) {
    const openaiMatch = openaiResults.items.find(
      item => item.label.toLowerCase().includes('table') || 
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

  console.log('🔀 MERGE TABLES - APRÈS:');
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
 * VALIDATION MORPHOLOGIQUE CRITIQUE
 * Vérifie cohérence forme (carré vs rectangulaire) avec ratio L/W
 */
function validateTablesMorphology(analysis: TPhotoAnalysis): TPhotoAnalysis {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VALIDATION MORPHOLOGIQUE TABLES - AVANT:');
  console.log(JSON.stringify(analysis.items, null, 2));

  const validatedItems = analysis.items.map(item => {
    if (!item.dimensions_cm?.length || !item.dimensions_cm?.width) {
      console.log(`⚠️  Item "${item.label}" sans dimensions, skip validation`);
      return item;
    }

    const { length, width } = item.dimensions_cm;
    const ratio = length / width;

    console.log(`📏 Table "${item.label}": ${length}×${width} → ratio ${ratio.toFixed(2)}`);

    // Déterminer forme réelle selon ratio
    const realShape = ratio < 1.2 ? 'carrée' : 'rectangulaire';
    
    // Si detected_features existe, vérifier cohérence
    const detectedFeatures = (item as any).detected_features;
    if (detectedFeatures?.forme) {
      const declaredShape = detectedFeatures.forme;
      
      if (declaredShape !== realShape) {
        console.log(`⚠️  INCOHÉRENCE FORME: déclaré "${declaredShape}", ratio indique "${realShape}"`);
        console.log(`   → Forçage forme "${realShape}" selon ratio ${ratio.toFixed(2)}`);
        
        // Corriger la forme déclarée
        (item as any).detected_features.forme = realShape;
        (item as any).detected_features.ratio_LW = ratio;
      } else {
        console.log(`✅ Cohérence OK: forme "${realShape}" validée par ratio ${ratio.toFixed(2)}`);
      }
    }

    // Vérifier si dimensions matchent standards pour cette forme
    const nbChaises = detectedFeatures?.nb_chaises || 0;
    
    if (nbChaises > 0) {
      const expectedDims = getExpectedDimensionsForTable(nbChaises, realShape);
      if (expectedDims) {
        const tolerance = 0.15; // 15% tolérance
        const lengthDiff = Math.abs(length - expectedDims.length) / expectedDims.length;
        const widthDiff = Math.abs(width - expectedDims.width) / expectedDims.width;
        
        if (lengthDiff > tolerance || widthDiff > tolerance) {
          console.log(`⚠️  Dimensions hors standard: attendu ~${expectedDims.length}×${expectedDims.width}`);
          console.log(`   → Application dimensions standard`);
          
          item.dimensions_cm = {
            length: expectedDims.length,
            width: expectedDims.width,
            height: 75, // Hauteur standard table
            source: 'reasoned'
          };
          
          // Recalculer volume
          item.volume_m3 = (expectedDims.length * expectedDims.width * 75) / 1_000_000;
        }
      }
    }

    return item;
  });

  console.log('🔍 VALIDATION MORPHOLOGIQUE TABLES - APRÈS:');
  console.log(JSON.stringify(validatedItems, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    ...analysis,
    items: validatedItems
  };
}

/**
 * Standards dimensions tables selon capacité et forme
 */
function getExpectedDimensionsForTable(nbChaises: number, forme: string): { length: number; width: number } | null {
  const standards: Record<string, { length: number; width: number }> = {
    '4-carrée': { length: 110, width: 110 },
    '4-rectangulaire': { length: 120, width: 80 },
    '6-carrée': { length: 140, width: 140 },
    '6-rectangulaire': { length: 170, width: 90 },
    '8-carrée': { length: 150, width: 150 },
    '8-rectangulaire': { length: 210, width: 100 }
  };

  const key = `${nbChaises}-${forme}`;
  return standards[key] || null;
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

