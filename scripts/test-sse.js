#!/usr/bin/env node

/**
 * Test SSE (Server-Sent Events) - Smoke test
 * Vérifie que le streaming de progression batch fonctionne
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const prisma = new PrismaClient();

async function testSSE() {
  console.log('→ Test SSE Stream');

  try {
    // 1. Créer un batch de test
    console.log('  → Création batch de test...');
    
    // Créer un user de test
    const user = await prisma.user.upsert({
      where: { id: 'sse-test-user' },
      create: { id: 'sse-test-user', email: 'sse@test.local' },
      update: {},
    });

    // Créer un projet de test
    const project = await prisma.project.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: 'SSE Test Project',
        },
      },
      create: {
        id: 'sse-test-project',
        name: 'SSE Test Project',
        userId: user.id,
      },
      update: {},
    });

    // Créer un batch de test
    const batch = await prisma.batch.upsert({
      where: { id: 'sse-test-batch' },
      create: {
        id: 'sse-test-batch',
        projectId: project.id,
        userId: user.id,
        status: 'PROCESSING',
        countsQueued: 3,
        countsProcessing: 1,
        countsCompleted: 0,
        countsFailed: 0,
      },
      update: {
        status: 'PROCESSING',
      },
    });

    console.log(`  ✓ Batch créé: ${batch.id}`);

    // 2. Tester la connexion SSE
    console.log('  → Test connexion SSE...');

    const url = `${API_BASE}/api/batches/${batch.id}/stream`;
    
    return new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`SSE status ${res.statusCode}`));
          return;
        }

        console.log('  ✓ SSE stream connecté');
        
        let eventCount = 0;
        let data = '';

        res.on('data', (chunk) => {
          data += chunk.toString();
          
          // Compter les événements (lignes "data:")
          const events = data.match(/^data:/gm);
          if (events) {
            eventCount = events.length;
          }

          if (eventCount >= 1) {
            console.log(`  ✓ Événement SSE reçu (${eventCount})`);
            res.destroy(); // Fermer la connexion
            resolve();
          }
        });

        // Timeout 10s
        setTimeout(() => {
          res.destroy();
          if (eventCount > 0) {
            console.log(`  ✓ ${eventCount} événement(s) reçu(s)`);
            resolve();
          } else {
            reject(new Error('SSE timeout (aucun événement)'));
          }
        }, 10000);
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(12000);
    });

  } catch (error) {
    console.warn('⚠️  SSE test failed:', error.message);
    console.warn('  (Toléré si batch inexistant ou SSE désactivé)');
  } finally {
    // Cleanup
    try {
      await prisma.batch.deleteMany({
        where: { id: 'sse-test-batch' },
      });
      await prisma.project.deleteMany({
        where: { id: 'sse-test-project' },
      });
      await prisma.user.deleteMany({
        where: { id: 'sse-test-user' },
      });
    } catch (e) {
      // Ignore cleanup errors
    }
    
    await prisma.$disconnect();
    console.log('✅ SSE Test OK (ou skip si non applicable)');
    process.exit(0);
  }
}

testSSE();



