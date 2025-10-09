#!/usr/bin/env node
/**
 * LOT 15 - Test Export CSV/PDF
 * 
 * Vérifie que :
 * 1. Export CSV fonctionne (Content-Type: text/csv)
 * 2. Export PDF fonctionne (Content-Type: application/pdf)
 * 3. Mauvais format → 400
 * 4. Mauvais user → 403
 * 5. Batch inexistant → 404
 * 
 * Usage:
 *   node scripts/test-export-lot15.js
 */

const fs = require('fs');
const path = require('path');

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
  console.log(`${colors.cyan}[LOT15]${colors.reset} ${msg}`);
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
      name: 'Test LOT 15 - ' + Date.now(),
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
    const fakeImage = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xff, 0xd9
    ]);
    fs.writeFileSync(testImagePath, fakeImage);
  }

  const FormData = require('form-data');
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
 * Créer un batch avec une photo
 */
async function createBatch(projectId, photoId) {
  log('Création batch...');
  
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
 * Test 1: Export CSV
 */
async function testExportCSV(batchId) {
  log('\n📋 Test 1: Export CSV');
  
  const response = await fetchAPI(`/api/batches/${batchId}/export?format=csv`);
  
  if (response.status !== 200) {
    throw new Error(`Export CSV failed: ${response.status}`);
  }
  
  const contentType = response.headers.get('Content-Type');
  if (!contentType || !contentType.includes('text/csv')) {
    throw new Error(`Wrong Content-Type: ${contentType}`);
  }
  
  const contentDisposition = response.headers.get('Content-Disposition');
  if (!contentDisposition || !contentDisposition.includes('attachment')) {
    throw new Error(`Missing Content-Disposition: ${contentDisposition}`);
  }
  
  const csv = await response.text();
  
  if (csv.length === 0) {
    throw new Error('CSV is empty');
  }
  
  // Vérifier que le CSV contient les sections attendues
  if (!csv.includes('BATCH INFORMATION')) {
    throw new Error('CSV missing BATCH INFORMATION section');
  }
  
  if (!csv.includes('PHOTOS')) {
    throw new Error('CSV missing PHOTOS section');
  }
  
  success(`Export CSV OK (${csv.length} bytes)`);
  success(`Content-Type: ${contentType}`);
  success(`Content-Disposition: ${contentDisposition}`);
  
  // Sauvegarder le CSV pour inspection
  const csvPath = path.join(__dirname, `../test-export-${batchId}.csv`);
  fs.writeFileSync(csvPath, csv);
  log(`  → CSV sauvegardé: ${csvPath}`);
  
  return csv;
}

/**
 * Test 2: Export PDF
 */
async function testExportPDF(batchId) {
  log('\n📋 Test 2: Export PDF');
  
  const response = await fetchAPI(`/api/batches/${batchId}/export?format=pdf`);
  
  if (response.status !== 200) {
    throw new Error(`Export PDF failed: ${response.status}`);
  }
  
  const contentType = response.headers.get('Content-Type');
  if (!contentType || !contentType.includes('application/pdf')) {
    throw new Error(`Wrong Content-Type: ${contentType}`);
  }
  
  const contentDisposition = response.headers.get('Content-Disposition');
  if (!contentDisposition || !contentDisposition.includes('attachment')) {
    throw new Error(`Missing Content-Disposition: ${contentDisposition}`);
  }
  
  const pdf = await response.arrayBuffer();
  
  if (pdf.byteLength === 0) {
    throw new Error('PDF is empty');
  }
  
  // Vérifier le magic number PDF (%PDF)
  const pdfHeader = Buffer.from(pdf.slice(0, 4)).toString();
  if (!pdfHeader.startsWith('%PDF')) {
    throw new Error(`Invalid PDF header: ${pdfHeader}`);
  }
  
  success(`Export PDF OK (${pdf.byteLength} bytes)`);
  success(`Content-Type: ${contentType}`);
  success(`Content-Disposition: ${contentDisposition}`);
  
  // Sauvegarder le PDF pour inspection
  const pdfPath = path.join(__dirname, `../test-export-${batchId}.pdf`);
  fs.writeFileSync(pdfPath, Buffer.from(pdf));
  log(`  → PDF sauvegardé: ${pdfPath}`);
  
  return pdf;
}

/**
 * Test 3: Format invalide → 400
 */
async function testInvalidFormat(batchId) {
  log('\n📋 Test 3: Format invalide');
  
  const response = await fetchAPI(`/api/batches/${batchId}/export?format=xml`);
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.error || data.code !== 'INVALID_FORMAT') {
    throw new Error(`Wrong error response: ${JSON.stringify(data)}`);
  }
  
  success('Format invalide → 400 (OK)');
  success(`Error: ${data.error}`);
}

/**
 * Test 4: Format manquant → 400
 */
async function testMissingFormat(batchId) {
  log('\n📋 Test 4: Format manquant');
  
  const response = await fetchAPI(`/api/batches/${batchId}/export`);
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  success('Format manquant → 400 (OK)');
}

/**
 * Test 5: Batch inexistant → 404
 */
async function testBatchNotFound() {
  log('\n📋 Test 5: Batch inexistant');
  
  const fakeBatchId = 'fake-batch-' + Date.now();
  const response = await fetchAPI(`/api/batches/${fakeBatchId}/export?format=csv`);
  
  if (response.status !== 404) {
    throw new Error(`Expected 404, got ${response.status}`);
  }
  
  success('Batch inexistant → 404 (OK)');
}

/**
 * Test 6: Mauvais user → 403
 */
async function testUnauthorizedUser(batchId) {
  log('\n📋 Test 6: Mauvais utilisateur');
  
  const response = await fetch(`${API_BASE_URL}/api/batches/${batchId}/export?format=csv`, {
    headers: {
      'x-user-id': 'wrong-user-123',
    },
  });
  
  if (response.status !== 403) {
    throw new Error(`Expected 403, got ${response.status}`);
  }
  
  success('Mauvais user → 403 (OK)');
}

/**
 * Main test
 */
async function runTests() {
  console.log('\n' + colors.blue + '═'.repeat(60) + colors.reset);
  console.log(colors.blue + '  LOT 15 - Export Batch CSV/PDF - Tests' + colors.reset);
  console.log(colors.blue + '═'.repeat(60) + colors.reset + '\n');
  
  try {
    // Préparer les données
    log('📦 Préparation des données...\n');
    const project = await createProject();
    const photo = await uploadPhoto(project.id);
    const batchId = await createBatch(project.id, photo.id);
    
    // Attendre un peu pour que le batch soit bien créé
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Tests d'export
    await testExportCSV(batchId);
    await testExportPDF(batchId);
    await testInvalidFormat(batchId);
    await testMissingFormat(batchId);
    await testBatchNotFound();
    await testUnauthorizedUser(batchId);
    
    // Résumé
    console.log('\n' + colors.green + '═'.repeat(60) + colors.reset);
    console.log(colors.green + '  ✅ LOT 15 - Tous les tests réussis' + colors.reset);
    console.log(colors.green + '═'.repeat(60) + colors.reset);
    console.log('\n📊 Résultats:');
    console.log('  ✅ Export CSV fonctionne');
    console.log('  ✅ Export PDF fonctionne');
    console.log('  ✅ Format invalide → 400');
    console.log('  ✅ Format manquant → 400');
    console.log('  ✅ Batch inexistant → 404');
    console.log('  ✅ Mauvais user → 403');
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



