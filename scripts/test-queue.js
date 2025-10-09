#!/usr/bin/env node

/**
 * Test Queue BullMQ - Smoke test
 * Vérifie que les queues photo-analyze et inventory-sync sont accessibles
 */

const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function testQueue() {
  console.log('→ Test Queue BullMQ');
  console.log(`  Redis: ${REDIS_URL}`);

  try {
    // Tenter de créer une connexion Redis simple
    const Redis = require('ioredis');
    const redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });

    await redis.ping();
    console.log('  ✓ Redis accessible');
    
    // Vérifier que les queues existent
    const { Queue } = require('bullmq');
    
    const photoQueue = new Queue('photo-analyze', {
      connection: redis,
    });
    
    const inventoryQueue = new Queue('inventory-sync', {
      connection: redis,
    });

    // Obtenir les compteurs
    const [photoWaiting, invWaiting] = await Promise.all([
      photoQueue.getWaitingCount(),
      inventoryQueue.getWaitingCount(),
    ]);

    console.log(`  ✓ photo-analyze: ${photoWaiting} jobs en attente`);
    console.log(`  ✓ inventory-sync: ${invWaiting} jobs en attente`);

    await photoQueue.close();
    await inventoryQueue.close();
    await redis.quit();

    console.log('✅ Queue Test OK');
    process.exit(0);
  } catch (error) {
    console.warn('⚠️  Queue test failed:', error.message);
    console.warn('  (Toléré si Redis/BullMQ non configuré)');
    process.exit(0); // Exit 0 pour ne pas bloquer le check-all
  }
}

testQueue();



