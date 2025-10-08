#!/usr/bin/env node
/**
 * Script de vérification de la configuration Neon
 * Vérifie que DATABASE_URL et DIRECT_URL sont correctement configurés
 */

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvVar(varName, required = true) {
  const value = process.env[varName];
  
  if (!value) {
    if (required) {
      log(colors.red, `❌ ${varName} manquant`);
      return false;
    } else {
      log(colors.yellow, `⚠️  ${varName} optionnel non défini`);
      return true;
    }
  }
  
  // Vérifications spécifiques pour les URLs Postgres
  if (varName === 'DATABASE_URL' || varName === 'DIRECT_URL') {
    if (!value.startsWith('postgresql://')) {
      log(colors.red, `❌ ${varName} doit commencer par postgresql://`);
      return false;
    }
    
    // Vérifier que ce n'est pas un placeholder
    if (value.includes('[USER]') || value.includes('[PASSWORD]') || value.includes('[HOST]')) {
      log(colors.red, `❌ ${varName} contient encore des placeholders [USER], [PASSWORD] ou [HOST]`);
      return false;
    }
    
    // Vérifier pooler pour DATABASE_URL
    if (varName === 'DATABASE_URL' && !value.includes('pgbouncer=true')) {
      log(colors.yellow, `⚠️  ${varName} devrait contenir pgbouncer=true pour le pooling`);
    }
  }
  
  log(colors.green, `✅ ${varName} configuré`);
  return true;
}

console.log(`\n${colors.bold}${colors.blue}=== Vérification Configuration Neon ===${colors.reset}\n`);

const requiredVars = [
  'DATABASE_URL',
  'DIRECT_URL'
];

const optionalVars = [
  'AI_SERVICE_URL',
  'PORT',
  'NODE_ENV',
  'JWT_SECRET'
];

let allValid = true;

log(colors.bold, '\n📋 Variables requises :');
for (const varName of requiredVars) {
  if (!checkEnvVar(varName, true)) {
    allValid = false;
  }
}

log(colors.bold, '\n📝 Variables optionnelles :');
for (const varName of optionalVars) {
  checkEnvVar(varName, false);
}

console.log();

if (!allValid) {
  log(colors.red, '❌ Configuration incomplète ou invalide\n');
  log(colors.yellow, '📖 Consultez NEON_ENV_CONFIG.md pour les instructions\n');
  process.exit(1);
} else {
  log(colors.green, '✅ Configuration valide - Prêt pour la migration\n');
  log(colors.blue, '🚀 Prochaines étapes :');
  console.log('   1. npm run prisma:generate');
  console.log('   2. npm run prisma:migrate\n');
  process.exit(0);
}

