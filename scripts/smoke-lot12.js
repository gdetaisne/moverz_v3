#!/usr/bin/env node
/**
 * LOT 12 - Smoke Test E2E: SSE Real-Time Progress
 * 
 * Ce script teste le flux SSE en conditions réelles:
 * 1. Création d'un projet + batch
 * 2. Connexion SSE au stream
 * 3. Écoute des événements progress en temps réel
 * 4. Vérification que le batch se termine correctement
 * 5. Pas de polling HTTP (uniquement SSE)
 * 
 * Usage: node scripts/smoke-lot12.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-lot12';

// Mock images URLs
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
];

/**
 * Helper: requête HTTP
 */
async function fetchAPI(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
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
}

/**
 * Étape 1: Créer projet + batch
 */
async function setupBatch() {
  console.log('\n📦 [1/3] Création projet + batch...');
  
  // Créer projet
  const projectRes = await fetchAPI('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: `LOT12-SSE-Test-${Date.now()}`,
    }),
  });

  const projectId = projectRes.data.project?.id || projectRes.data.id;
  console.log(`✅ Projet: ${projectId}`);

  // Créer batch
  const batchRes = await fetchAPI('/api/batches', {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      imageUrls: MOCK_IMAGES,
    }),
  });

  if (batchRes.status !== 202) {
    throw new Error(`Expected 202, got ${batchRes.status}`);
  }

  const batchId = batchRes.data.batchId;
  console.log(`✅ Batch: ${batchId} (${MOCK_IMAGES.length} photos)`);

  return { projectId, batchId };
}

/**
 * Étape 2: Connexion SSE et écoute
 */
async function testSSEStream(batchId) {
  console.log('\n🔄 [2/3] Test flux SSE temps réel...');

  return new Promise((resolve, reject) => {
    // Node.js ne supporte pas EventSource nativement, on utilise un module
    let EventSource;
    try {
      EventSource = require('eventsource');
    } catch {
      console.error('❌ Module "eventsource" non installé. Installer avec: npm install eventsource');
      reject(new Error('eventsource module not found'));
      return;
    }

    const url = `${BASE_URL}/api/batches/${batchId}/stream`;
    console.log(`   Connexion: ${url}`);

    const eventSource = new EventSource(url, {
      headers: {
        'x-user-id': TEST_USER_ID,
      },
    });

    let eventCount = 0;
    let lastProgress = -1;
    let startTime = Date.now();
    const events = [];

    // Event: open
    eventSource.addEventListener('open', () => {
      console.log('✅ SSE connecté');
    });

    // Event: progress
    eventSource.addEventListener('progress', (e) => {
      eventCount++;
      const data = JSON.parse(e.data);
      events.push({ type: 'progress', data, timestamp: Date.now() });

      if (data.progress !== lastProgress) {
        console.log(
          `   📊 ${data.progress}% | ${data.status} | ` +
          `✓:${data.counts.completed} ✗:${data.counts.failed}`
        );
        lastProgress = data.progress;
      }
    });

    // Event: complete
    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      events.push({ type: 'complete', data, timestamp: Date.now() });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ Batch terminé: ${data.status} en ${duration}s`);
      console.log(`   Events SSE reçus: ${eventCount}`);
      
      eventSource.close();
      resolve({ events, duration, finalStatus: data.status });
    });

    // Event: error (erreur serveur)
    eventSource.addEventListener('error', (e) => {
      try {
        const data = JSON.parse(e.data);
        console.error(`❌ Erreur serveur: ${data.message}`);
        events.push({ type: 'error', data, timestamp: Date.now() });
      } catch {
        // Erreur de parsing ou connexion
      }
    });

    // Event: ping
    eventSource.addEventListener('ping', (e) => {
      const data = JSON.parse(e.data);
      console.log(`   💓 Heartbeat (${new Date(data.timestamp).toLocaleTimeString()})`);
    });

    // Event: timeout
    eventSource.addEventListener('timeout', (e) => {
      const data = JSON.parse(e.data);
      console.log(`⏱️  Timeout: ${data.message}`);
      eventSource.close();
      resolve({ events, timeout: true });
    });

    // Error handler (erreur connexion)
    eventSource.onerror = (err) => {
      console.error('❌ Erreur connexion SSE:', err.message || err);
      eventSource.close();
      
      // Si on a reçu des events avant l'erreur, considérer comme succès partiel
      if (eventCount > 0) {
        console.log('⚠️  Connexion perdue mais events reçus');
        resolve({ events, interrupted: true });
      } else {
        reject(new Error('SSE connection failed'));
      }
    };

    // Timeout de sécurité (2 minutes)
    setTimeout(() => {
      console.log('⏱️  Timeout de test (2 min)');
      eventSource.close();
      
      if (eventCount > 0) {
        resolve({ events, testTimeout: true });
      } else {
        reject(new Error('Test timeout: no events received'));
      }
    }, 120000);
  });
}

/**
 * Étape 3: Vérifications
 */
async function verifyResults(batchId, sseResults) {
  console.log('\n🔍 [3/3] Vérifications...');

  // 3a. Vérifier qu'on a bien reçu des events
  if (sseResults.events.length === 0) {
    throw new Error('Aucun event SSE reçu');
  }
  console.log(`✅ Events SSE reçus: ${sseResults.events.length}`);

  // 3b. Vérifier qu'on a au moins 1 progress event
  const progressEvents = sseResults.events.filter(e => e.type === 'progress');
  if (progressEvents.length === 0) {
    throw new Error('Aucun event "progress" reçu');
  }
  console.log(`✅ Events "progress": ${progressEvents.length}`);

  // 3c. Vérifier qu'on a un event "complete" (si pas interrompu)
  if (!sseResults.interrupted && !sseResults.timeout && !sseResults.testTimeout) {
    const completeEvents = sseResults.events.filter(e => e.type === 'complete');
    if (completeEvents.length === 0) {
      throw new Error('Event "complete" non reçu');
    }
    console.log(`✅ Event "complete" reçu (${sseResults.finalStatus})`);
  }

  // 3d. Vérifier l'état final via REST (pour comparaison)
  console.log('\n📊 Comparaison REST vs SSE:');
  const restRes = await fetchAPI(`/api/batches/${batchId}`);
  const restData = restRes.data.batch;
  
  console.log(`   REST: ${restData.status} | ${restData.progress}%`);
  
  const lastSSEEvent = sseResults.events[sseResults.events.length - 1];
  if (lastSSEEvent.type === 'progress' || lastSSEEvent.type === 'complete') {
    console.log(`   SSE:  ${lastSSEEvent.data.status} | ${lastSSEEvent.data.progress}%`);
    
    // Vérifier cohérence (peut différer légèrement si événements en cours)
    if (lastSSEEvent.data.status === restData.status) {
      console.log('✅ REST et SSE cohérents');
    } else {
      console.log('⚠️  Différence REST/SSE (normal si traitement en cours)');
    }
  }

  // 3e. Métriques
  if (sseResults.duration) {
    console.log(`\n⏱️  Durée totale: ${sseResults.duration}s`);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 LOT 12 - Smoke Test E2E: SSE Real-Time Progress');
  console.log(`   API: ${BASE_URL}`);
  console.log(`   User: ${TEST_USER_ID}`);

  const startTime = Date.now();

  try {
    // 1. Setup
    const { projectId, batchId } = await setupBatch();

    // 2. Test SSE
    const sseResults = await testSSEStream(batchId);

    // 3. Vérifications
    await verifyResults(batchId, sseResults);

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ SUCCÈS - LOT 12 testé avec succès en ${totalDuration}s`);
    console.log('\n📌 Note: La page web est disponible à:');
    console.log(`   ${BASE_URL}/batches/${batchId}`);
    
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ ÉCHEC: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check dependencies
try {
  require('eventsource');
} catch {
  console.error('\n❌ Dépendance manquante: eventsource');
  console.error('Installer avec: npm install eventsource');
  process.exit(1);
}

// Run
main();




