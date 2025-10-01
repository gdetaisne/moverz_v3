# 🚀 SETUP GITHUB ACTIONS - ÉTAPES À SUIVRE

## ✅ Ce que j'ai fait pour vous

1. ✅ Créé `.github/workflows/tests.yml`
2. ✅ Configuré les déclencheurs :
   - À chaque commit sur `main` ou `dev`
   - Tous les jours à 6h heure française
3. ✅ Configuré la notification email en cas d'échec

---

## 🔧 Ce que VOUS devez faire (10 minutes)

### Étape 1 : Créer un App Password Gmail (5 min)

1. **Aller sur** : https://myaccount.google.com/apppasswords
   
2. **Se connecter** avec votre compte Gmail
   
3. **Sélectionner** :
   - App : **Mail**
   - Device : **Autre (nom personnalisé)**
   
4. **Nom** : `GitHub Actions moverz_v3`
   
5. **Cliquer sur** "Générer"
   
6. **Copier** le mot de passe de 16 caractères (ex: `abcd efgh ijkl mnop`)
   
7. ⚠️ **Important** : Garder cette fenêtre ouverte, vous allez en avoir besoin !

---

### Étape 2 : Configurer les Secrets GitHub (5 min)

1. **Aller sur** : https://github.com/VOTRE_USERNAME/moverz_v3
   
2. **Cliquer sur** : **Settings** (en haut à droite)
   
3. **Dans le menu à gauche** : **Secrets and variables** → **Actions**
   
4. **Cliquer sur** : **New repository secret** (bouton vert)
   
5. **Ajouter 3 secrets** :

#### Secret 1 : EMAIL_USERNAME
```
Name: EMAIL_USERNAME
Value: votre.email@gmail.com
```
Cliquer sur **Add secret**

#### Secret 2 : EMAIL_PASSWORD
```
Name: EMAIL_PASSWORD
Value: [coller le mot de passe de 16 caractères de l'Étape 1]
```
Cliquer sur **Add secret**

#### Secret 3 : EMAIL_TO
```
Name: EMAIL_TO
Value: votre.email@gmail.com (ou un autre email si vous préférez)
```
Cliquer sur **Add secret**

---

### Étape 3 : Pousser le Workflow sur GitHub (2 min)

```bash
# Ajouter les fichiers
git add .github/

# Commiter
git commit -m "Add CI/CD: tests automatiques à chaque commit + 6h"

# Pousser sur GitHub
git push origin main
```

---

### Étape 4 : Vérifier que ça Marche (1 min)

1. **Aller sur** : https://github.com/VOTRE_USERNAME/moverz_v3/actions
   
2. Vous devriez voir le workflow **"Tests Unitaires"** en cours d'exécution 🟡
   
3. Attendre 30 secondes...
   
4. ✅ Badge vert → Tout fonctionne !
   ❌ Badge rouge → Voir les logs pour comprendre le problème

---

## 🧪 Tester la Notification Email

### Créer volontairement un test qui échoue

```bash
# Modifier un test pour le faire échouer
cat >> lib/__tests__/depthDatabase.test.ts << 'TEST'

  it('TEST VOLONTAIRE QUI ÉCHOUE', () => {
    expect(1 + 1).toBe(3); // Va échouer !
  });
TEST

# Commiter et pousser
git add lib/__tests__/depthDatabase.test.ts
git commit -m "Test: vérifier notification email"
git push origin main
```

**Résultat attendu** :
1. Tests échouent sur GitHub ❌
2. Vous recevez un email dans les 2 minutes 📧
3. Vous pouvez ensuite supprimer ce test

```bash
# Supprimer le test qui échoue
git checkout lib/__tests__/depthDatabase.test.ts
git add lib/__tests__/depthDatabase.test.ts
git commit -m "Remove failing test"
git push origin main
```

---

## 📊 Résumé de la Configuration

### Déclencheurs
- ✅ **Push sur main/dev** : Tests lancés automatiquement
- ✅ **Pull Request vers main** : Tests lancés
- ✅ **Tous les jours à 6h** : Tests lancés (heure française)
- ✅ **Manuel** : Bouton sur GitHub Actions

### Notifications
- 📧 **Email si échec** : Vous recevez un email détaillé
- 🔕 **Rien si succès** : Pas de spam !

### Durée
- ⚡ **~30 secondes** par run
- 💰 **Gratuit** (sous la limite de 2000 min/mois)

---

## 🎯 Prochaine Action

**Une fois que vous avez fait les 4 étapes ci-dessus, votre CI/CD sera opérationnel !**

Vous pourrez alors :
1. ✅ Coder tranquillement
2. ✅ Push sur GitHub
3. ✅ Les tests se lancent automatiquement
4. ✅ Vous recevez un email SEULEMENT en cas de problème

**Temps total : 10 minutes** ⏱️

---

## 📧 Besoin d'aide ?

Si vous avez un problème :
1. Vérifier les logs sur GitHub Actions
2. Vérifier que les secrets sont bien configurés
3. Vérifier que l'App Password Gmail est correct

**Le workflow est prêt, il ne manque plus que la configuration des secrets ! 🚀**
