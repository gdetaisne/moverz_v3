#!/usr/bin/env node

/**
 * Smoke test pour LOT 18.1 - Monitoring Lite
 * 
 * 1. Insère des métriques factices (AiMetric, Batch)
 * 2. Appelle les endpoints /api/admin/metrics/*
 * 3. Affiche les résultats
 * 
 * Usage:
 *   ADMIN_BYPASS_TOKEN=test node scripts/smoke-metrics.js
 */

const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const ADMIN_TOKEN = process.env.ADMIN_BYPASS_TOKEN || 'test-token-metrics';

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Insère des métriques A/B factices
 */
async function insertFakeAiMetrics() {
  log('cyan', '\n🧪 Insertion de métriques A/B factices...');
  
  const now = new Date();
  const metrics = [];

  // Variante A - 90 metrics
  for (let i = 0; i < 90; i++) {
    const ts = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    metrics.push({
      ts,
      provider: i % 2 === 0 ? 'openai' : 'anthropic',
      model: i % 2 === 0 ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022',
      operation: 'room_classify',
      latencyMs: Math.floor(Math.random() * 200) + 50,
      success: Math.random() > 0.05, // 95% success
      errorType: Math.random() > 0.95 ? 'TIMEOUT' : null,
      tokensIn: 100,
      tokensOut: 50,
      costUsd: 0.001,
      meta: {
        variant: 'A',
        roomType: ['salon', 'chambre', 'cuisine'][Math.floor(Math.random() * 3)],
      },
    });
  }

  // Variante B - 10 metrics
  for (let i = 0; i < 10; i++) {
    const ts = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    metrics.push({
      ts,
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      operation: 'room_classify',
      latencyMs: Math.floor(Math.random() * 1500) + 800,
      success: Math.random() > 0.08, // 92% success
      errorType: Math.random() > 0.92 ? 'PROVIDER_ERROR' : null,
      tokensIn: 120,
      tokensOut: 60,
      costUsd: 0.002,
      meta: {
        variant: 'B',
        roomType: ['salon', 'chambre', 'cuisine'][Math.floor(Math.random() * 3)],
        errorCode: Math.random() > 0.92 ? 'AI_ERROR' : undefined,
      },
    });
  }

  await prisma.aiMetric.createMany({ data: metrics });
  log('green', `✅ ${metrics.length} métriques insérées`);
}

/**
 * Insère des batches factices
 */
async function insertFakeBatches() {
  log('cyan', '\n🧪 Insertion de batches factices...');

  // Créer un user et projet de test
  const user = await prisma.user.upsert({
    where: { id: 'smoke-test-user' },
    create: { id: 'smoke-test-user', email: 'smoke@test.local' },
    update: {},
  });

  const project = await prisma.project.upsert({
    where: { 
      userId_name: {
        userId: user.id,
        name: 'Smoke Test Project',
      },
    },
    create: {
      id: 'smoke-test-project',
      name: 'Smoke Test Project',
      userId: user.id,
    },
    update: {},
  });

  const now = new Date();
  const batches = [];

  // 10 batches sur 7 jours
  for (let i = 0; i < 10; i++) {
    const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const status = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PARTIAL', 'FAILED'][Math.floor(Math.random() * 5)];
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000);

    batches.push({
      id: `smoke-batch-${i}`,
      projectId: project.id,
      userId: user.id,
      status,
      countsQueued: 5,
      countsProcessing: 0,
      countsCompleted: status === 'COMPLETED' ? 5 : status === 'PARTIAL' ? 3 : 0,
      countsFailed: status === 'FAILED' ? 5 : status === 'PARTIAL' ? 2 : 0,
      createdAt,
      updatedAt,
    });
  }

  for (const batch of batches) {
    await prisma.batch.upsert({
      where: { id: batch.id },
      create: batch,
      update: batch,
    });
  }

  log('green', `✅ ${batches.length} batches insérés`);
}

/**
 * Test endpoint API
 */
async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = new URL(path, API_BASE);
    
    log('blue', `\n📡 Test: ${description}`);
    log('gray', `   ${url.toString()}`);

    const req = http.get(url, {
      headers: {
        'x-admin-token': ADMIN_TOKEN,
      },
    }, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            log('red', `   ❌ Status ${res.statusCode}`);
            resolve(false);
            return;
          }

          const json = JSON.parse(data);
          
          if (json.success === false) {
            log('red', `   ❌ Erreur API: ${json.message || json.error}`);
            resolve(false);
            return;
          }

          log('green', `   ✅ OK (${res.statusCode})`);
          
          // Afficher un résumé
          if (json.data) {
            if (Array.isArray(json.data)) {
              log('gray', `   📊 ${json.data.length} enregistrements`);
              if (json.data[0]) {
                log('gray', `   Exemple: ${JSON.stringify(json.data[0]).substring(0, 100)}...`);
              }
            } else {
              log('gray', `   📊 ${JSON.stringify(json.data).substring(0, 150)}...`);
            }
          }

          if (json.queues) {
            log('gray', `   📊 ${json.queues.length} queues, disponible: ${json.available}`);
          }

          resolve(true);
        } catch (error) {
          log('red', `   ❌ Erreur parsing JSON: ${error.message}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log('red', `   ❌ Erreur requête: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      log('red', '   ❌ Timeout');
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Cleanup des données de test
 */
async function cleanup() {
  log('cyan', '\n🧹 Nettoyage des données de test...');
  
  try {
    await prisma.aiMetric.deleteMany({
      where: {
        meta: {
          path: ['variant'],
          not: undefined,
        },
      },
    });

    await prisma.batch.deleteMany({
      where: {
        id: {
          startsWith: 'smoke-batch-',
        },
      },
    });

    await prisma.project.deleteMany({
      where: {
        id: 'smoke-test-project',
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: 'smoke-test-user',
      },
    });

    log('green', '✅ Nettoyage terminé');
  } catch (error) {
    log('yellow', `⚠️  Erreur nettoyage: ${error.message}`);
  }
}

/**
 * Exécution du smoke test
 */
async function main() {
  log('cyan', '\n' + '='.repeat(60));
  log('cyan', '🚀 Smoke Test LOT 18.1 - Monitoring Lite');
  log('cyan', '='.repeat(60));

  log('gray', `\nConfiguration:`);
  log('gray', `  API Base: ${API_BASE}`);
  log('gray', `  Admin Token: ${ADMIN_TOKEN.substring(0, 10)}...`);

  try {
    // 1. Insérer des données factices
    await insertFakeAiMetrics();
    await insertFakeBatches();

    // 2. Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Tester les endpoints
    const results = await Promise.all([
      testEndpoint('/api/admin/metrics/ab-daily?summary=true', 'A/B Daily Summary'),
      testEndpoint('/api/admin/metrics/ab-daily?days=7', 'A/B Daily Détails (7j)'),
      testEndpoint('/api/admin/metrics/batches?summary=true', 'Batches Summary'),
      testEndpoint('/api/admin/metrics/batches?days=7', 'Batches Détails (7j)'),
      testEndpoint('/api/admin/metrics/queues', 'Queues Snapshot'),
    ]);

    // 4. Cleanup
    await cleanup();

    // Résultats
    const passed = results.filter(r => r).length;
    const total = results.length;

    log('cyan', '\n' + '='.repeat(60));
    if (passed === total) {
      log('green', `✅ Tous les tests passés (${passed}/${total})`);
      log('cyan', '='.repeat(60));
      log('gray', '\n💡 Accédez au dashboard: http://localhost:3001/admin/metrics');
      log('gray', `   Token: ${ADMIN_TOKEN}`);
      process.exit(0);
    } else {
      log('red', `❌ ${total - passed} test(s) échoué(s) sur ${total}`);
      log('cyan', '='.repeat(60));
      process.exit(1);
    }
  } catch (error) {
    log('red', `\n❌ Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le test
main();


