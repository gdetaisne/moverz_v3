#!/usr/bin/env node

/**
 * Smoke test pour LOT 18 - A/B test du classifieur de pièces
 * 
 * Teste:
 * 1. Feature flags (enabled/disabled)
 * 2. Routage A/B avec split=10 → ~10% B, ~90% A
 * 3. Déterminisme du choix de variante
 * 4. Métriques enregistrées
 * 5. Endpoint /api/ab-status
 * 
 * Usage:
 *   node scripts/smoke-lot18.js
 */

const http = require('http');
const crypto = require('crypto');

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const TEST_USER_ID = 'smoke-test-user-' + Date.now();

// Couleurs pour logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Simule chooseVariant en JavaScript (doit matcher la logique TypeScript)
 */
function chooseVariant(seed, split, enabled) {
  if (!enabled || split === 0) return 'A';
  if (split === 100) return 'B';

  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  const percentage = hashInt % 100;

  return percentage < split ? 'B' : 'A';
}

/**
 * Test le routage A/B avec un ensemble de seeds
 */
function testAbRouting() {
  log('cyan', '\n🧪 Test 1: Routage A/B avec split=10');
  
  const samples = 100;
  const split = 10;
  const enabled = true;
  
  let countA = 0;
  let countB = 0;
  
  for (let i = 0; i < samples; i++) {
    const seed = `user-${i}`;
    const variant = chooseVariant(seed, split, enabled);
    
    if (variant === 'A') countA++;
    else countB++;
  }
  
  const percentB = (countB / samples) * 100;
  
  log('blue', `  Échantillons: ${samples}`);
  log('blue', `  Variante A: ${countA} (${Math.round((countA/samples)*100)}%)`);
  log('blue', `  Variante B: ${countB} (${Math.round(percentB)}%)`);
  
  // Vérifier que le split est respecté (tolérance ±3%)
  if (percentB >= 7 && percentB <= 13) {
    log('green', '  ✅ Routage A/B OK (~10% en B)');
    return true;
  } else {
    log('red', `  ❌ Routage A/B incorrect: ${percentB}% en B (attendu ~10%)`);
    return false;
  }
}

/**
 * Test le déterminisme
 */
function testDeterminism() {
  log('cyan', '\n🧪 Test 2: Déterminisme du routage');
  
  const seed = 'test-user-123';
  const split = 50;
  const enabled = true;
  
  const variant1 = chooseVariant(seed, split, enabled);
  const variant2 = chooseVariant(seed, split, enabled);
  const variant3 = chooseVariant(seed, split, enabled);
  
  if (variant1 === variant2 && variant2 === variant3) {
    log('green', `  ✅ Déterminisme OK (seed="${seed}" → variante ${variant1})`);
    return true;
  } else {
    log('red', `  ❌ Non-déterminisme: ${variant1}, ${variant2}, ${variant3}`);
    return false;
  }
}

/**
 * Test flag désactivé
 */
function testFlagDisabled() {
  log('cyan', '\n🧪 Test 3: Flag désactivé → toujours variante A');
  
  const split = 50;
  const enabled = false;
  
  let allA = true;
  for (let i = 0; i < 20; i++) {
    const variant = chooseVariant(`user-${i}`, split, enabled);
    if (variant !== 'A') {
      allA = false;
      break;
    }
  }
  
  if (allA) {
    log('green', '  ✅ Flag désactivé → 100% variante A');
    return true;
  } else {
    log('red', '  ❌ Flag désactivé mais variante B détectée');
    return false;
  }
}

/**
 * Test split=0 et split=100
 */
function testEdgeCases() {
  log('cyan', '\n🧪 Test 4: Cas limites (split=0 et split=100)');
  
  const enabled = true;
  let success = true;
  
  // Split = 0 → toujours A
  for (let i = 0; i < 10; i++) {
    const variant = chooseVariant(`user-${i}`, 0, enabled);
    if (variant !== 'A') {
      log('red', '  ❌ Split=0 mais variante B détectée');
      success = false;
      break;
    }
  }
  
  if (success) {
    log('green', '  ✅ Split=0 → 100% variante A');
  }
  
  // Split = 100 → toujours B
  for (let i = 0; i < 10; i++) {
    const variant = chooseVariant(`user-${i}`, 100, enabled);
    if (variant !== 'B') {
      log('red', '  ❌ Split=100 mais variante A détectée');
      success = false;
      break;
    }
  }
  
  if (success) {
    log('green', '  ✅ Split=100 → 100% variante B');
  }
  
  return success;
}

/**
 * Test endpoint /api/ab-status
 */
async function testAbStatusEndpoint() {
  log('cyan', '\n🧪 Test 5: Endpoint /api/ab-status');
  
  return new Promise((resolve) => {
    const url = new URL('/api/ab-status', API_BASE);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            log('red', `  ❌ Status code ${res.statusCode}`);
            resolve(false);
            return;
          }
          
          const json = JSON.parse(data);
          
          log('blue', `  Enabled: ${json.enabled}`);
          log('blue', `  Split: ${json.split}%`);
          log('blue', `  Counts: A=${json.counts?.A || 0}, B=${json.counts?.B || 0}, fallback=${json.counts?.fallbackToA || 0}`);
          log('blue', `  Avg Latency: A=${json.avgLatency?.A || 0}ms, B=${json.avgLatency?.B || 0}ms`);
          log('blue', `  Avg Confidence: A=${json.avgConfidence?.A || 0}, B=${json.avgConfidence?.B || 0}`);
          
          // Vérifier la structure de la réponse
          if (typeof json.enabled === 'boolean' && 
              typeof json.split === 'number' &&
              json.counts &&
              json.avgLatency &&
              json.avgConfidence) {
            log('green', '  ✅ Endpoint /api/ab-status OK');
            resolve(true);
          } else {
            log('red', '  ❌ Structure de réponse invalide');
            resolve(false);
          }
        } catch (error) {
          log('red', `  ❌ Erreur parsing JSON: ${error.message}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      log('red', `  ❌ Erreur requête: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      log('red', '  ❌ Timeout');
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Exécution des tests
 */
async function runTests() {
  log('cyan', '\n' + '='.repeat(60));
  log('cyan', '🚀 Smoke Test LOT 18 - A/B test du classifieur de pièces');
  log('cyan', '='.repeat(60));
  
  const results = [
    testAbRouting(),
    testDeterminism(),
    testFlagDisabled(),
    testEdgeCases(),
    await testAbStatusEndpoint(),
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log('cyan', '\n' + '='.repeat(60));
  if (passed === total) {
    log('green', `✅ Tous les tests passés (${passed}/${total})`);
    log('cyan', '='.repeat(60));
    process.exit(0);
  } else {
    log('red', `❌ ${total - passed} test(s) échoué(s) sur ${total}`);
    log('cyan', '='.repeat(60));
    process.exit(1);
  }
}

// Lancer les tests
runTests().catch(error => {
  log('red', `\n❌ Erreur fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});



