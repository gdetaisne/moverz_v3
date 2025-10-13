# 🧪 Test du Tracking Analytics - LOCAL

## ✅ Table AnalyticsEvent créée !

La table a été créée dans `prisma/prisma/dev.db` avec succès.

---

## 🚀 Lancer le test

### 1. Démarrer l'app
```bash
npm run dev
```

### 2. Ouvrir l'app
```
http://localhost:3000
```

### 3. Faire des actions
- Upload 2-3 photos
- Change d'étapes (1 → 2 → 3...)
- Valide des pièces

### 4. Voir les métriques

**Dashboard API :**
```bash
curl http://localhost:3000/api/analytics/dashboard | jq
```

Ou dans le navigateur :
```
http://localhost:3000/api/analytics/dashboard
```

**Prisma Studio (explorer la DB) :**
```bash
npx prisma studio
```
Puis ouvrir la table `AnalyticsEvent`

---

## 📊 Ce que tu devrais voir

### Dashboard API (après quelques actions)
```json
{
  "metrics": {
    "activeUsers": 1,
    "photosUploaded": 3,
    "quotesSubmitted": 0,
    "conversionRate": "N/A"
  },
  "funnel": [
    { "step": 1, "users": 1 },
    { "step": 2, "users": 1 },
    { "step": 3, "users": 0 }
  ]
}
```

### Table AnalyticsEvent (SQLite)
| id | userId | eventType | metadata | createdAt |
|----|--------|-----------|----------|-----------|
| abc | user-x | app_opened | {} | 2025-01-12 ... |
| def | user-x | photo_uploaded | {"roomType":"salon"} | 2025-01-12 ... |
| ghi | user-x | step_reached | {"step":2} | 2025-01-12 ... |

---

## ✅ Si tout marche...

Passe à l'étape suivante : **Migration PRODUCTION**

Voir : `deploy-analytics-prod.sh`

---

## ❌ Si ça ne marche pas...

Vérifier :
1. La table existe bien : `sqlite3 prisma/prisma/dev.db ".tables"`
2. Le serveur tourne : `lsof -i :3000`
3. Les logs : Console navigateur (F12)
4. Les logs serveur : Terminal où tourne `npm run dev`

