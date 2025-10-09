#!/usr/bin/env node
// BullMQ Workers - Background job processing (LOT 10)
const { createPhotoAnalyzeWorker, createInventorySyncWorker, shutdownWorkers } = require('../packages/core/src/queue/worker');

console.log('🚀 Starting BullMQ workers (LOT 10 - AI Pipeline)...\n');

// Create workers (logic intégrée directement dans les workers)
const photoWorker = createPhotoAnalyzeWorker();
const inventoryWorker = createInventorySyncWorker();

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
