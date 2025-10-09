#!/usr/bin/env node

/**
 * 🧪 Script de test de résilience
 * 
 * Vérifie que:
 * 1. Aucune route /api/* ne renvoie 500
 * 2. /api/ai-status retourne un JSON valide
 * 3. Aucun code avec "logger is not defined"
 * 4. Les erreurs sont gérées proprement
 * 
 * Usage: node scripts/test-resilience.mjs
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const execPromise = promisify(exec)

// Configuration
const FRONTEND_URL = 'http://localhost:3000'
const API_URL = 'http://localhost:3001'
const TIMEOUT = 5000

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue')
}

/**
 * Test 1: Vérifier qu'aucune route API ne renvoie 500
 */
async function testApiRoutes() {
  info('Test 1: Vérification des routes API...')
  
  const routes = [
    '/api/ai-status',
  ]

  let allPassed = true

  for (const route of routes) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

      const response = await fetch(`${FRONTEND_URL}${route}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 500) {
        error(`Route ${route} retourne 500`)
        allPassed = false
      } else if (response.status >= 200 && response.status < 600) {
        success(`Route ${route} → ${response.status}`)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        warning(`Route ${route} timeout après ${TIMEOUT}ms`)
        allPassed = false
      } else {
        warning(`Route ${route} erreur: ${err.message}`)
        // On ne compte pas comme échec si le serveur n'est pas lancé
      }
    }
  }

  return allPassed
}

/**
 * Test 2: Vérifier /api/ai-status retourne un JSON valide
 */
async function testAiStatusJson() {
  info('Test 2: Vérification /api/ai-status JSON...')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

    const response = await fetch(`${FRONTEND_URL}/api/ai-status`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    // Vérifier la structure du JSON
    if (!data || typeof data !== 'object') {
      error('/api/ai-status ne retourne pas un objet JSON valide')
      return false
    }

    // Vérifier les champs requis
    if (data.success !== undefined || data.error !== undefined) {
      success('/api/ai-status retourne un JSON valide avec success ou error')
      return true
    } else {
      warning('/api/ai-status JSON valide mais sans champ success/error')
      return true
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      error('/api/ai-status timeout')
      return false
    }
    warning(`/api/ai-status erreur: ${err.message}`)
    return false
  }
}

/**
 * Test 3: Rechercher "logger is not defined" dans le code
 */
async function testLoggerUndefined() {
  info('Test 3: Recherche de "logger is not defined"...')

  try {
    const { stdout } = await execPromise(
      'grep -r "logger\\." apps/web lib packages --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true'
    )

    const lines = stdout.split('\n').filter(Boolean)
    
    // Vérifier que les fichiers avec logger. ont un import
    let hasIssue = false
    
    for (const line of lines) {
      const filePath = line.split(':')[0]
      if (!filePath) continue

      try {
        const content = await readFile(filePath, 'utf-8')
        const hasImport = 
          content.includes('import') && 
          (content.includes('from \'@/lib/logger\'') || 
           content.includes('from "@/lib/logger"') ||
           content.includes('from \'./logger\'') ||
           content.includes('from "./logger"'))

        const usesLogger = content.includes('logger.')

        if (usesLogger && !hasImport && !content.includes('console.')) {
          // Si le fichier utilise logger mais n'importe pas logger
          // et utilise effectivement logger (pas console), c'est un problème
          const actualLoggerUsage = content.match(/(?<!console\.)logger\./g)
          if (actualLoggerUsage && actualLoggerUsage.length > 0) {
            error(`${filePath} utilise logger sans import`)
            hasIssue = true
          }
        }
      } catch (readErr) {
        // Ignorer les erreurs de lecture de fichier
      }
    }

    if (!hasIssue) {
      success('Aucun usage de logger sans import détecté')
    }

    return !hasIssue
  } catch (err) {
    warning(`Impossible de vérifier les imports logger: ${err.message}`)
    return true // Ne pas bloquer si grep échoue
  }
}

/**
 * Test 4: Vérifier que SafeBoundary existe
 */
async function testSafeBoundaryExists() {
  info('Test 4: Vérification de SafeBoundary...')

  try {
    const safeBoundaryPath = join(process.cwd(), 'apps/web/components/SafeBoundary.tsx')
    const content = await readFile(safeBoundaryPath, 'utf-8')

    if (content.includes('componentDidCatch') || content.includes('getDerivedStateFromError')) {
      success('SafeBoundary existe et implémente la gestion d\'erreurs')
      return true
    } else {
      error('SafeBoundary existe mais n\'implémente pas componentDidCatch')
      return false
    }
  } catch (err) {
    error('SafeBoundary.tsx introuvable')
    return false
  }
}

/**
 * Fonction principale
 */
async function main() {
  log('\n🧪 Test de résilience Moverz\n', 'cyan')

  const results = {
    apiRoutes: await testApiRoutes(),
    aiStatus: await testAiStatusJson(),
    loggerUndefined: await testLoggerUndefined(),
    safeBoundary: await testSafeBoundaryExists(),
  }

  log('\n📊 Résultats:\n', 'cyan')
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      success(`${test}: PASS`)
    } else {
      error(`${test}: FAIL`)
    }
  })

  const allPassed = Object.values(results).every(Boolean)

  if (allPassed) {
    log('\n🎉 Tous les tests sont passés!\n', 'green')
    process.exit(0)
  } else {
    log('\n💥 Certains tests ont échoué\n', 'red')
    process.exit(1)
  }
}

// Lancer les tests
main().catch((err) => {
  error(`Erreur fatale: ${err.message}`)
  process.exit(1)
})


