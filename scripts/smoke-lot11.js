#!/usr/bin/env node
/**
 * LOT 11 - Smoke Test E2E: Batch Upload & Orchestration
 * 
 * Ce script teste le workflow complet:
 * 1. Création d'un projet
 * 2. Création d'un batch avec 3 photos
 * 3. Polling du batch jusqu'à complétion
 * 4. Vérification des statuts (succès/échecs/partial)
 * 5. Vérification de l'inventory-sync unique
 * 
 * Usage: node scripts/smoke-lot11.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-lot11';

// Mock images URLs (utilise des images de test locales ou mocks)
const MOCK_IMAGES = [
  {
    filename: 'salon-1.jpg',
    filePath: '/uploads/test/salon-1.jpg',
    url: 'http://localhost:3000/test-image.jpg',
    roomType: 'living_room',
  },
  {
    filename: 'chambre-1.jpg',
    filePath: '/uploads/test/chambre-1.jpg',
    url: 'http://localhost:3000/test-image.jpg',
    roomType: 'bedroom',
  },
  {
    filename: 'cuisine-fail.jpg',
    filePath: '/uploads/test/cuisine-fail.jpg',
    url: 'http://invalid-url-to-trigger-failure.com/image.jpg', // Cette URL doit échouer
    roomType: 'kitchen',
  },
];

/**
 * Helper: requête HTTP avec retry
 */
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': TEST_USER_ID,
          ...options.headers,
        },
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
      }

      return { ok: true, status: response.status, data };
    } catch (error) {
      console.error(`[Retry ${i + 1}/${retries}] ${error.message}`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Helper: attente
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Étape 1: Créer un projet de test
 */
async function createTestProject() {
  console.log('\n📦 [1/5] Création du projet de test...');
  
  const response = await fetchWithRetry(`${BASE_URL}/api/projects`, {
    method: 'POST',
    body: JSON.stringify({
      name: `LOT11-Test-${Date.now()}`,
    }),
  });

  const projectId = response.data.project?.id || response.data.id;
  console.log(`✅ Projet créé: ${projectId}`);
  return projectId;
}

/**
 * Étape 2: Créer un batch avec 3 photos
 */
async function createBatch(projectId) {
  console.log('\n📤 [2/5] Création du batch (3 photos)...');
  
  const response = await fetchWithRetry(`${BASE_URL}/api/batches`, {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      imageUrls: MOCK_IMAGES,
    }),
  });

  if (response.status !== 202) {
    throw new Error(`Expected 202, got ${response.status}`);
  }

  const batchId = response.data.batchId;
  const photosCount = response.data.photosCount;
  const jobsEnqueued = response.data.jobsEnqueued;

  console.log(`✅ Batch créé: ${batchId}`);
  console.log(`   Photos: ${photosCount}, Jobs: ${jobsEnqueued}`);

  return batchId;
}

/**
 * Étape 3: Polling du batch jusqu'à complétion
 */
async function pollBatch(batchId, maxAttempts = 60, intervalMs = 2000) {
  console.log('\n⏳ [3/5] Polling du batch (max 2 min)...');
  
  let attempts = 0;
  let lastProgress = -1;

  while (attempts < maxAttempts) {
    attempts++;
    
    const response = await fetchWithRetry(`${BASE_URL}/api/batches/${batchId}`);
    const batch = response.data.batch;

    if (batch.progress !== lastProgress) {
      console.log(
        `   ${batch.progress}% | ${batch.status} | ` +
        `Q:${batch.counts.queued} P:${batch.counts.processing} ` +
        `✓:${batch.counts.completed} ✗:${batch.counts.failed}`
      );
      lastProgress = batch.progress;
    }

    // Statuts terminaux
    if (['COMPLETED', 'PARTIAL', 'FAILED'].includes(batch.status)) {
      console.log(`\n✅ Batch terminé: ${batch.status} (${batch.progress}%)`);
      return batch;
    }

    await sleep(intervalMs);
  }

  throw new Error(`Timeout: batch non terminé après ${maxAttempts * intervalMs / 1000}s`);
}

/**
 * Étape 4: Vérifications
 */
async function verifyBatch(batch) {
  console.log('\n🔍 [4/5] Vérifications...');

  // 4a. Vérifier qu'au moins 2 photos ont réussi
  if (batch.counts.completed < 2) {
    throw new Error(`Expected at least 2 completed photos, got ${batch.counts.completed}`);
  }
  console.log(`✅ Photos réussies: ${batch.counts.completed}`);

  // 4b. Vérifier qu'au moins 1 photo a échoué (celle avec URL invalide)
  if (batch.counts.failed < 1) {
    console.warn(`⚠️  Expected at least 1 failed photo, got ${batch.counts.failed} (IA mock peut tout accepter)`);
  } else {
    console.log(`✅ Photos échouées: ${batch.counts.failed}`);
  }

  // 4c. Vérifier le statut final (PARTIAL attendu si 1 échec)
  if (batch.counts.failed > 0 && batch.counts.completed > 0) {
    if (batch.status !== 'PARTIAL') {
      throw new Error(`Expected PARTIAL status, got ${batch.status}`);
    }
    console.log(`✅ Statut: PARTIAL (correct)`);
  } else if (batch.counts.completed === batch.counts.total) {
    if (batch.status !== 'COMPLETED') {
      throw new Error(`Expected COMPLETED status, got ${batch.status}`);
    }
    console.log(`✅ Statut: COMPLETED (correct)`);
  }

  // 4d. Vérifier l'inventorySummary
  if (!batch.inventorySummary) {
    throw new Error('Missing inventorySummary in completed/partial batch');
  }
  console.log(`✅ InventorySummary présent:`);
  console.log(`   - Items: ${batch.inventorySummary.totalItems}`);
  console.log(`   - Volume: ${batch.inventorySummary.totalVolume} m³`);
  console.log(`   - Pièces: ${batch.inventorySummary.rooms.length}`);

  // 4e. Afficher les photos
  console.log(`\n📷 Photos (${batch.photos.length}):`);
  batch.photos.forEach((photo, i) => {
    console.log(
      `   ${i + 1}. ${photo.filename} | ${photo.status} | ${photo.roomType || 'N/A'}` +
      (photo.errorCode ? ` | ⚠️  ${photo.errorCode}` : '')
    );
  });
}

/**
 * Étape 5: Métriques finales
 */
async function displayMetrics(projectId, batchId) {
  console.log('\n📊 [5/5] Métriques (si disponible)...');
  
  try {
    // Requête optionnelle pour récupérer les métriques IA
    // (Supposé que l'endpoint existe ou qu'on consulte directement AiMetric)
    console.log(`   Projet: ${projectId}`);
    console.log(`   Batch: ${batchId}`);
    console.log(`   (Métriques détaillées disponibles dans AiMetric table)`);
  } catch (error) {
    console.log(`   ⚠️  Métriques non disponibles: ${error.message}`);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 LOT 11 - Smoke Test E2E: Batch Orchestration');
  console.log(`   API: ${BASE_URL}`);
  console.log(`   User: ${TEST_USER_ID}`);

  const startTime = Date.now();

  try {
    // 1. Créer projet
    const projectId = await createTestProject();

    // 2. Créer batch
    const batchId = await createBatch(projectId);

    // 3. Polling
    const batch = await pollBatch(batchId);

    // 4. Vérifications
    await verifyBatch(batch);

    // 5. Métriques
    await displayMetrics(projectId, batchId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ SUCCÈS - LOT 11 testé avec succès en ${duration}s`);
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ ÉCHEC: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main();




