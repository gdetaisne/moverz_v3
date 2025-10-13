# 📊 Comment accéder au tracking

## 🚀 Méthode 1 : API Dashboard (le + simple)

### Local
```bash
# 1. Démarrer l'app
npm run dev

# 2. Utiliser l'app (upload photos, changer d'étapes...)
open http://localhost:3000

# 3. Voir les métriques
curl http://localhost:3000/api/analytics/dashboard | jq
# Ou dans le navigateur:
open http://localhost:3000/api/analytics/dashboard
```

### Production
```bash
curl https://movers-test.gslv.cloud/api/analytics/dashboard | jq
```

---

## 🗄️ Méthode 2 : Prisma Studio

```bash
# Ouvrir l'explorateur de base de données
npx prisma studio

# Accès: http://localhost:5555
# → Cliquer sur "AnalyticsEvent"
```

Tu verras tous les événements en détail :
- userId
- eventType
- metadata (JSON)
- createdAt

---

## 📈 Méthode 3 : PostHog (dashboards visuels)

### Setup rapide

1. **Créer compte gratuit** : https://app.posthog.com

2. **Copier ta clé API** (Project Settings → API Keys)

3. **Ajouter dans `.env.local`** :
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_VOTRE_CLE_ICI
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

4. **Redémarrer l'app**
```bash
npm run dev
```

5. **Utiliser l'app** (upload photos, etc.)

6. **Voir les dashboards PostHog** : https://app.posthog.com
   - Funnels
   - Session replay
   - Graphiques temps réel
   - User paths

---

## 🎯 Événements trackés

| Événement | Quand | Métadata |
|-----------|-------|----------|
| `app_opened` | Ouverture app | `userId` |
| `step_reached` | Navigation étapes | `step` (1-5) |
| `photo_uploaded` | Photo uploadée | `photoId`, `roomType`, `confidence`, `duration_ms` |
| `room_validation_completed` | Validation pièces OK | `roomCount`, `totalPhotos` |
| `quote_submitted` | Envoi devis | `projectId`, `batchId`, `photosCount`, `roomCount` |

---

## 🔍 Requêtes SQL directes

### Événements récents
```sql
SELECT * FROM "AnalyticsEvent" 
ORDER BY "createdAt" DESC 
LIMIT 20;
```

### Utilisateurs actifs (7j)
```sql
SELECT COUNT(DISTINCT "userId") as active_users
FROM "AnalyticsEvent"
WHERE "createdAt" >= NOW() - INTERVAL '7 days';
```

### Funnel de conversion
```sql
SELECT 
  metadata->>'step' as step,
  COUNT(DISTINCT "userId") as users
FROM "AnalyticsEvent"
WHERE "eventType" = 'step_reached'
  AND "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY metadata->>'step'
ORDER BY step;
```

### Photos uploadées par jour
```sql
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as photos
FROM "AnalyticsEvent"
WHERE "eventType" = 'photo_uploaded'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

---

## 💡 Tips

- **PostHog est optionnel** : Le tracking fonctionne sans (DB seulement)
- **Gratuit** : 1M events/mois inclus
- **Vie privée** : Toutes les données restent chez toi (DB) + PostHog EU disponible

---

## 🚨 Debugging

### Voir les events dans la console navigateur
```javascript
// Dans la console du navigateur
localStorage.setItem('debug', 'posthog');
// Recharger la page
```

### Vérifier si PostHog est actif
```javascript
// Dans la console
window.posthog
// → doit retourner l'objet PostHog
```

### Tester manuellement un événement
```javascript
// Dans la console
if (window.posthog) {
  window.posthog.capture('test_event', { 
    test: true,
    timestamp: Date.now()
  });
}
```

