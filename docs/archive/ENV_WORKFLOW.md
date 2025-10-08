# 🔐 Workflow de Gestion des Variables d'Environnement

## 🎯 Problème Résolu

**Avant** : Les clés API étaient perdues à chaque clone, causant des erreurs récurrentes.

**Maintenant** : Système automatisé pour gérer les variables d'environnement en local ET sur CapRover.

## 🚀 Workflow Complet

### 1. 🏠 Configuration Locale (Nouveau Développeur)

```bash
# 1. Cloner le projet
git clone <repo-url>
cd moverz_v3-2

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
npm run setup:env

# 4. Éditer .env avec vos clés
nano .env

# 5. Vérifier la configuration
npm run check:env

# 6. Démarrer le serveur
npm run dev
```

### 2. 🚀 Déploiement CapRover

```bash
# Option A: Script automatisé (recommandé)
./deploy-caprover.sh your-app-name

# Option B: Manuel
# 1. Configurer les variables sur CapRover
# 2. Build et déployer
npm run build
caprover deploy -a your-app-name
```

### 3. 🔄 Mise à Jour des Clés

```bash
# 1. Modifier .env local
nano .env

# 2. Vérifier
npm run check:env

# 3. Redéployer
./deploy-caprover.sh your-app-name
```

## 📁 Fichiers Créés

- `setup-env.js` : Script de création du .env
- `deploy-caprover.sh` : Script de déploiement automatisé
- `CAPROVER_ENV_SETUP.md` : Guide détaillé CapRover
- `ENV_WORKFLOW.md` : Ce guide

## 🛠️ Scripts NPM Ajoutés

```bash
npm run setup:env    # Créer .env à partir du template
npm run check:env    # Vérifier les variables chargées
npm run db:push      # Synchroniser la base de données
npm run db:generate  # Générer le client Prisma
npm run db:reset     # Reset complet de la DB
```

## 🔒 Sécurité

### ✅ Variables Protégées
- `.env` dans .gitignore
- `.env.local` dans .gitignore
- Tous les fichiers de credentials

### ✅ Template Public
- `.env.example` (à créer) : Template sans clés réelles
- `setup-env.js` : Génère .env localement

## 🎯 Avantages

1. **Pas de clés dans le code** : Sécurité maximale
2. **Configuration rapide** : Un script pour tout configurer
3. **Déploiement automatisé** : Variables synchronisées automatiquement
4. **Documentation claire** : Guides étape par étape
5. **Vérification facile** : Scripts de validation

## 🚨 En Cas de Problème

### Variables manquantes
```bash
npm run check:env
# Vérifier quelles variables sont manquantes
```

### Base de données inaccessible
```bash
npm run db:push
# Synchroniser le schéma Prisma
```

### Services IA inactifs
```bash
curl http://localhost:3001/api/ai-status
# Vérifier le statut des services
```

### Redémarrage complet
```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

## 📋 Checklist Déploiement

- [ ] Variables configurées localement (.env)
- [ ] Variables configurées sur CapRover
- [ ] Base de données accessible
- [ ] Services IA actifs
- [ ] Tests de fonctionnement OK
- [ ] Documentation à jour

## 🎉 Résultat

**Plus jamais de problème de clés API !** 

Le système est maintenant :
- ✅ Automatisé
- ✅ Sécurisé  
- ✅ Documenté
- ✅ Facile à utiliser
