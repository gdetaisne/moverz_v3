#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Générer la date/heure actuelle en heure de Bangkok (UTC+7)
const now = new Date();
const timestamp = now.toISOString();

// Convertir en heure de Bangkok (UTC+7)
const bangkokTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
const date = bangkokTime.toLocaleString('fr-FR', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

// Contenu du fichier buildInfo.ts
const content = `// Informations de build - générées automatiquement
// Dernière mise à jour: ${timestamp}

export const BUILD_INFO = {
  timestamp: "${timestamp}",
  date: "${date}"
};

export function getBuildInfo() {
  return \`\${BUILD_INFO.date} - Dernier déploiement\`;
}
`;

// Écrire le fichier
const filePath = path.join(__dirname, '..', 'lib', 'buildInfo.ts');
fs.writeFileSync(filePath, content);

console.log(`✅ Build info updated: ${date}`);
console.log(`📁 File: ${filePath}`);
