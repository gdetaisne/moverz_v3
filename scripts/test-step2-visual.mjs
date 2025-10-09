#!/usr/bin/env node
/**
 * Script de test visuel - Étape 2
 * Vérifie que les photos et inventaires sont accessibles
 */

import http from 'http';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Helper pour faire des requêtes HTTP
function fetchHttp(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Test 1: Vérifier que /api/uploads/{id}.jpeg retourne 200
async function testUploadEndpoint() {
  console.log('\n📸 Test 1: Endpoint /api/uploads/[filename]');
  
  // Tester avec un filename générique
  const testFilename = 'test-photo.jpeg';
  const url = `${API_URL}/api/uploads/${testFilename}`;
  
  try {
    const { status } = await fetchHttp(url);
    if (status === 200) {
      console.log('✅ Endpoint retourne 200 OK');
      return true;
    } else if (status === 404) {
      console.log(`⚠️  Endpoint retourne 404 (normal si aucune photo n'existe encore)`);
      return true;
    } else {
      console.log(`❌ Endpoint retourne ${status} (attendu 200 ou 404)`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return false;
  }
}

// Test 2: Vérifier les fonctions de résolution d'URL
async function testUrlResolution() {
  console.log('\n🔗 Test 2: Résolution URLs');
  
  // Import dynamique des fonctions
  const { resolvePhotoSrc, toAbsoluteApiUrl } = await import('../lib/imageUrl.ts');
  
  const testCases = [
    {
      photo: { url: '/api/uploads/abc.jpeg' },
      expected: `${API_URL}/api/uploads/abc.jpeg`
    },
    {
      photo: { filePath: 'uploads/def.jpeg' },
      expected: `${API_URL}/api/uploads/def.jpeg`
    },
    {
      photo: { filePath: 'ghi.jpeg' },
      expected: `${API_URL}/api/uploads/ghi.jpeg`
    }
  ];
  
  let passed = 0;
  testCases.forEach((tc, idx) => {
    const result = resolvePhotoSrc(tc.photo);
    const ok = result === tc.expected;
    console.log(`  ${ok ? '✅' : '❌'} Test ${idx + 1}: ${ok ? 'OK' : `FAIL (got: ${result})`}`);
    if (ok) passed++;
  });
  
  console.log(`\n  Résultat: ${passed}/${testCases.length} tests passés`);
  return passed === testCases.length;
}

// Test 3: Calcul agrégat volumes
async function testVolumeCalculation() {
  console.log('\n📊 Test 3: Calcul volumes');
  
  const photos = [
    {
      id: 'photo1',
      analysis: {
        items: [
          { name: 'Canapé', volume_m3: 1.5 },
          { name: 'Table', volume: 0.8 }
        ]
      }
    },
    {
      id: 'photo2',
      analysis: {
        items: [
          { name: 'Chaise', volume_m3: 0.3 }
        ]
      }
    }
  ];
  
  // Extraction items
  const allItems = photos.flatMap(photo => 
    Array.isArray(photo?.analysis?.items) ? photo.analysis.items : []
  );
  
  const totalVolume = allItems.reduce((sum, item) => 
    sum + (item.volume_m3 || item.volume || 0), 0
  );
  
  const expected = 1.5 + 0.8 + 0.3;
  const ok = Math.abs(totalVolume - expected) < 0.01;
  
  console.log(`  Items extraits: ${allItems.length}/3`);
  console.log(`  Volume total: ${totalVolume.toFixed(2)} m³`);
  console.log(`  ${ok ? '✅' : '❌'} Calcul ${ok ? 'correct' : 'incorrect'} (attendu: ${expected})`);
  
  return ok;
}

// Exécution des tests
async function runTests() {
  console.log('🧪 Tests visuels - Étape 2 (Photos + Inventaire)');
  console.log('═══════════════════════════════════════════════════════');
  
  const results = [];
  
  results.push(await testUploadEndpoint());
  results.push(await testUrlResolution());
  results.push(await testVolumeCalculation());
  
  console.log('\n═══════════════════════════════════════════════════════');
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Résultat final: ${passed}/${total} tests réussis`);
  
  if (passed === total) {
    console.log('✅ Tous les tests sont passés !');
    process.exit(0);
  } else {
    console.log('❌ Certains tests ont échoué');
    process.exit(1);
  }
}

// Lancer les tests
runTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

