# 🚀 Déploiement Immédiat - Guide Express

**Date** : 12 octobre 2025  
**Durée** : ⏱️ 5 minutes

---

## ✅ Situation

### Variables CapRover : ✅ PARFAITES
Toutes vos variables d'environnement sont **DÉJÀ CORRECTES**, incluant :
- ✅ `DATABASE_URL` → PostgreSQL
- ✅ `DIRECT_URL` → PostgreSQL  
- ✅ `JWT_SECRET` → Sécurisé
- ✅ Toutes les autres configs

### Corrections Locales : ✅ COMPLÈTES
- ✅ `schema.prisma` → PostgreSQL
- ✅ `Dockerfile` → `prisma migrate deploy`
- ✅ Prisma Client régénéré

### Action Unique Requise : Force Rebuild Docker

---

## 🎯 3 Étapes Simples

### 1️⃣ Commit & Push (1 min)

```bash
cd /Users/guillaumestehelin/moverz_v3-1

# Vérifier les changements
git status

# Commit
git add prisma/schema.prisma Dockerfile scripts/ *.md
git commit -m "fix(db): align schema.prisma with PostgreSQL migrations

- Corrected prisma/schema.prisma provider: postgresql
- Updated Dockerfile CMD: prisma migrate deploy
- Regenerated Prisma Client for PostgreSQL
- Added verification scripts

Fixes production error: 'URL must start with protocol file:'
Related: LOT 5-11 (PostgreSQL migration)"

# Push
git push origin main
```

---

### 2️⃣ Force Rebuild sur CapRover (3 min)

1. **Ouvrir** : https://captain.gslv.cloud/
2. **Aller à** : Apps → `movers-test`
3. **Onglet** : `Deployment`
4. **Cliquer** : `Force Rebuild` (bouton rouge)
5. **Attendre** : Build termine (~3-5 min)

**Logs à surveiller** :
```
✔ Generated Prisma Client  ← Doit dire "PostgreSQL"
Running migrate deploy      ← Applique les migrations
Server listening on port 3001
```

---

### 3️⃣ Tester (1 min)

#### Test 1 : Health Check

```bash
curl -sS https://movers-test.gslv.cloud/inventaire-ia/api/ai-status | jq
```

**✅ Attendu** : `200 OK` avec JSON (pas d'erreur Prisma)

#### Test 2 : Créer une Room

```bash
curl -sS -X POST https://movers-test.gslv.cloud/inventaire-ia/api/rooms \
  -H "content-type: application/json" \
  -H "x-user-id: test-$(date +%s)" \
  -d '{"name":"Test Fix DB"}' | jq
```

**✅ Attendu** : `201 Created` avec objet room

#### Test 3 : Lister les Rooms

```bash
curl -sS "https://movers-test.gslv.cloud/inventaire-ia/api/rooms?userId=test-..." | jq
```

**✅ Attendu** : `200 OK` avec array

---

## ✅ Checklist Rapide

- [ ] Commit + Push effectué
- [ ] Force Rebuild CapRover lancé
- [ ] Build réussi (logs sans erreur)
- [ ] Test 1 : /api/ai-status → 200 OK
- [ ] Test 2 : POST /api/rooms → 201
- [ ] Test 3 : GET /api/rooms → 200
- [ ] App accessible : https://movers-test.gslv.cloud/inventaire-ia

---

## 🎉 C'est Tout !

**Pas besoin de** :
- ❌ Modifier les variables CapRover (déjà bonnes)
- ❌ Créer une nouvelle base de données
- ❌ Migrer manuellement

**Juste** : Commit + Push + Force Rebuild = ✅ Problème résolu

---

## 🐛 Si Erreur Persiste

### Logs : "Can't reach database server"

**Solution** : Vérifier que le service PostgreSQL CapRover est démarré
```bash
# Dashboard → Apps → postgres-monitoring → Assurez-vous qu'il est "running"
```

### Logs : "Invalid prisma.user..."

**Solution** : Vérifier que le rebuild est complet
```bash
# Chercher dans les logs :
# "Generated Prisma Client" ← Doit être présent
```

### Tests : 404 Not Found

**Solution** : Ajouter `/inventaire-ia` au chemin
```bash
# Votre BASE_PATH=/inventaire-ia
# URLs : https://movers-test.gslv.cloud/inventaire-ia/api/...
```

---

**Temps Total Estimé** : ⏱️ **5 minutes** (dont 3 min de build)

**Prêt ?** Lancez l'Étape 1 ! 🚀


