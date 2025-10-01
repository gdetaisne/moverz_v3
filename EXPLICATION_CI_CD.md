# 🤖 Automatisation des Tests : CI/CD

## Votre Question

> "Ces tests unitaires, ça marche comment après ?  
> Ils tournent une ou deux fois par jour et j'ai une notification mail si il y a un problème ?"

**Réponse** : Oui, exactement ! C'est ce qu'on appelle **CI/CD** (Intégration Continue)

---

## 🎯 Comment ça Marche ?

### Scénario Automatique Idéal

```
1. Vous modifiez du code
2. Vous faites un commit Git
3. Vous push sur GitHub
   ↓
4. 🤖 GitHub Actions démarre AUTOMATIQUEMENT
   ↓
5. 🧪 Lance les 48 tests
   ↓
6. ✅ Si tout passe → Déploiement automatique
   ❌ Si échec → Email + notification Slack
```

**Vous n'avez RIEN à faire !** Tout est automatique ! 🎉

---

## 🔧 Stratégies d'Automatisation

### Option 1 : GitHub Actions (Recommandé ✅)

**Gratuit** pour les projets publics/privés (2000 min/mois gratuit)

#### Déclencheurs Possibles
```yaml
# A. À chaque push/commit
on: [push]

# B. À chaque Pull Request
on: [pull_request]

# C. Tous les jours à 9h
on:
  schedule:
    - cron: '0 9 * * *'  # 9h chaque jour

# D. Manuellement (bouton dans GitHub)
on: [workflow_dispatch]
```

#### Ce qui se passe
```
1. Vous push du code sur GitHub
   ↓
2. GitHub détecte le push
   ↓
3. Lance un serveur virtuel (Ubuntu)
   ↓
4. Installe Node.js
   ↓
5. Installe les dépendances (npm install)
   ↓
6. Lance les tests (npm test)
   ↓
7. ✅ Tout passe → Badge vert ✅
   ❌ Échec → Badge rouge + email ❌
```

---

### Option 2 : GitLab CI/CD

Similaire à GitHub Actions, avec interface différente.

---

### Option 3 : Cron Job (Serveur)

Lancer les tests sur votre serveur tous les jours.

```bash
# Crontab : tous les jours à 9h
0 9 * * * cd /path/to/moverz_v3 && npm test && mail -s "Tests OK" vous@email.com
```

---

## 🚀 Setup GitHub Actions (Le Plus Simple)

### Fichier à Créer

```yaml
# .github/workflows/tests.yml

name: Tests Unitaires

on:
  push:
    branches: [main, dev]  # À chaque push sur main ou dev
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 9 * * *'    # Tous les jours à 9h UTC

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      # 1. Récupérer le code
      - uses: actions/checkout@v3
      
      # 2. Installer Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      # 3. Installer les dépendances
      - name: Install dependencies
        run: npm install
      
      # 4. Lancer les tests
      - name: Run tests
        run: npm test
      
      # 5. Envoyer notification si échec
      - name: Send email on failure
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 587
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          to: vous@email.com
          from: github-actions@noreply.com
          subject: ❌ Tests échoués sur moverz_v3
          body: |
            Les tests ont échoué !
            
            Commit : ${{ github.sha }}
            Auteur : ${{ github.actor }}
            Branche : ${{ github.ref }}
            
            Voir les détails : ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

---

## 📧 Notifications (Options)

### 1. Email ✉️

**Avec GitHub Actions** :
```yaml
- name: Send email
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 587
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    to: vous@email.com
    subject: Tests échoués
    body: Vérifier les logs sur GitHub
```

**Email que vous recevez** :
```
De: github-actions@noreply.com
À: vous@email.com
Objet: ❌ Tests échoués sur moverz_v3

Les tests ont échoué !

Commit : abc123def
Auteur : guillaumestehelin
Branche : main

Voir détails : https://github.com/vous/moverz_v3/actions/runs/12345
```

---

### 2. Slack 💬

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '❌ Tests échoués sur moverz_v3'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Message Slack** :
```
🤖 GitHub Actions
❌ Tests échoués sur moverz_v3

Branche : main
Commit : abc123def
Auteur : @guillaumestehelin

[Voir les logs]
```

---

### 3. Discord 🎮

```yaml
- name: Discord Notification
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: "Tests Échoués"
    description: "Les tests unitaires ont échoué sur main"
    color: 0xff0000
```

---

### 4. Badge GitHub (Visuel)

Ajouter dans votre `README.md` :

```markdown
![Tests](https://github.com/vous/moverz_v3/actions/workflows/tests.yml/badge.svg)
```

**Résultat** :
- ✅ Badge vert si tests passent
- ❌ Badge rouge si tests échouent

---

## 📊 Exemple Concret

### Workflow Complet

```yaml
# .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, dev]
  schedule:
    - cron: '0 9,17 * * 1-5'  # 9h et 17h, lundi à vendredi

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      
      - name: Install dependencies
        run: npm ci  # Plus rapide que npm install
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
      
      # Notification Slack en cas d'échec
      - name: Slack Notification (Failure)
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: |
            ❌ Tests échoués sur moverz_v3
            Branche : ${{ github.ref }}
            Commit : ${{ github.sha }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      
      # Notification Slack en cas de succès
      - name: Slack Notification (Success)
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: |
            ✅ Tous les tests passent sur moverz_v3
            Branche : ${{ github.ref }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🎯 Fréquences Recommandées

### Pour Votre Projet

#### Tests Unitaires (Rapides)
```yaml
# À chaque push + 2×/jour
on:
  push:
    branches: [main, dev]
  schedule:
    - cron: '0 9,17 * * *'  # 9h et 17h
```

**Pourquoi ?**
- ✅ Rapide (0.5s)
- ✅ Gratuit (compute)
- ✅ Détecte les régressions immédiatement

---

#### Tests d'Intégration IA (Lents & Coûteux)
```yaml
# 1× par jour seulement
on:
  schedule:
    - cron: '0 3 * * *'  # 3h du matin (moins cher)
  workflow_dispatch:     # + bouton manuel
```

**Pourquoi ?**
- 🐌 Lent (5-10min)
- 💰 Coûteux (~$0.75 par run)
- ✅ Suffisant pour détecter les problèmes API

---

## 💰 Coûts

### GitHub Actions (Gratuit)
```
Plan Gratuit :
- 2000 minutes/mois (projets privés)
- Illimité (projets publics)

Votre Usage Estimé :
- Tests unitaires : 1 min/run
- 2 runs/jour × 30 jours = 60 min/mois
- Tests IA : 10 min/run × 30 = 300 min/mois
Total : 360 min/mois → ✅ Dans le gratuit !
```

---

## 📝 Setup Complet : Guide Étape par Étape

### Étape 1 : Créer le Workflow (5 min)

```bash
mkdir -p .github/workflows
cat > .github/workflows/tests.yml << 'YAML'
name: Tests Unitaires

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 9,17 * * *'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
YAML
```

---

### Étape 2 : Configurer les Secrets (5 min)

Sur GitHub :
1. Aller dans **Settings** → **Secrets and variables** → **Actions**
2. Ajouter :
   - `EMAIL_USERNAME` : votre email Gmail
   - `EMAIL_PASSWORD` : [App Password Gmail](https://myaccount.google.com/apppasswords)
   - `SLACK_WEBHOOK` (optionnel) : Webhook Slack

---

### Étape 3 : Commit & Push (2 min)

```bash
git add .github/workflows/tests.yml
git commit -m "Add CI/CD tests automation"
git push origin main
```

---

### Étape 4 : Vérifier (1 min)

1. Aller sur GitHub → onglet **Actions**
2. Voir le workflow en cours d'exécution
3. ✅ Badge vert si tout passe !

---

## 🎯 Résumé Final

### Comment ça Marche Après ?

#### Automatique (Recommandé)
```
1. Vous push du code
   ↓
2. GitHub lance les tests AUTOMATIQUEMENT
   ↓
3. ✅ Passe → Badge vert, tout va bien
   ❌ Échec → Email + Slack + Badge rouge
```

#### Fréquence
```
- À chaque push : ✅ Tests unitaires
- 2× par jour (9h, 17h) : ✅ Tests unitaires
- 1× par jour (3h) : 🤖 Tests IA (optionnel)
```

#### Notifications
```
✉️  Email : "Tests échoués sur moverz_v3"
💬 Slack : "❌ Tests échoués, branche main"
🎯 Badge : Rouge sur GitHub README
```

---

## 🚀 Ma Recommandation

### Setup Minimal (15 min)
1. ✅ Créer `.github/workflows/tests.yml`
2. ✅ Push sur GitHub
3. ✅ Tests lancés automatiquement à chaque push

### Setup Complet (30 min)
1. ✅ Workflow GitHub Actions
2. ✅ Notifications email
3. ✅ Badge dans README
4. ✅ Cron 2× par jour

---

## 💬 Voulez-vous que je le Configure ?

**Je peux créer le fichier GitHub Actions maintenant !**

Ça lancera vos 48 tests :
- ✅ À chaque push
- ✅ 2× par jour (9h, 17h)
- ✅ Notification email si échec

**Temps : 5 minutes**

Voulez-vous que je le fasse ? 😊
