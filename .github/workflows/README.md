# 🤖 GitHub Actions - Configuration

## Workflows Configurés

### ✅ Tests Unitaires (`tests.yml`)

**Déclencheurs** :
- ✅ À chaque `git push` sur `main` ou `dev`
- ✅ À chaque Pull Request vers `main`
- ✅ Tous les jours à **6h heure française** (5h UTC)
- ✅ Manuellement via le bouton sur GitHub

**Actions** :
1. Récupère le code
2. Installe Node.js 20
3. Installe les dépendances (`npm ci`)
4. Lance les 48 tests (`npm test`)
5. 📧 Envoie un email si échec

---

## 📧 Configuration Email

### Étape 1 : Créer un App Password Gmail

1. Aller sur : https://myaccount.google.com/apppasswords
2. Sélectionner "Mail" et "Autre (nom personnalisé)"
3. Nom : `GitHub Actions moverz_v3`
4. Copier le mot de passe de 16 caractères

### Étape 2 : Ajouter les Secrets sur GitHub

1. Aller sur votre repo GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Cliquer sur **New repository secret**
4. Ajouter 3 secrets :

| Nom | Valeur |
|-----|--------|
| `EMAIL_USERNAME` | Votre adresse Gmail complète (ex: `vous@gmail.com`) |
| `EMAIL_PASSWORD` | Le mot de passe de 16 caractères généré |
| `EMAIL_TO` | L'email où recevoir les notifications (peut être le même) |

---

## 🧪 Tester le Workflow

### Méthode 1 : Push un commit
```bash
git add .github/workflows/tests.yml
git commit -m "Add CI/CD tests automation"
git push origin main
```

Puis aller sur GitHub → **Actions** pour voir le workflow en cours.

### Méthode 2 : Lancer manuellement
1. Aller sur GitHub → **Actions**
2. Sélectionner **Tests Unitaires**
3. Cliquer sur **Run workflow**
4. Choisir la branche `main`
5. Cliquer sur **Run workflow**

---

## 📊 Badge de Statut

Ajouter dans votre `README.md` :

```markdown
![Tests](https://github.com/VOTRE_USERNAME/moverz_v3/actions/workflows/tests.yml/badge.svg)
```

Remplacer `VOTRE_USERNAME` par votre nom d'utilisateur GitHub.

**Résultat** :
- ✅ Badge vert si tests passent
- ❌ Badge rouge si tests échouent

---

## ⏰ Planning des Tests

| Quand | Fréquence | Durée |
|-------|-----------|-------|
| À chaque commit | Variable | ~30s |
| Tous les jours | 6h heure française | ~30s |
| **Total mensuel** | ~90 exécutions | ~45 min |

**Coût : GRATUIT** ✅ (largement sous la limite de 2000 min/mois)

---

## 📧 Email de Notification

**Vous recevrez un email SEULEMENT en cas d'échec** :

```
De: GitHub Actions <noreply@github.com>
À: vous@email.com
Objet: ❌ Tests échoués sur moverz_v3

Les tests unitaires ont échoué sur moverz_v3 !

📋 Détails :
- Commit : abc123def
- Auteur : guillaumestehelin
- Branche : refs/heads/main
- Workflow : Tests Unitaires

🔗 Voir les logs :
https://github.com/vous/moverz_v3/actions/runs/12345

⏰ Date : 2025-10-01T06:00:00Z

---
Message du commit : Fix bug in depthDatabase
```

---

## 🔧 Dépannage

### Problème : Email non reçu
1. Vérifier que les secrets sont bien configurés
2. Vérifier que l'App Password Gmail est correct
3. Vérifier les logs du workflow sur GitHub Actions

### Problème : Tests échouent sur GitHub mais passent en local
1. Vérifier que toutes les dépendances sont dans `package.json`
2. Vérifier qu'il n'y a pas de fichiers locaux non commitées
3. Vérifier les versions de Node.js (workflow utilise Node 20)

### Problème : Workflow ne se lance pas
1. Vérifier que le fichier est bien dans `.github/workflows/`
2. Vérifier la syntaxe YAML (indentation)
3. Aller sur GitHub → Actions pour voir les erreurs

---

## 🎯 Prochaines Étapes

### Optionnel : Ajouter le Coverage
Modifier `tests.yml` pour ajouter :
```yaml
- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

### Optionnel : Ajouter Slack
Ajouter une notification Slack en cas d'échec :
```yaml
- name: Slack Notification
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📚 Ressources

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Syntaxe Cron](https://crontab.guru/)
- [Action Send Mail](https://github.com/dawidd6/action-send-mail)
- [Node Setup Action](https://github.com/actions/setup-node)

---

**Configuration créée le : 1er octobre 2025**  
**Tests configurés : 48 tests unitaires**  
**Fréquence : À chaque commit + tous les jours à 6h**

