# 🚨 CapRover Troubleshooting

## Problème : Build Failed

### Erreur typique
```
The command '/bin/sh -c npm run build' returned a non-zero code: 1
```

### Solutions appliquées

#### 1. **Client OpenAI initialisé dans la fonction**
- **Problème** : `process.env.OPENAI_API_KEY` accessible au moment du build
- **Solution** : Client initialisé dans `getOpenAIClient()` au runtime

#### 2. **Variables d'environnement**
- **Build** : Pas besoin d'`OPENAI_API_KEY` pour le build
- **Runtime** : `OPENAI_API_KEY` requis uniquement pour l'API

#### 3. **Dockerfile optimisé**
```dockerfile
# Build sans variables d'environnement sensibles
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build
```

#### 4. **.dockerignore strict**
- Exclusion de tous les fichiers `.env*`
- Exclusion des logs et fichiers temporaires

## Variables d'environnement CapRover

### Obligatoire
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Optionnelles (gérées automatiquement)
```bash
PORT=80
HOSTNAME=0.0.0.0
NODE_ENV=production
```

## Test local

```bash
# Test du build
npm run build

# Test Docker (optionnel)
./test-docker.sh
```

## Déploiement CapRover

1. **Upload** : Via interface ou Git
2. **Variables** : Ajouter uniquement `OPENAI_API_KEY`
3. **Build** : CapRover exécute automatiquement
4. **Deploy** : Application disponible sur votre domaine

## Logs CapRover

En cas de problème, vérifier les logs dans l'interface CapRover :
- **Build logs** : Erreurs de compilation
- **App logs** : Erreurs runtime
