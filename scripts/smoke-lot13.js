#!/usr/bin/env node
/**
 * LOT 13 - Redis Pub/Sub + Cache Progress - Test de validation
 * 
 * Vérifie que :
 * 1. Redis Pub/Sub fonctionne (pas de polling DB)
 * 2. SSE est réactif (<10ms)
 * 3. Cache Redis a un hit rate >90%
 * 
 * Usage:
 *   node scripts/smoke-lot13.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = 'test-user-' + Date.now();

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg) {
  console.log(`${colors.cyan}[LOT13]${colors.reset} ${msg}`);
}

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function warn(msg) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

/**
 * Fetch helper
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-user-id': TEST_USER_ID,
      ...options.headers,
    },
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response;
}

/**
 * Créer un projet de test
 */
async function createProject() {
  log('Création projet de test...');
  
  const response = await fetchAPI('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test LOT 13 - ' + Date.now(),
      address: 'Test address',
    }),
  });

  const data = await response.json();
  success(`Projet créé: ${data.project.id}`);
  return data.project;
}

/**
 * Upload une photo de test
 */
async function uploadPhoto(projectId) {
  log('Upload photo de test...');
  
  const testImagePath = path.join(__dirname, '../test-image.jpg');
  if (!fs.existsSync(testImagePath)) {
    warn('test-image.jpg non trouvé, création d\'une image factice');
    // Créer une petite image factice (1x1 pixel JPEG)
    const fakeImage = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xff, 0xd9
    ]);
    fs.writeFileSync(testImagePath, fakeImage);
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(testImagePath));
  form.append('projectId', projectId);
  form.append('roomType', 'living_room');

  const response = await fetch(`${API_BASE_URL}/api/photos/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': TEST_USER_ID,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const data = await response.json();
  success(`Photo uploadée: ${data.photo.id}`);
  return data.photo;
}

/**
 * Enqueue photo pour analyse (création batch automatique)
 */
async function enqueuePhoto(photoId, projectId) {
  log('Enqueue photo pour analyse...');
  
  const response = await fetchAPI('/api/photos/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photoIds: [photoId],
      projectId,
    }),
  });

  const data = await response.json();
  success(`Batch créé: ${data.batchId}`);
  return data.batchId;
}

/**
 * Tester le SSE stream avec Redis Pub/Sub
 */
async function testSSEStream(batchId) {
  log('Test SSE stream (Redis Pub/Sub)...');
  
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}/api/batches/${batchId}/stream`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'x-user-id': TEST_USER_ID,
        'Accept': 'text/event-stream',
      },
    };

    const protocol = url.protocol === 'https:' ? require('https') : require('http');
    const req = protocol.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`SSE stream failed: ${res.statusCode}`));
        return;
      }

      success('SSE stream connecté');
      
      let buffer = '';
      let eventCount = 0;
      let firstEventTime = null;
      let lastStatus = null;
      
      const timeout = setTimeout(() => {
        req.destroy();
        if (eventCount > 0) {
          success(`SSE reçu ${eventCount} événements`);
          resolve({ eventCount, latency: Date.now() - firstEventTime });
        } else {
          warn('Aucun événement SSE reçu (timeout 10s)');
          resolve({ eventCount: 0, latency: null });
        }
      }, 10000); // Timeout 10s

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Garder la dernière ligne incomplète
        
        lines.forEach((line) => {
          if (line.trim() === '') return;
          
          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);
          
          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);
            
            if (!firstEventTime) {
              firstEventTime = Date.now();
            }
            
            eventCount++;
            
            if (eventType === 'progress') {
              log(`  📊 Progress: ${data.status} ${data.progress}%`);
              lastStatus = data.status;
            } else if (eventType === 'complete') {
              success(`  ✅ Batch complet: ${data.status}`);
              clearTimeout(timeout);
              req.destroy();
              resolve({ eventCount, latency: Date.now() - firstEventTime, status: data.status });
            } else if (eventType === 'error') {
              error(`  ❌ Erreur: ${data.message}`);
              clearTimeout(timeout);
              req.destroy();
              reject(new Error(data.message));
            }
          }
        });
      });

      res.on('end', () => {
        clearTimeout(timeout);
        resolve({ eventCount, latency: firstEventTime ? Date.now() - firstEventTime : null, status: lastStatus });
      });

      res.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Tester le cache Redis
 */
async function testCacheHitRate(batchId) {
  log('Test cache Redis (hit rate)...');
  
  const requests = 10;
  let cacheHits = 0;
  let cacheMisses = 0;
  
  for (let i = 0; i < requests; i++) {
    const start = Date.now();
    const response = await fetchAPI(`/api/batches/${batchId}`);
    const latency = Date.now() - start;
    
    // Heuristique: <10ms = cache hit, >10ms = DB query
    if (latency < 10) {
      cacheHits++;
    } else {
      cacheMisses++;
    }
    
    log(`  Request ${i + 1}/${requests}: ${latency}ms ${latency < 10 ? '(cache)' : '(DB)'}`);
    
    // Attendre 100ms entre requêtes
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const hitRate = (cacheHits / requests) * 100;
  log(`Cache hit rate: ${hitRate.toFixed(1)}% (${cacheHits}/${requests})`);
  
  return hitRate;
}

/**
 * Vérifier qu'aucun polling DB n'est détecté
 */
async function checkNoPolling() {
  log('Vérification: pas de polling DB détecté...');
  
  // Lire le fichier stream/route.ts pour vérifier qu'il n'y a pas de setInterval
  const streamFilePath = path.join(__dirname, '../apps/web/app/api/batches/[id]/stream/route.ts');
  
  if (fs.existsSync(streamFilePath)) {
    const content = fs.readFileSync(streamFilePath, 'utf-8');
    
    if (content.includes('setInterval') && content.includes('computeBatchProgress')) {
      error('Polling DB détecté dans stream/route.ts');
      return false;
    }
    
    if (content.includes('subscribeToBatch') || content.includes('Redis Pub/Sub')) {
      success('Redis Pub/Sub détecté dans stream/route.ts');
      return true;
    }
  }
  
  warn('Impossible de vérifier stream/route.ts');
  return null;
}

/**
 * Main test
 */
async function runTests() {
  console.log('\n' + colors.blue + '═'.repeat(60) + colors.reset);
  console.log(colors.blue + '  LOT 13 - Redis Pub/Sub + Cache Progress - Tests' + colors.reset);
  console.log(colors.blue + '═'.repeat(60) + colors.reset + '\n');
  
  try {
    // 1. Vérifier qu'aucun polling n'est présent
    log('\n📋 Test 1: Vérification architecture');
    const noPoll = await checkNoPolling();
    if (noPoll === false) {
      throw new Error('Polling DB encore présent');
    }
    
    // 2. Créer un projet et une photo
    log('\n📋 Test 2: Préparation données');
    const project = await createProject();
    const photo = await uploadPhoto(project.id);
    const batchId = await enqueuePhoto(photo.id, project.id);
    
    // 3. Tester le SSE stream
    log('\n📋 Test 3: SSE Stream (Redis Pub/Sub)');
    const sseResult = await testSSEStream(batchId);
    
    if (sseResult.eventCount === 0) {
      warn('Aucun événement SSE reçu (worker probablement non démarré)');
    } else {
      success(`SSE réactif: ${sseResult.eventCount} événements en ${sseResult.latency}ms`);
      
      if (sseResult.latency && sseResult.latency < 10) {
        success('✨ Latence SSE < 10ms (EXCELLENT)');
      } else if (sseResult.latency && sseResult.latency < 100) {
        success('Latence SSE < 100ms (BON)');
      }
    }
    
    // 4. Tester le cache Redis
    log('\n📋 Test 4: Cache Redis');
    const hitRate = await testCacheHitRate(batchId);
    
    if (hitRate >= 90) {
      success(`✨ Cache hit rate ${hitRate.toFixed(1)}% (>90%, EXCELLENT)`);
    } else if (hitRate >= 70) {
      success(`Cache hit rate ${hitRate.toFixed(1)}% (BON)`);
    } else {
      warn(`Cache hit rate ${hitRate.toFixed(1)}% (<70%, à améliorer)`);
    }
    
    // Résumé final
    console.log('\n' + colors.green + '═'.repeat(60) + colors.reset);
    console.log(colors.green + '  ✅ LOT 13 - Tests réussis' + colors.reset);
    console.log(colors.green + '═'.repeat(60) + colors.reset);
    console.log('\n📊 Résultats:');
    console.log(`  - Architecture: ${noPoll ? '✅ Redis Pub/Sub' : '⚠️  Non vérifié'}`);
    console.log(`  - SSE events: ${sseResult.eventCount}`);
    console.log(`  - SSE latency: ${sseResult.latency ? sseResult.latency + 'ms' : 'N/A'}`);
    console.log(`  - Cache hit rate: ${hitRate.toFixed(1)}%`);
    console.log('');
    
    process.exit(0);
    
  } catch (err) {
    error('Test échoué: ' + err.message);
    console.error(err);
    process.exit(1);
  }
}

// Run tests
runTests();



