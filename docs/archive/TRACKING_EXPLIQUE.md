# 📊 Comment fonctionne le système de tracking

## 🎯 Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                             │
│                    (utilise l'application)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Actions (upload photo, change étape...)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Next.js)                    │
│                                                                 │
│  • PostHogProvider.tsx  ← Initialise PostHog au démarrage      │
│  • lib/analytics.ts     ← Module centralisé                    │
│  • track('event')       ← Fonction simple à appeler            │
└────────────────┬────────────────────────┬───────────────────────┘
                 │                        │
                 │ track('photo_uploaded')│
                 ▼                        ▼
    ┌────────────────────┐    ┌────────────────────┐
    │   PostHog.com      │    │  /api/analytics/   │
    │  (Temps réel)      │    │  track (backup DB) │
    │  - Dashboards      │    │                    │
    │  - Funnels         │    └────────┬───────────┘
    │  - Session Replay  │             │
    │  OPTIONNEL         │             │ Sauvegarde
    └────────────────────┘             ▼
                             ┌──────────────────────┐
                             │  PostgreSQL/SQLite   │
                             │  Table:              │
                             │  AnalyticsEvent      │
                             │  - userId            │
                             │  - eventType         │
                             │  - metadata (JSON)   │
                             │  - createdAt         │
                             └──────────┬───────────┘
                                        │
                                        │ Lecture
                                        ▼
                             ┌──────────────────────┐
                             │  /api/analytics/     │
                             │  dashboard           │
                             │  (calcule métriques) │
                             └──────────────────────┘
```

---

## 🔄 Flux d'un événement

### Exemple : Utilisateur uploade une photo

```
1. FRONTEND (app/page.tsx)
   ↓
   processPhotoAsync() termine avec succès
   ↓
   track('photo_uploaded', {
     photoId: '123',
     roomType: 'salon',
     duration_ms: 2500
   })

2. MODULE ANALYTICS (lib/analytics.ts)
   ↓
   Fonction track() fait 2 choses EN PARALLÈLE:
   
   A) PostHog (si configuré)
      ↓
      window.posthog.capture('photo_uploaded', {...})
      ↓
      Envoyé vers PostHog.com (dashboards temps réel)
   
   B) API Backup
      ↓
      fetch('/api/analytics/track', {
        userId: 'user-abc',
        eventType: 'photo_uploaded',
        metadata: { photoId, roomType, duration_ms }
      })

3. API BACKEND (app/api/analytics/track/route.ts)
   ↓
   Reçoit la requête
   ↓
   prisma.analyticsEvent.create({
     userId: 'user-abc',
     eventType: 'photo_uploaded',
     metadata: { ... }
   })
   ↓
   Sauvegardé en base de données

4. RÉSULTAT
   ✅ Événement enregistré en DB
   ✅ Visible dans PostHog (si activé)
   ✅ Peut être consulté via /api/analytics/dashboard
```

---

## 🧩 Composants Principaux

### 1️⃣ **PostHogProvider.tsx** (Frontend)

**Rôle** : Initialiser PostHog au démarrage de l'app

```typescript
useEffect(() => {
  // Initialise PostHog UNE FOIS au chargement
  if (apiKey && typeof window !== 'undefined') {
    posthog.init(apiKey, {
      api_host: 'https://app.posthog.com',
      capture_pageviews: true,  // Track pages automatiquement
      autocapture: false         // On track manuellement
    });
    
    // Identifier l'utilisateur
    const userId = localStorage.getItem('moverz_user_id');
    if (userId) {
      posthog.identify(userId);
    }
  }
}, []);
```

**Résultat** : `window.posthog` est disponible partout

---

### 2️⃣ **lib/analytics.ts** (Module central)

**Rôle** : API simple pour tracker des événements

```typescript
// Fonction principale
export function track(
  eventType: 'photo_uploaded' | 'step_reached' | ...,
  metadata?: { photoId: string, roomType: string, ... }
): void {
  
  // 1. PostHog (temps réel)
  if (window.posthog) {
    window.posthog.capture(eventType, metadata);
  }
  
  // 2. Backup DB (via API)
  fetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ userId, eventType, metadata })
  }).catch(() => {}); // Silencieux si échec
}
```

**Pourquoi 2 destinations ?**
- **PostHog** : Dashboards visuels, session replay, temps réel
- **DB** : Backup, compliance, requêtes SQL custom

**Important** : Si track() échoue, ça ne casse JAMAIS l'app (catch silencieux)

---

### 3️⃣ **app/api/analytics/track/route.ts** (API)

**Rôle** : Sauvegarder les événements en base de données

```typescript
export async function POST(req: NextRequest) {
  const { userId, eventType, metadata } = await req.json();
  
  // Sauvegarde en DB
  await prisma.analyticsEvent.create({
    data: { userId, eventType, metadata }
  });
  
  return NextResponse.json({ success: true });
}
```

**Résultat** : Chaque événement est persisté dans PostgreSQL

---

### 4️⃣ **app/api/analytics/dashboard/route.ts** (API)

**Rôle** : Calculer et retourner les métriques

```typescript
export async function GET(req: NextRequest) {
  // Calcule les métriques des 7 derniers jours
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // 1. Utilisateurs actifs
  const activeUsers = await prisma.analyticsEvent.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: sevenDaysAgo } }
  });
  
  // 2. Funnel de conversion
  const stepEvents = await prisma.analyticsEvent.findMany({
    where: { 
      eventType: 'step_reached',
      createdAt: { gte: sevenDaysAgo }
    }
  });
  
  // Calculer utilisateurs par étape
  const funnel = [1,2,3,4,5].map(step => {
    const users = new Set(
      stepEvents
        .filter(e => e.metadata?.step === step)
        .map(e => e.userId)
    );
    return { step, users: users.size };
  });
  
  return NextResponse.json({
    metrics: { ... },
    funnel,
    ai: { ... }
  });
}
```

**Résultat** : JSON avec toutes les métriques clés

---

## 📊 Table AnalyticsEvent (Base de données)

```sql
CREATE TABLE "AnalyticsEvent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,          -- Qui a fait l'action ?
  "eventType" TEXT NOT NULL,       -- Quelle action ?
  "metadata" JSONB,                -- Détails (JSON flexible)
  "createdAt" TIMESTAMP NOT NULL   -- Quand ?
);
```

**Exemple de données** :

| id | userId | eventType | metadata | createdAt |
|----|--------|-----------|----------|-----------|
| abc123 | user-42 | `app_opened` | `{}` | 2025-01-12 10:30:00 |
| def456 | user-42 | `photo_uploaded` | `{"photoId":"xyz","roomType":"salon","duration_ms":2500}` | 2025-01-12 10:31:15 |
| ghi789 | user-42 | `step_reached` | `{"step":2}` | 2025-01-12 10:32:00 |

**Pourquoi JSONB pour metadata ?**
- Flexible : chaque événement peut avoir des métadonnées différentes
- Queryable : PostgreSQL peut filtrer dans le JSON
- Extensible : on peut ajouter des champs sans migration

---

## 🎯 Points d'instrumentation (où on track)

### **app/page.tsx** (Frontend)

```typescript
// 1. Ouverture app
useEffect(() => {
  track('app_opened', { userId });
}, []);

// 2. Upload photo
processPhotoAsync() {
  // ... upload
  track('photo_uploaded', {
    photoId,
    roomType,
    confidence,
    duration_ms
  });
}

// 3. Changement d'étape
handleStepChange(step) {
  setCurrentStep(step);
  trackStep(step); // Helper qui appelle track('step_reached', {step})
}

// 4. Validation pièces
handleRoomValidationComplete(roomGroups) {
  track('room_validation_completed', {
    roomCount: roomGroups.length,
    totalPhotos: ...
  });
}

// 5. Envoi devis
handleSubmitQuote() {
  // ... envoi
  track('quote_submitted', {
    projectId,
    batchId,
    photosCount,
    roomCount
  });
}
```

**Principe** : On track APRÈS le succès de l'action (jamais avant)

---

## 🔒 Sécurité & Vie privée

### Ce qui est tracké :
✅ Actions utilisateur (étapes, uploads...)  
✅ Métriques techniques (durée, erreurs...)  
✅ userId (anonyme, généré aléatoirement)  

### Ce qui N'est PAS tracké :
❌ Données personnelles (email, téléphone...)  
❌ Contenu des photos  
❌ Informations du formulaire devis  

### Stockage :
- **Base de données** : Chez toi (contrôle total)
- **PostHog** : UE disponible (RGPD compliant)

---

## 🚀 Avantages de cette architecture

### 1. **Fire & Forget**
```typescript
track('photo_uploaded', {...});
// Si ça échoue, l'app continue normalement
```
→ Le tracking ne peut JAMAIS casser l'app

### 2. **Double Backup**
- PostHog tombe ? → DB continue
- DB pleine ? → PostHog continue

### 3. **Maintenance Zéro**
- Pas de cron jobs
- Pas de workers
- Pas de cleanup manuel
- Tout est automatique

### 4. **Extensible**
Ajouter un nouvel événement :

```typescript
// 1. Ajouter le type
type AnalyticsEventType = 
  | 'photo_uploaded'
  | 'mon_nouvel_event'; // ← Ajouter ici

// 2. Tracker n'importe où
track('mon_nouvel_event', { data: 'test' });

// 3. C'est tout ! ✅
```

---

## 💡 Cas d'usage typiques

### **1. Débugger un problème utilisateur**

```sql
-- Voir ce qu'a fait un utilisateur spécifique
SELECT 
  "eventType",
  metadata,
  "createdAt"
FROM "AnalyticsEvent"
WHERE "userId" = 'user-probleme'
ORDER BY "createdAt" DESC;
```

### **2. Analyser un drop-off**

```sql
-- Voir où les utilisateurs abandonnent
SELECT 
  metadata->>'step' as step,
  COUNT(DISTINCT "userId") as users
FROM "AnalyticsEvent"
WHERE "eventType" = 'step_reached'
GROUP BY step
ORDER BY step;

-- Résultat :
-- step 1: 100 users (100%)
-- step 2: 85 users  (85%)
-- step 3: 60 users  (60%)  ← 25% drop ici !
-- step 4: 55 users  (55%)
-- step 5: 50 users  (50%)
```

### **3. Mesurer performance IA**

```sql
-- Durée moyenne d'upload par type de pièce
SELECT 
  metadata->>'roomType' as room_type,
  AVG((metadata->>'duration_ms')::int) as avg_duration_ms
FROM "AnalyticsEvent"
WHERE "eventType" = 'photo_uploaded'
GROUP BY room_type;

-- Résultat :
-- salon:   2300ms
-- chambre: 1800ms
-- cuisine: 3100ms ← Plus lent !
```

---

## 🎓 Résumé Simple

1. **User fait une action** → Upload photo
2. **Frontend** appelle `track('photo_uploaded', {...})`
3. **Module analytics** envoie vers :
   - PostHog (dashboards jolis)
   - API backend (backup DB)
4. **API backend** sauvegarde en DB
5. **Dashboard API** lit la DB et calcule les métriques
6. **Toi** tu consultes :
   - `/api/analytics/dashboard` (JSON)
   - PostHog.com (graphiques)
   - Prisma Studio (explorer données)

**C'est tout !** Simple, fiable, maintenable. 🎉

