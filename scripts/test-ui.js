#!/usr/bin/env node

/**
 * LOT 19 - UI Validation Suite
 * Vérifie que toutes les pages frontend se compilent et se chargent sans erreur
 * 
 * Usage: node scripts/test-ui.js
 */

const { spawn } = require('child_process');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const wait = (ms) => new Promise(res => setTimeout(res, ms));
const BASE_URL = 'http://localhost:3001';

// Pages à tester
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/admin/metrics', name: 'Admin Dashboard (skip auth)', skipAuth: true },
];

// Couleurs
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
 * Teste une page
 */
async function checkPage(page) {
  return new Promise((resolve) => {
    const url = BASE_URL + page.path;
    
    http.get(url, (res) => {
      let html = '';
      
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        const statusOk = res.statusCode === 200 || res.statusCode === 401; // 401 OK pour admin sans auth
        
        // Détecter les vraies erreurs (pas les noms de composants ou classes CSS)
        const hasError = html.includes('Unhandled Runtime Error') || 
                        html.includes('Application error:') ||
                        html.includes('Error: ') ||
                        html.includes('Failed to compile') ||
                        (html.includes('500') && html.includes('Internal Server Error'));
        
        const ok = statusOk && !hasError;
        
        if (ok) {
          log('green', `✅ ${page.name} [${res.statusCode}]`);
        } else {
          log('red', `❌ ${page.name} [${res.statusCode}]`);
          if (hasError) {
            log('yellow', `   → Error detected in HTML`);
            // Afficher un extrait de l'erreur
            const errorMatch = html.match(/(Error|Unhandled Runtime).{0,100}/);
            if (errorMatch) {
              log('yellow', `   → ${errorMatch[0].substring(0, 80)}...`);
            }
          }
        }
        
        resolve(ok);
      });
    }).on('error', (err) => {
      log('red', `❌ ${page.name} → ${err.message}`);
      resolve(false);
    }).setTimeout(10000, function() {
      log('red', `❌ ${page.name} → Timeout`);
      this.destroy();
      resolve(false);
    });
  });
}

/**
 * Vérifie que le serveur répond
 */
async function waitForServer(maxAttempts = 40) {
  log('blue', '  → Attente du serveur Next.js...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(BASE_URL, (res) => {
          resolve();
        }).on('error', reject).setTimeout(1000);
      });
      
      log('green', '  ✓ Serveur accessible');
      return true;
    } catch (err) {
      if (i === maxAttempts - 1) {
        log('red', '  ✗ Timeout serveur');
        return false;
      }
      await wait(1000);
    }
  }
  
  return false;
}

/**
 * Crée des données de test si nécessaire
 */
async function setupTestData() {
  log('blue', '📦 Setup données de test...');
  
  try {
    // Créer un user de test
    const user = await prisma.user.upsert({
      where: { id: 'ui-test-user' },
      create: { id: 'ui-test-user', email: 'ui-test@test.local' },
      update: {},
    });

    // Créer un projet de test
    const project = await prisma.project.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: 'UI Test Project',
        },
      },
      create: {
        id: 'ui-test-project',
        name: 'UI Test Project',
        userId: user.id,
      },
      update: {},
    });

    // Créer un batch de test
    await prisma.batch.upsert({
      where: { id: 'demo-batch' },
      create: {
        id: 'demo-batch',
        projectId: project.id,
        userId: user.id,
        status: 'COMPLETED',
        countsQueued: 0,
        countsProcessing: 0,
        countsCompleted: 5,
        countsFailed: 0,
      },
      update: {},
    });

    log('green', '  ✓ Données de test créées');
  } catch (error) {
    log('yellow', `  ⚠️  Données de test : ${error.message}`);
  }
}

/**
 * Cleanup des données de test
 */
async function cleanupTestData() {
  log('blue', '🧹 Cleanup données de test...');
  
  try {
    await prisma.batch.deleteMany({
      where: { id: 'demo-batch' },
    });
    
    await prisma.project.deleteMany({
      where: { id: 'ui-test-project' },
    });
    
    await prisma.user.deleteMany({
      where: { id: 'ui-test-user' },
    });
    
    log('green', '  ✓ Cleanup terminé');
  } catch (error) {
    log('yellow', `  ⚠️  Cleanup : ${error.message}`);
  }
}

/**
 * Exécution principale
 */
async function run() {
  let devProcess = null;
  
  try {
    log('cyan', '\n' + '='.repeat(60));
    log('cyan', '🚀 UI Validation Suite - LOT 19');
    log('cyan', '='.repeat(60));
    log('cyan', '');

    // Vérifier si le serveur est déjà lancé
    log('blue', '🌐 Vérification serveur...');
    
    let serverRunning = false;
    try {
      await new Promise((resolve, reject) => {
        http.get(BASE_URL, resolve).on('error', reject).setTimeout(1000);
      });
      serverRunning = true;
      log('green', '  ✓ Serveur déjà actif (réutilisé)');
    } catch {
      log('yellow', '  ⚠️  Serveur non actif, démarrage...');
      
      // Lancer le serveur Next.js (depuis apps/web ou racine selon structure)
      // Note: Next.js cherche app/ à la racine, les symlinks doivent fonctionner
      devProcess = spawn('pnpm', ['dev'], {
        cwd: process.cwd(), // Rester à la racine
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      // Attendre le démarrage
      const ready = await waitForServer();
      if (!ready) {
        log('red', '❌ Impossible de démarrer le serveur');
        process.exit(1);
      }
      
      // Attendre que Next.js compile les routes (mode dev)
      log('blue', '  → Attente compilation initiale...');
      await wait(15000);
    }

    // Setup des données de test
    await setupTestData();
    
    log('cyan', '\n🧠 Test des pages frontend...\n');

    // Tester chaque page
    const results = [];
    for (const page of PAGES) {
      const ok = await checkPage(page);
      results.push(ok);
      await wait(500); // Petit délai entre les tests
    }

    // Résumé
    const passed = results.filter(Boolean).length;
    const total = results.length;

    log('cyan', '\n' + '='.repeat(60));
    
    if (passed === total) {
      log('green', `✅ Tous les tests passés (${passed}/${total})`);
      log('cyan', '='.repeat(60));
    } else {
      log('red', `❌ ${total - passed} page(s) échouée(s) sur ${total}`);
      log('cyan', '='.repeat(60));
    }

    // Cleanup
    await cleanupTestData();

    // Arrêter le serveur si on l'a démarré
    if (devProcess && !serverRunning) {
      log('yellow', '\n🛑 Arrêt du serveur...');
      devProcess.kill('SIGINT');
      await wait(2000);
    }

    await prisma.$disconnect();
    
    process.exit(passed === total ? 0 : 1);
    
  } catch (error) {
    log('red', `\n❌ Erreur fatale: ${error.message}`);
    console.error(error);
    
    if (devProcess) {
      devProcess.kill('SIGINT');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Lancer les tests
run();

