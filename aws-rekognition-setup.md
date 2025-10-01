# Amazon Rekognition Setup

## 1. Créer un compte AWS
- Aller sur https://aws.amazon.com/
- Créer un compte ou se connecter

## 2. Accéder à Rekognition
- Aller sur https://console.aws.amazon.com/rekognition/
- S'assurer d'être dans la région "us-east-1" (N. Virginia)

## 3. Créer des clés d'accès
- Menu → IAM → Users → Create User
- Nom: "moverz-rekognition-user"
- Attach policies: "AmazonRekognitionFullAccess"
- Create Access Key → Download CSV

## 4. Configurer l'environnement
```bash
# Ajouter à .env.local
echo "AWS_ACCESS_KEY_ID=your_access_key_here" >> .env.local
echo "AWS_SECRET_ACCESS_KEY=your_secret_key_here" >> .env.local
echo "AWS_REGION=us-east-1" >> .env.local
```

## 5. Tester l'API
```bash
# Test simple
curl -X POST -F "file=@test-image.jpg" http://localhost:3001/api/photos/analyze
```

## Coûts estimés
- Rekognition: $1.00/1000 images
- Labels Detection: $0.10/1000 détections
- Total pour 1000 photos/mois: ~$11

## Architecture finale
```
Image → [Google Vision] → [Amazon Rekognition] → [Fusion Logic] → [Résultat]
         ↓                    ↓                      ↓
      Détection            Détection            Moyenne pondérée
      objets               objets               des dimensions
```


