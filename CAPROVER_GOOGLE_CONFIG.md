# 📦 Configuration Google Vision pour CapRover

## ✅ NOUVELLE Solution : JSON dans variable d'environnement

Au lieu d'uploader le fichier, ajoutez cette variable dans CapRover :

### Variable à ajouter :

**Nom :** `GOOGLE_CREDENTIALS_JSON`

**Valeur :** (tout sur une seule ligne, sans retours à la ligne)
```json
{"type":"service_account","project_id":"expanded-rider-217013","private_key_id":"2623c3e4f75ab5bbf91603ce0fce8973521b4903","private_key":"-----BEGIN PRIVATE KEY-----
VOTRE_CLE_PRIVEE_GOOGLE_ICI
-----END PRIVATE KEY-----\n","client_email":"moverz-vision-service@expanded-rider-217013.iam.gserviceaccount.com","client_id":"115512065971122475412","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/moverz-vision-service%40expanded-rider-217013.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

---

## 📋 Variables CapRover Finales

```
OPENAI_API_KEY=sk-VOTRE_CLE_OPENAI_ICI

NODE_ENV=production

PORT=80

CLAUDE_API_KEY=sk-VOTRE_CLE_OPENAI_ICI

GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"expanded-rider-217013","private_key_id":"2623c3e4f75ab5bbf91603ce0fce8973521b4903","private_key":"-----BEGIN PRIVATE KEY-----
VOTRE_CLE_PRIVEE_GOOGLE_ICI
-----END PRIVATE KEY-----\n","client_email":"moverz-vision-service@expanded-rider-217013.iam.gserviceaccount.com","client_id":"115512065971122475412","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/moverz-vision-service%40expanded-rider-217013.iam.gserviceaccount.com","universe_domain":"googleapis.com"}

AWS_ACCESS_KEY_ID=AKIA_VOTRE_AWS_ACCESS_KEY_ICI

AWS_SECRET_ACCESS_KEY=crBZ7Z2YZmewT2IQLQmARV5kk8ClRpahLSbWkquI

AWS_REGION=us-east-1
```

---

## ❌ Variables à SUPPRIMER

- `GOOGLE_VISION_API_KEY` (inutile)
- `GOOGLE_CLOUD_PROJECT_ID` (pas nécessaire, dans le JSON)
- `GOOGLE_APPLICATION_CREDENTIALS` (pas nécessaire, utilise JSON env)

---

## ✅ Avantages

1. Pas besoin d'uploader de fichier
2. Tout dans les variables d'environnement
3. Plus facile à gérer
4. Fonctionne aussi en local (fallback automatique)
