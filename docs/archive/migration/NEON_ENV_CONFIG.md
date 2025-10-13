# Configuration Environnement Neon

## Variables requises dans `.env`

Créez un fichier `.env` à la racine avec :

```bash
# DATABASE CONFIGURATION - POSTGRES (NEON)
# Runtime connection (pooler Neon pour performances)
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[POOLER_HOST]/[DATABASE]?sslmode=require&connect_timeout=15&pool_timeout=15&pgbouncer=true"

# Migration/Studio connection (connexion directe sans pooler)
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[DIRECT_HOST]/[DATABASE]?sslmode=require&connect_timeout=15"

# AI SERVICE
AI_SERVICE_URL="http://localhost:8000"

# CORS & PORT
CORS_ORIGIN="http://localhost:3000"
PORT=3001

# JWT (dev)
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# NODE ENV
NODE_ENV="development"
```

## Comment obtenir les URLs Neon ?

1. Aller sur https://console.neon.tech/
2. Créer ou sélectionner votre projet
3. Dans "Connection Details" :
   - **Pooled connection** → `DATABASE_URL` (pour runtime)
   - **Direct connection** → `DIRECT_URL` (pour migrations/studio)

## Différence Pooler vs Direct

- **Pooled (pgbouncer)** : pour l'app en prod/dev (gère connexions)
- **Direct** : pour `prisma migrate` et `prisma studio` (nécessite connexion complète)

