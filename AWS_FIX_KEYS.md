# 🔧 Recréer les clés AWS Rekognition

## Étapes rapides :

1. **Console AWS IAM** : https://console.aws.amazon.com/iam/home#/users

2. **Cliquez sur** : moverz-rekognition-user (ou votre utilisateur)

3. **Security credentials** > Access keys

4. **Désactiver l'ancienne** : 
   - Trouver : AKIA_VOTRE_AWS_ACCESS_KEY_ICI
   - Actions > Deactivate (ou Delete)

5. **Créer nouvelle clé** :
   - Create access key
   - Use case : "Command Line Interface (CLI)"
   - Cocher "I understand..."
   - Create access key

6. **Télécharger CSV** OU copier :
   - Access key ID
   - Secret access key

7. **Me donner les nouvelles clés** : Je mettrai à jour .env.local

---

## ⏱️ Alternative : Ignorer AWS pour l'instant

OpenAI + Claude + Google Vision = Déjà excellent !
AWS Rekognition est un "bonus" pour encore plus de précision.

**Vous voulez :**
- A) Recréer les clés AWS maintenant (5 min)
- B) Tester d'abord avec Google Vision seul
