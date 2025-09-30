# Google Cloud Vision Setup

## 1. Créer un compte Google Cloud
- Aller sur https://console.cloud.google.com/
- Créer un nouveau projet ou utiliser un existant

## 2. Activer Vision API
- Menu → APIs & Services → Library
- Chercher "Vision API" → Cliquer "Enable"

## 3. Créer une clé de service
- Menu → APIs & Services → Credentials
- "Create Credentials" → "Service Account"
- Nom: "moverz-vision-service"
- Role: "Cloud Vision API User"
- "Create Key" → "JSON" → Télécharger

## 4. Configurer l'environnement
```bash
# Placer le fichier JSON dans le projet
cp ~/Downloads/your-service-account-key.json ./google-credentials.json

# Ajouter à .env.local
echo "GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json" >> .env.local
```

## 5. Tester l'API
```bash
# Test simple
curl -X POST -F "file=@test-image.jpg" http://localhost:3001/api/photos/analyze
```

## Coûts estimés
- Vision API: $1.50/1000 images
- Object Detection: $0.20/1000 détections
- Total pour 1000 photos/mois: ~$17

