#!/usr/bin/env node

/**
 * Script d'initialisation des credentials Google Cloud
 * Crée le fichier google-credentials.json à partir de la variable d'environnement
 */

const fs = require('fs');
const path = require('path');

function initGoogleCredentials() {
  try {
    // Vérifier si GOOGLE_CREDENTIALS_JSON est définie
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
      
      // Vérifier si le fichier existe déjà
      if (fs.existsSync(credentialsPath)) {
        console.log('✅ google-credentials.json existe déjà');
        return;
      }
      
      // Créer le fichier à partir de la variable d'environnement
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
      
      console.log('✅ google-credentials.json créé à partir de GOOGLE_CREDENTIALS_JSON');
    } else {
      console.log('⚠️  GOOGLE_CREDENTIALS_JSON non définie - google-credentials.json sera vide');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des credentials Google:', error.message);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initGoogleCredentials();
}

module.exports = { initGoogleCredentials };
