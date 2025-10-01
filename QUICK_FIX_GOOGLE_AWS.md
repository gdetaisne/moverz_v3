# 🔧 Activation Google Vision + AWS Rekognition

## 🟢 Google Vision (OBLIGATOIRE : Fichier JSON)

### Étapes :
1. **Console Google Cloud** : https://console.cloud.google.com/apis/credentials
2. **Projet** : moverz-vision  
3. **Service Accounts** > cliquer sur votre compte
4. **Keys** > Add Key > Create new key > **JSON**
5. **Télécharger** le fichier `moverz-vision-xxxxx.json`
6. **Renommer** en `google-credentials.json`
7. **Placer** dans `/Users/guillaumestehelin/moverz_v3/`

### Mise à jour .env.local :
```bash
# Remplacer ces 2 lignes :
GOOGLE_CLOUD_PROJECT_ID=moverz-vision
GOOGLE_VISION_API_KEY=AIzaSyD92ZkMuCXDRCPWs73izYI7mZRtjt-YnmQ

# Par :
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

---

## 🟠 AWS Rekognition (Problème : Clés invalides)

### Diagnostic :
```
UnrecognizedClientException: The security token included in the request is invalid
```

### Solution :

#### Option A : Vérifier les permissions
1. **Console AWS** : https://console.aws.amazon.com/iam/
2. **Users** > moverz-rekognition-user
3. **Permissions** : Vérifier `AmazonRekognitionFullAccess`
4. **Security credentials** : Vérifier que l'Access Key est **Active**

#### Option B : Recréer les clés (RECOMMANDÉ)
1. **Console AWS IAM** > Users > moverz-rekognition-user
2. **Security credentials** > Access keys
3. **Désactiver** l'ancienne clé (ou Delete)
4. **Create access key**
5. **Use case** : Command Line Interface (CLI) OU Application running outside AWS
6. **Télécharger CSV**
7. **Mettre à jour .env.local** avec nouvelles clés

### Attendre 2-3 minutes
Après création des nouvelles clés, attendre la propagation AWS (1-3 min)

---

## ✅ Test Final

Une fois configuré :
```bash
curl -X POST http://localhost:3001/api/photos/analyze \
  -F "file=@test-image.jpg"
```

Vérifier dans les logs :
- ✅ Google Vision actif
- ✅ AWS Rekognition actif
- ❌ Plus d'erreur "UnrecognizedClientException"
