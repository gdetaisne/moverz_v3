#!/usr/bin/env node

/**
 * Script d'initialisation des credentials Google Cloud
 * Crée le fichier google-credentials.json à partir de la variable d'environnement
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Initialisation des credentials Google Cloud...');

// Vérifier si la variable d'environnement existe
const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;

if (!credentialsJson) {
  console.log('⚠️  GOOGLE_CREDENTIALS_JSON non définie, création d\'un fichier vide');
  // Créer un fichier vide pour éviter les erreurs
  fs.writeFileSync('./google-credentials.json', '{}');
  console.log('✅ Fichier google-credentials.json vide créé');
  process.exit(0);
}

try {
  // Parser le JSON pour vérifier qu'il est valide
  const credentials = JSON.parse(credentialsJson);
  
  // Écrire le fichier
  fs.writeFileSync('./google-credentials.json', credentialsJson);
  
  console.log('✅ Credentials Google Cloud initialisés avec succès');
  console.log(`📁 Fichier créé: ${path.resolve('./google-credentials.json')}`);
  console.log(`🔑 Project ID: ${credentials.project_id || 'Non défini'}`);
  
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation des credentials Google:');
  console.error(error.message);
  
  // Créer un fichier vide en cas d'erreur
  fs.writeFileSync('./google-credentials.json', '{}');
  console.log('✅ Fichier google-credentials.json vide créé (fallback)');
  
  process.exit(1);
}