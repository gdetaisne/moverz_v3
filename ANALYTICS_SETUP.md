# 📊 Analytics Setup - Moverz

Guide d'installation ultra-simple pour le tracking utilisateur.

---

## 🚀 Installation (5 minutes)

### 1. Installer PostHog

```bash
npm install posthog-js
```

### 2. Variables d'environnement

Ajouter à `.env.local` :

```bash
# PostHog (gratuit jusqu'à 1M events/mois)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx  # Créer compte sur posthog.com
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 3. Migration DB

```bash
npx prisma db push
npx prisma generate
```

✅ **C'est tout !** Le tracking est automatique.

---

## 📈 Utilisation

### Frontend

```typescript
import { track, trackStep } from '@/lib/analytics';

// Track un événement
track('photo_uploaded', { photoId: '123', roomType: 'salon' });

// Track une étape
trackStep(2); // Étape 2 atteinte
```

### Backend (API)

```typescript
import { trackServer } from '@/lib/analytics';

await trackServer('inventory_analysis_completed', userId, {
  roomId: 'abc',
  itemsDetected: 25
});
```

---

## 📊 Dashboard

### Accéder aux métriques

```bash
# Métriques 7 derniers jours
curl http://localhost:3000/api/analytics/dashboard
```

**Résultat :**
```json
{
  "metrics": {
    "activeUsers": 42,
    "photosUploaded": 318,
    "quotesSubmitted": 12,
    "conversionRate": "28.6%"
  },
  "funnel": [
    { "step": 1, "users": 42 },
    { "step": 2, "users": 38 },
    { "step": 3, "users": 25 },
    { "step": 4, "users": 18 },
    { "step": 5, "users": 12 }
  ],
  "ai": {
    "avgLatencyMs": 2340,
    "totalCalls": 318,
    "totalCostUsd": "4.23",
    "errorRate": "2.1%"
  }
}
```

### PostHog Dashboard

1. Aller sur [app.posthog.com](https://app.posthog.com)
2. Voir dashboards temps réel, funnels, session replay

---

## 🎯 Événements trackés

| Événement | Quand | Métadata |
|-----------|-------|----------|
| `app_opened` | Ouverture app | `userId` |
| `step_reached` | Changement étape | `step` (1-5) |
| `photo_uploaded` | Photo uploadée | `photoId`, `roomType`, `duration_ms` |
| `room_validation_completed` | Validation pièces | `roomCount`, `totalPhotos` |
| `inventory_analysis_completed` | Analyse IA | `roomId`, `itemsDetected` |
| `quote_submitted` | Envoi devis | `projectId`, `photosCount` |

---

## 🛠️ Maintenance

### Nettoyer vieux events (> 90j)

```typescript
// À ajouter dans un cron job si besoin
await prisma.analyticsEvent.deleteMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    }
  }
});
```

### Désactiver PostHog (dev local)

Simplement ne pas définir `NEXT_PUBLIC_POSTHOG_KEY`.  
Le tracking DB continuera à fonctionner.

---

## 💰 Coûts

- **PostHog** : Gratuit jusqu'à 1M events/mois (largement suffisant)
- **DB** : ~100 KB/jour pour 1000 events
- **Total** : **€0/mois** pour un usage normal

---

## 🔍 Debug

```typescript
// Voir les events dans la console navigateur
localStorage.setItem('debug', 'posthog');
```

---

## ✅ C'est prêt !

Le système track automatiquement :
- ✅ Ouverture app
- ✅ Navigation entre étapes
- ✅ Upload photos
- ✅ Validation pièces/inventaire
- ✅ Envoi devis

**Aucune action supplémentaire requise.**

