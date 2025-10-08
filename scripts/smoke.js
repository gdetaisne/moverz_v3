#!/usr/bin/env node
// Smoke tests API - Tests rapides des endpoints critiques
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const REPORT_FILE = path.join(__dirname, '..', 'reports', 'smoke-results.json');

async function makeRequest(url, options = {}) {
  const startTime = Date.now();
  try {
    const response = await fetch(url, options);
    const latency = Date.now() - startTime;
    const data = await response.text();
    
    return {
      success: true,
      status: response.status,
      latency,
      body: data.substring(0, 200), // Truncate for report
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      latency: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function runSmokeTests() {
  console.log('🔥 Running API Smoke Tests...\n');
  
  const results = [];
  let passed = 0;
  let failed = 0;

  // Test 1: GET /api/ai-status
  console.log('1️⃣  GET /api/ai-status');
  const test1 = await makeRequest(`${BASE_URL}/api/ai-status`);
  const test1Pass = test1.success && test1.status === 200;
  results.push({ test: 'GET /api/ai-status', expected: 200, ...test1, pass: test1Pass });
  test1Pass ? passed++ : failed++;
  console.log(`   ${test1Pass ? '✅' : '❌'} Status: ${test1.status}, Latency: ${test1.latency}ms\n`);

  // Test 2: POST /api/rooms
  console.log('2️⃣  POST /api/rooms');
  const test2 = await makeRequest(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'smoke-test-user',
    },
    body: JSON.stringify({ name: 'Test Room', roomType: 'salon' }),
  });
  const test2Pass = test2.success && test2.status === 201;
  results.push({ test: 'POST /api/rooms', expected: 201, ...test2, pass: test2Pass });
  test2Pass ? passed++ : failed++;
  console.log(`   ${test2Pass ? '✅' : '❌'} Status: ${test2.status}, Latency: ${test2.latency}ms\n`);

  // Test 3: GET /api/room-groups
  console.log('3️⃣  GET /api/room-groups?userId=smoke-test-user');
  const test3 = await makeRequest(`${BASE_URL}/api/room-groups?userId=smoke-test-user`);
  const test3Pass = test3.success && test3.status === 200;
  results.push({ test: 'GET /api/room-groups', expected: 200, ...test3, pass: test3Pass });
  test3Pass ? passed++ : failed++;
  console.log(`   ${test3Pass ? '✅' : '❌'} Status: ${test3.status}, Latency: ${test3.latency}ms\n`);

  // Test 4: POST /api/user-modifications (validation error expected)
  console.log('4️⃣  POST /api/user-modifications (invalid payload)');
  const test4 = await makeRequest(`${BASE_URL}/api/user-modifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const test4Pass = test4.success && test4.status === 400;
  results.push({ test: 'POST /api/user-modifications', expected: 400, ...test4, pass: test4Pass });
  test4Pass ? passed++ : failed++;
  console.log(`   ${test4Pass ? '✅' : '❌'} Status: ${test4.status}, Latency: ${test4.latency}ms\n`);

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Results: ${passed}/${passed + failed} passed`);
  console.log(`⏱️  Total time: ${results.reduce((sum, r) => sum + r.latency, 0)}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    passed,
    failed,
    total: passed + failed,
    results,
  };

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`✅ Report saved to: ${REPORT_FILE}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

runSmokeTests().catch(error => {
  console.error('❌ Smoke tests failed:', error);
  process.exit(1);
});
