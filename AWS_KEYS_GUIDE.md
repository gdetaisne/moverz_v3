# 🔑 Guide AWS Rekognition - Créer Nouvelles Clés

## 📋 Récapitulatif des étapes

### 1. Accès IAM
https://console.aws.amazon.com/iam/home#/users

### 2. Utilisateur
Cliquer sur : **moverz-rekognition-user**

### 3. Security credentials
Onglet : **Security credentials**

### 4. Désactiver ancienne clé
- Trouver : `AKIA_VOTRE_AWS_ACCESS_KEY_ICI`
- Actions > **Deactivate** (ou Delete)

### 5. Créer nouvelle clé
- Bouton : **Create access key**
- Use case : **CLI** ou **Local code**
- ☑️ Cocher "I understand..."
- Next > Create

### 6. Récupérer les clés
**Option A :** Download .csv file
**Option B :** Copier manuellement :
- Access key ID : `AKIA...`
- Secret access key : (cliquer Show)

---

## ⚠️ IMPORTANT

Vous ne verrez la Secret access key **QU'UNE SEULE FOIS** !

Si vous fermez sans copier :
- ❌ Clé perdue définitivement
- 🔄 Il faudra recréer une nouvelle clé

---

## 🚀 Une fois les clés obtenues

**Donnez-moi les deux clés :**

```
Access key ID: AKIA..................
Secret access key: ......................
```

OU le contenu du fichier CSV

**Je mettrai à jour automatiquement :**
- `.env.local`
- Redémarrage du serveur
- Test AWS Rekognition

---

## ✅ Résultat attendu

Au lieu de :
```
❌ Erreur Amazon Rekognition: UnrecognizedClientException
```

Vous verrez :
```
✅ Amazon Rekognition: Mesure réussie
```

Et 4 services actifs : OpenAI + Claude + Google + **AWS** ! 🎉
