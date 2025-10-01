# 🎯 GUIDE INTERACTIF - Configuration GitHub Actions

**Temps estimé : 10 minutes**

---

## ✋ ÉTAPE 1 : App Password Gmail (5 min)

### 1.1 Ouvrir le lien
👉 **Ouvrir dans votre navigateur** : https://myaccount.google.com/apppasswords

### 1.2 Se connecter
- Se connecter avec votre compte Gmail
- Si vous avez la 2FA : entrer le code

### 1.3 Créer le mot de passe
1. **Sélectionner l'app** : Mail
2. **Sélectionner l'appareil** : Autre (nom personnalisé)
3. **Nom** : `GitHub Actions moverz_v3`
4. Cliquer sur **"Générer"**

### 1.4 Copier le mot de passe
```
Vous verrez : abcd efgh ijkl mnop
              ^^^^^^^^^^^^^^^^^^^^
              (16 caractères en 4 blocs)
```

⚠️ **IMPORTANT** : 
- Copier ce mot de passe
- Ne pas fermer la fenêtre (vous en aurez besoin à l'étape 2)

✅ **Étape 1 terminée !** Passer à l'étape 2.

---

## 🔐 ÉTAPE 2 : Secrets GitHub (5 min)

### 2.1 Aller sur votre repo GitHub
👉 Ouvrir : https://github.com/VOTRE_USERNAME/moverz_v3

⚠️ **Remplacer** `VOTRE_USERNAME` par votre nom d'utilisateur GitHub

### 2.2 Aller dans Settings
- Cliquer sur **"Settings"** (onglet en haut à droite)
- Si vous ne voyez pas Settings, c'est que vous n'êtes pas propriétaire du repo

### 2.3 Aller dans Secrets
- Dans le menu à gauche : **"Secrets and variables"**
- Cliquer sur **"Actions"**

### 2.4 Ajouter le Secret 1 : EMAIL_USERNAME
1. Cliquer sur **"New repository secret"** (bouton vert)
2. **Name** : `EMAIL_USERNAME`
3. **Value** : `votre.email@gmail.com` (votre email complet)
4. Cliquer sur **"Add secret"**

✅ Secret 1 créé !

### 2.5 Ajouter le Secret 2 : EMAIL_PASSWORD
1. Cliquer à nouveau sur **"New repository secret"**
2. **Name** : `EMAIL_PASSWORD`
3. **Value** : Coller le mot de passe de 16 caractères de l'Étape 1
   ```
   (ex: abcdefghijklmnop - SANS ESPACES !)
   ```
4. Cliquer sur **"Add secret"**

✅ Secret 2 créé !

### 2.6 Ajouter le Secret 3 : EMAIL_TO
1. Cliquer à nouveau sur **"New repository secret"**
2. **Name** : `EMAIL_TO`
3. **Value** : `votre.email@gmail.com` (même email ou un autre)
4. Cliquer sur **"Add secret"**

✅ Secret 3 créé !

### 2.7 Vérifier
Vous devriez maintenant voir 3 secrets :
- ✅ EMAIL_USERNAME
- ✅ EMAIL_PASSWORD
- ✅ EMAIL_TO

✅ **Étape 2 terminée !** Passer à l'étape 3.

---

## 🚀 ÉTAPE 3 : Push sur GitHub (2 min)

### 3.1 Retour au terminal
Ouvrir votre terminal dans le dossier `moverz_v3`

### 3.2 Vérifier les fichiers
```bash
git status
```

Vous devriez voir :
```
Untracked files:
  .github/
  jest.config.js
  lib/__tests__/
  services/__tests__/
  ...
```

### 3.3 Ajouter les fichiers
```bash
git add .github/
git add jest.config.js
git add lib/__tests__/
git add services/__tests__/
git add package.json
```

Ou plus simple :
```bash
git add .
```

### 3.4 Commiter
```bash
git commit -m "Add CI/CD: tests unitaires + GitHub Actions"
```

### 3.5 Pousser sur GitHub
```bash
git push origin main
```

✅ **Étape 3 terminée !** Passer à l'étape 4.

---

## ✅ ÉTAPE 4 : Vérifier que ça marche (1 min)

### 4.1 Aller sur GitHub Actions
👉 Ouvrir : https://github.com/VOTRE_USERNAME/moverz_v3/actions

### 4.2 Voir le workflow en cours
Vous devriez voir :
```
🟡 Tests Unitaires
   Running...
```

### 4.3 Attendre 30 secondes
Le workflow va :
1. Installer Node.js
2. Installer les dépendances
3. Lancer les 48 tests

### 4.4 Résultat
Après ~30 secondes :

**Si tout est OK** ✅ :
```
✅ Tests Unitaires
   All tests passed
```

**Si erreur** ❌ :
```
❌ Tests Unitaires
   Some tests failed
```

✅ **Étape 4 terminée !**

---

## 🧪 BONUS : Tester la notification email

### Créer volontairement un test qui échoue

```bash
# Ajouter un test qui va échouer
cat >> lib/__tests__/depthDatabase.test.ts << 'TEST'

  it('TEST EMAIL - Va échouer volontairement', () => {
    expect(1 + 1).toBe(3); // Faux !
  });
});
TEST

# Commiter et pousser
git add lib/__tests__/depthDatabase.test.ts
git commit -m "Test: vérifier notification email"
git push origin main
```

**Résultat attendu** :
1. Les tests échouent sur GitHub ❌
2. Vous recevez un email dans 2-3 minutes 📧
3. L'email contient le lien vers les logs

### Supprimer le test qui échoue

```bash
# Restaurer le fichier original
git checkout lib/__tests__/depthDatabase.test.ts

# Push
git add lib/__tests__/depthDatabase.test.ts
git commit -m "Remove test email"
git push origin main
```

✅ **Tests repassent au vert !**

---

## 🎉 FÉLICITATIONS !

Votre CI/CD est maintenant opérationnel !

### Ce qui fonctionne MAINTENANT
- ✅ Tests à chaque commit
- ✅ Tests tous les jours à 6h
- ✅ Email si échec
- ✅ Badge sur GitHub
- ✅ Workflow visible dans Actions

### Commandes utiles
```bash
# Voir le statut des tests
npm test

# Lancer en mode watch
npm run test:watch

# Générer le coverage
npm run test:coverage
```

---

## ❓ Problèmes Fréquents

### Email non reçu
- Vérifier que les 3 secrets sont bien configurés
- Vérifier le mot de passe Gmail (16 caractères, sans espaces)
- Vérifier les spams

### Tests échouent sur GitHub mais pas en local
- Vérifier que toutes les dépendances sont dans `package.json`
- Vérifier qu'il n'y a pas de fichiers `.env` non commités

### Workflow ne se lance pas
- Vérifier que `.github/workflows/tests.yml` existe
- Vérifier la syntaxe YAML (indentation)
- Voir l'onglet Actions sur GitHub pour les erreurs

---

**Besoin d'aide ?** Consultez les autres fichiers `.md` créés !
