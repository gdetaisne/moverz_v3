#!/usr/bin/env node
// BullMQ Workers - Background job processing
const { createPhotoAnalyzeWorker, createInventorySyncWorker, shutdownWorkers } = require('../packages/core/src/queue/worker');

console.log('🚀 Starting BullMQ workers...\n');

// Worker processors
const photoAnalyzeProcessor = async (job) => {
  console.log(`📸 [Photo Analyze] Processing job ${job.id}`);
  const { photoId, userId, assetId, roomType } = job.data;
  
  // Simulate AI analysis (replace with real engine call)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  return {
    photoId,
    items: [
      { name: 'Table', category: 'mobilier', dismountable: true },
      { name: 'Chaise', category: 'mobilier', dismountable: true },
    ],
    roomType: roomType || 'salon',
    confidence: 0.9,
  };
};

const inventorySyncProcessor = async (job) => {
  console.log(`📦 [Inventory Sync] Processing job ${job.id}`);
  const { projectId, userId } = job.data;
  
  // Simulate inventory aggregation
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  return {
    projectId,
    totalItems: 15,
    totalVolume: 25.5,
    rooms: ['salon', 'cuisine', 'chambre'],
  };
};

// Create workers
const photoWorker = createPhotoAnalyzeWorker(photoAnalyzeProcessor);
const inventoryWorker = createInventorySyncWorker(inventorySyncProcessor);

// Event listeners
photoWorker.on('completed', (job) => {
  console.log(`✅ [Photo Analyze] Job ${job.id} completed`);
});

photoWorker.on('failed', (job, err) => {
  console.error(`❌ [Photo Analyze] Job ${job?.id} failed:`, err.message);
});

inventoryWorker.on('completed', (job) => {
  console.log(`✅ [Inventory Sync] Job ${job.id} completed`);
});

inventoryWorker.on('failed', (job, err) => {
  console.error(`❌ [Inventory Sync] Job ${job?.id} failed:`, err.message);
});

console.log('✅ Workers started:');
console.log('   - photo-analyze (concurrency: 2)');
console.log('   - inventory-sync (concurrency: 2)');
console.log('\n⏳ Waiting for jobs...\n');

// Graceful shutdown
const workers = [photoWorker, inventoryWorker];

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  await shutdownWorkers(workers);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down...');
  await shutdownWorkers(workers);
  process.exit(0);
});
