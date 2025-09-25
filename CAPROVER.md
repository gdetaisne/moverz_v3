# 🚢 Déploiement CapRover

## Configuration requise

### Variables d'environnement obligatoires

Dans l'interface CapRover, ajoutez ces variables d'environnement :

```bash
# OBLIGATOIRE - Clé API OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# OPTIONNEL - Configuration serveur (CapRover gère automatiquement)
PORT=80
HOSTNAME=0.0.0.0
NODE_ENV=production

# OPTIONNEL - CORS
CORS_ORIGIN=*
```

### Port HTTP

- **Port par défaut** : `80` (géré automatiquement par CapRover)
- **Configuration** : Défini dans le Dockerfile avec `EXPOSE 80`
- **Variable** : `PORT=80` (optionnel, CapRover l'injecte automatiquement)

## Fichiers de déploiement

- ✅ `Dockerfile` - Image Docker optimisée
- ✅ `captain-definition` - Configuration CapRover
- ✅ `next.config.ts` - Mode standalone activé

## Déploiement

1. **Upload du code** : Via l'interface CapRover ou Git
2. **Variables d'environnement** : Ajoutez `OPENAI_API_KEY`
3. **Déploiement** : CapRover build et déploie automatiquement

## Fonctionnalités

- ✅ Analyse IA avec OpenAI GPT-4o
- ✅ Upload d'images optimisé
- ✅ Interface responsive
- ✅ Back-office de configuration
- ✅ Cache intelligent
- ✅ Compression d'images
