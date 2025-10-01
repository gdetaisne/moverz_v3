#!/usr/bin/env node
/**
 * Script pour copier les fichiers de fonts PDFKit nécessaires
 * À exécuter après npm install et avant de démarrer le serveur
 */

const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../node_modules/pdfkit/js/data');
const targetPath = path.join(__dirname, '../.next/server/vendor-chunks/data');

console.log('🔧 Configuration PDFKit pour Next.js...');

// Créer le dossier cible s'il n'existe pas
if (!fs.existsSync(path.dirname(targetPath))) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  console.log('✅ Dossier .next/server/vendor-chunks créé');
}

if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(targetPath, { recursive: true });
  console.log('✅ Dossier data créé');
}

// Copier tous les fichiers .afm
if (fs.existsSync(sourcePath)) {
  const files = fs.readdirSync(sourcePath);
  let copiedCount = 0;
  
  files.forEach(file => {
    if (file.endsWith('.afm')) {
      const source = path.join(sourcePath, file);
      const target = path.join(targetPath, file);
      fs.copyFileSync(source, target);
      copiedCount++;
    }
  });
  
  console.log(`✅ ${copiedCount} fichiers de fonts copiés`);
  console.log('✅ PDFKit configuré avec succès pour Next.js');
} else {
  console.error('❌ Dossier source PDFKit non trouvé:', sourcePath);
  console.error('   Exécutez "npm install" d\'abord');
  process.exit(1);
}

