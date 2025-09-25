#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Générer la date/heure actuelle
const now = new Date();
const timestamp = now.toISOString();
const date = now.toLocaleString('fr-FR', {
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
