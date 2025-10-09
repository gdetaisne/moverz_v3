# 🏠 Analyse IA - Inventaire Déménagement

Application Next.js pour analyser des photos de pièces et détecter automatiquement les meubles et objets pour créer un inventaire de déménagement.

## ✨ Fonctionnalités

- **Upload multiple** : Téléchargez 1 à 10 photos par pièce
- **Analyse IA** : Utilise GPT-4o-mini (Vision) pour détecter les objets
- **Catalogue intelligent** : Mappe automatiquement les objets détectés vers des dimensions standards
- **JSON structuré** : Retourne un inventaire détaillé avec volumes et dimensions
- **Interface simple** : Interface web pour tester et visualiser les résultats

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- Clé API OpenAI

### Installation

```bash
# Installer les dépendances
npm install

# Configurer la clé OpenAI
echo "OPENAI_API_KEY=your-api-key-here" > .env.local

# Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 🧪 Test de l'API

```bash
# Tester l'API directement
./test-api.sh

# Ou manuellement avec curl
curl -X POST http://localhost:3000/api/photos/analyze -F "file=@your-image.jpg"
```

## 📊 Format de réponse

L'API retourne un JSON structuré selon le schéma `PhotoAnalysis` :

```json
{
  "version": "1.0.0",
  "photo_id": "uuid",
  "items": [
    {
      "label": "Chaise",
      "category": "furniture",
      "confidence": 0.9,
      "quantity": 1,
      "dimensions_cm": {
        "length": 45,
        "width": 45,
        "height": 90,
        "source": "catalog"
      },
      "volume_m3": 0.182
    }
  ],
  "totals": {
    "count_items": 1,
    "volume_m3": 0.182
  },
  "warnings": [],
  "errors": []
}
```

## 🏗️ Architecture

### Structure des fichiers

```
├── app/
│   ├── api/
│   │   ├── photos/analyze/     # API d'analyse des photos
│   │   └── uploads/[...path]/  # Service des fichiers uploadés
│   └── page.tsx                # Interface web
├── lib/
│   ├── schemas.ts              # Schémas Zod pour validation
│   ├── catalog.ts              # Catalogue de dimensions standards
│   ├── normalize.ts            # Helpers de normalisation
│   └── storage.ts              # Abstraction du stockage
└── services/
    └── openaiVision.ts         # Service OpenAI Vision
```

### Composants clés

- **Schémas Zod** : Validation stricte des données
- **Catalogue** : Dimensions standards pour objets courants
- **Normalisation** : Mapping des labels IA vers le catalogue
- **Stockage** : Gestion locale des fichiers (extensible vers S3)

## 🔧 Configuration

### Variables d'environnement

```bash
OPENAI_API_KEY=sk-...  # Clé API OpenAI (requise)
```

### Catalogue

Le catalogue dans `lib/catalog.ts` contient les dimensions standards pour :
- Canapé 3 places
- Lit double
- Table basse
- Chaise
- Carton standard
- Vêtements

## 🚀 Déploiement

L'application est prête pour le déploiement sur Vercel, Netlify, ou tout autre plateforme Next.js.

Pour la production, remplacez `lib/storage.ts` par une implémentation S3 ou similaire.

## 📝 Notes techniques

- **Validation** : Tous les JSON sont validés avec Zod
- **TypeScript strict** : Code entièrement typé
- **Base64** : Images converties en base64 pour OpenAI
- **Erreurs** : Gestion d'erreurs robuste avec logs détaillés

## 📊 Monitoring (LOT 12.1)

### Bull Board Dashboard

Interface d'administration pour surveiller les files d'attente BullMQ (workers en background).

**Démarrage :**
```bash
# Via npm (recommandé)
npm run bullboard

# Ou directement
node scripts/bullboard.js
```

**Accès :**
- URL : [http://localhost:3010/admin/queues](http://localhost:3010/admin/queues)
- Auth : Header `x-access-token` avec la valeur de `BULLBOARD_TOKEN` (définie dans `.env`)

**Fonctionnalités :**
- 📈 Statistiques en temps réel des queues
- 🔍 Visualisation des jobs (waiting, active, completed, failed)
- ⏱️ Temps de traitement moyens
- ❌ Logs d'erreurs détaillés
- 🔄 Retry des jobs échoués
- 🧹 Nettoyage des jobs complétés

**API Endpoints :**
```bash
# Statistiques des queues
curl -H "x-access-token: secret123" http://localhost:3010/admin/api/stats

# Jobs échoués récents
curl -H "x-access-token: secret123" http://localhost:3010/admin/api/failed?queue=photo-analyze

# Retry tous les jobs échoués
curl -X POST -H "x-access-token: secret123" http://localhost:3010/admin/api/retry-failed

# Nettoyer les jobs complétés (> 1h)
curl -X POST -H "x-access-token: secret123" http://localhost:3010/admin/api/clean?queue=photo-analyze
```

**Queues surveillées :**
- `photo-analyze` : Analyse IA des photos uploadées
- `inventory-sync` : Synchronisation de l'inventaire

**Variables d'environnement requises :**
```bash
REDIS_URL=redis://localhost:6379          # Connexion Redis
BULLBOARD_TOKEN=secret123                 # Token d'authentification
BULLBOARD_PORT=3010                       # Port du dashboard (optionnel)
```