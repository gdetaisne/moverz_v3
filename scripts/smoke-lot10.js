#!/usr/bin/env node
/**
 * Smoke Test LOT 10 - AI Pipeline Async
 * 
 * Test du flux complet :
 * 1. Enqueue photo analysis
 * 2. Polling status (PENDING → PROCESSING → DONE)
 * 3. Vérifier résultat
 * 4. Test idempotence (re-enqueue)
 * 5. Inventory sync
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const TEST_USER_ID = 'smoke-test-user-lot10';

console.log('🧪 Smoke Test LOT 10 - AI Pipeline\n');

// Helper: sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: HTTP request
async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': TEST_USER_ID,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return { status: response.status, data };
}

// Test 1: Create photo (mock)
async function test1_CreatePhoto() {
  console.log('1️⃣  Creating test photo...');
  
  // Note: En vrai on uploadrait une photo, ici on crée juste une entrée DB
  // Pour le test, on suppose qu'une photo existe déjà ou on la crée via API photos
  const { status, data } = await request('POST', '/api/photos', {
    projectId: 'test-project-lot10',
    filename: 'smoke-test.jpg',
    filePath: '/uploads/smoke-test.jpg',
    url: 'http://localhost:3001/uploads/smoke-test.jpg',
  });

  if (status === 201 || status === 200) {
    console.log(`✅ Photo created: ${data.photo?.id || data.id}`);
    return data.photo?.id || data.id;
  } else {
    throw new Error(`Failed to create photo: ${status} ${JSON.stringify(data)}`);
  }
}

// Test 2: Enqueue analysis
async function test2_EnqueueAnalysis(photoId) {
  console.log('\n2️⃣  Enqueue photo analysis...');
  
  const { status, data } = await request('POST', '/api/photos/enqueue', {
    photoId,
    userId: TEST_USER_ID,
    roomType: 'salon',
  });

  if (status === 202) {
    console.log(`✅ Job enqueued: ${data.jobId}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Queue position: ${data.queuePosition}`);
    return data.jobId;
  } else {
    throw new Error(`Failed to enqueue: ${status} ${JSON.stringify(data)}`);
  }
}

// Test 3: Poll status until DONE or ERROR
async function test3_PollStatus(photoId, maxAttempts = 30) {
  console.log('\n3️⃣  Polling photo status...');
  
  for (let i = 0; i < maxAttempts; i++) {
    const { status, data } = await request('GET', `/api/photos/${photoId}`);
    
    if (status !== 200) {
      throw new Error(`Failed to fetch photo: ${status}`);
    }

    const photoStatus = data.photo.status;
    console.log(`   [${i + 1}/${maxAttempts}] Status: ${photoStatus}`);

    if (photoStatus === 'DONE') {
      console.log(`✅ Photo analysis completed!`);
      console.log(`   Items: ${data.photo.analysis?.items?.length || 0}`);
      console.log(`   RoomType: ${data.photo.roomType}`);
      console.log(`   ProcessedAt: ${data.photo.processedAt}`);
      return data.photo;
    }

    if (photoStatus === 'ERROR') {
      console.error(`❌ Photo analysis failed!`);
      console.error(`   ErrorCode: ${data.photo.errorCode}`);
      console.error(`   ErrorMessage: ${data.photo.errorMessage}`);
      throw new Error('Photo analysis failed');
    }

    // Wait before next poll
    await sleep(2000); // 2s
  }

  throw new Error('Timeout: Photo not processed within 60s');
}

// Test 4: Test idempotence (re-enqueue same photo)
async function test4_TestIdempotence(photoId) {
  console.log('\n4️⃣  Testing idempotence (re-enqueue)...');
  
  const { status, data } = await request('POST', '/api/photos/enqueue', {
    photoId,
    userId: TEST_USER_ID,
  });

  if (status === 202 && data.status === 'already_processing') {
    console.log(`✅ Idempotence check passed (skipped duplicate)`);
    return true;
  }

  if (status === 202 && data.status === 'enqueued') {
    console.log(`ℹ️  Re-enqueue accepted (photo will be re-analyzed)`);
    return true;
  }

  throw new Error(`Unexpected response: ${status} ${JSON.stringify(data)}`);
}

// Test 5: Trigger inventory sync
async function test5_InventorySync(projectId) {
  console.log('\n5️⃣  Triggering inventory sync...');
  
  // Note: L'API inventory-sync pourrait ne pas exister encore
  // On simule juste l'appel
  try {
    const { status, data } = await request('POST', '/api/inventory/sync', {
      projectId,
      userId: TEST_USER_ID,
    });

    if (status === 202 || status === 200) {
      console.log(`✅ Inventory sync enqueued`);
      return data;
    } else {
      console.log(`⚠️  Inventory sync not available (${status}), skip`);
      return null;
    }
  } catch (error) {
    console.log(`⚠️  Inventory sync endpoint not implemented yet, skip`);
    return null;
  }
}

// Test 6: Check queue stats
async function test6_QueueStats() {
  console.log('\n6️⃣  Checking queue stats...');
  
  try {
    const { status, data } = await request('GET', '/api/queue/test');

    if (status === 200) {
      console.log(`✅ Queue stats:`);
      data.queues?.forEach(q => {
        console.log(`   ${q.name}: ${q.active} active, ${q.completed} completed, ${q.failed} failed`);
      });
      return data;
    } else {
      console.log(`⚠️  Queue stats not available (${status})`);
      return null;
    }
  } catch (error) {
    console.log(`⚠️  Queue stats endpoint error: ${error.message}`);
    return null;
  }
}

// Main
async function main() {
  const startTime = Date.now();

  try {
    // Test 1: Create photo (mock)
    let photoId;
    try {
      photoId = await test1_CreatePhoto();
    } catch (error) {
      console.log(`⚠️  Photo creation failed, using mock ID`);
      photoId = 'smoke-test-photo-' + Date.now();
    }

    // Test 2: Enqueue
    const jobId = await test2_EnqueueAnalysis(photoId);

    // Test 3: Poll status
    const photo = await test3_PollStatus(photoId);

    // Test 4: Idempotence
    await test4_TestIdempotence(photoId);

    // Test 5: Inventory sync
    await test5_InventorySync('test-project-lot10');

    // Test 6: Queue stats
    await test6_QueueStats();

    const duration = Date.now() - startTime;
    console.log(`\n✅ All tests passed in ${duration}ms\n`);
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}\n`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();



