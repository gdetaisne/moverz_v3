# 🔧 Fix PDFKit avec Next.js

## Problème résolu

PDFKit nécessite des fichiers de fonts (.afm) qui ne sont pas automatiquement copiés par Next.js lors du build/dev.

**Erreur initiale:**
```
ENOENT: no such file or directory, open '/path/to/.next/server/vendor-chunks/data/Helvetica.afm'
```

---

## ✅ Solution implémentée

### 1. Script de setup automatique

**Fichier:** `scripts/setup-pdfkit.js`

Ce script copie automatiquement les fichiers de fonts PDFKit vers le bon emplacement.

### 2. Integration dans package.json

```json
{
  "scripts": {
    "predev": "node scripts/setup-pdfkit.js",
    "prebuild": "node scripts/update-build-info.js && node scripts/setup-pdfkit.js",
    "postinstall": "node scripts/setup-pdfkit.js || true"
  }
}
```

**Le script s'exécute automatiquement :**
- ✅ Après `npm install` (postinstall)
- ✅ Avant `npm run dev` (predev)
- ✅ Avant `npm run build` (prebuild)

### 3. Configuration Next.js

**Fichier:** `next.config.ts`

Ajout de configuration webpack pour les modules Node.js :

```typescript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals = config.externals || [];
    config.externals.push({
      'canvas': 'commonjs canvas',
    });
  }
  return config;
}
```

### 4. API Route configuration

**Fichier:** `app/api/pdf/generate/route.ts`

```typescript
export const runtime = 'nodejs';  // Force Node.js runtime
export const dynamic = 'force-dynamic';
```

---

## 🧪 Test

### Test manuel avec curl

```bash
curl -X POST http://localhost:3001/api/pdf/generate \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "email": "test@test.com",
      "departureCity": "Paris",
      "departurePostalCode": "75001",
      "departureElevator": true,
      "arrivalCity": "Lyon",
      "arrivalPostalCode": "69001",
      "arrivalElevator": false,
      "movingDate": "2025-11-15",
      "selectedOffer": "standard"
    },
    "rooms": [{
      "id": "1",
      "name": "Salon",
      "photos": [{
        "items": [{
          "label": "Canapé",
          "category": "furniture",
          "quantity": 1,
          "volume_m3": 1.5,
          "fragile": false,
          "dismountable": true
        }]
      }]
    }]
  }' \
  -o test.pdf

# Vérifier
file test.pdf
# Output: test.pdf: PDF document, version 1.3
```

### Test depuis l'interface

1. Démarrer : `npm run dev`
2. Remplir le formulaire (Étape 3)
3. Aller à l'Étape 4
4. Cliquer sur "📄 PDF Complet"
5. ✅ Le PDF se télécharge automatiquement

---

## 🚨 Dépannage

### Si l'erreur persiste après installation

```bash
# Exécuter manuellement le script de setup
node scripts/setup-pdfkit.js

# Redémarrer le serveur
npm run dev
```

### Vérifier que les fichiers sont bien copiés

```bash
ls -la .next/server/vendor-chunks/data/
# Devrait afficher : Helvetica.afm, Helvetica-Bold.afm, etc.
```

### En production (CapRover)

Le script `postinstall` s'exécute automatiquement lors du déploiement.

Si besoin, ajouter dans le Dockerfile :

```dockerfile
RUN npm install && npm run postinstall
```

---

## 📝 Fichiers modifiés

- ✅ `scripts/setup-pdfkit.js` (nouveau)
- ✅ `package.json` (scripts ajoutés)
- ✅ `next.config.ts` (webpack config)
- ✅ `app/api/pdf/generate/route.ts` (runtime config)

---

## ✨ Résultat

🎉 **La génération PDF fonctionne maintenant parfaitement !**

- ✅ Status 200
- ✅ PDF valide généré
- ✅ Taille: ~3-5 KB (petit PDF de test)
- ✅ Automatique lors de chaque démarrage

---

**Date:** 1 octobre 2025  
**Problème résolu par:** Configuration automatique PDFKit + Next.js

