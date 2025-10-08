# 📊 MOVERZ V3 - ANALYSE COMPLÈTE DU SYSTÈME

## 🎯 RÉSUMÉ EXÉCUTIF

**Application** : Système d'analyse automatique pour déménagement  
**Stack** : Next.js 15.5.4 + Prisma + SQLite + IA (Claude/OpenAI)  
**Problème principal** : 3 erreurs critiques bloquent l'upload et l'affichage des photos  
**Impact** : Système non fonctionnel pour l'utilisateur final  

---

## 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **Base de données "readonly"**
```
Error: attempt to write a readonly database
```
- **Fichier** : `lib/storage.ts:144`
- **Impact** : Impossible de créer des projets ou sauvegarder des photos
- **Cause** : Permissions SQLite incorrectes

### 2. **Index Prisma manquant**
```
Unknown argument `userId_roomType`. Available options are marked with ?.
```
- **Fichier** : `lib/storage.ts:179`
- **Impact** : Impossible de créer des entrées Room
- **Cause** : Index unique `userId_roomType` n'existe pas dans la DB

### 3. **Erreur syntaxe Prisma**
```
Unknown argument `userId`. Available options are marked with ?.
```
- **Fichier** : `app/api/room-groups/route.ts:16`
- **Impact** : API retourne erreur 500
- **Cause** : Schéma Prisma non synchronisé avec le code

---

## 🏗️ ARCHITECTURE DU SYSTÈME

### **Structure du projet**
```
moverz_v3/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── photos/        # Gestion photos + analyse IA
│   │   ├── room-groups/   # Groupement par pièces
│   │   ├── user-modifications/ # Persistance modifications
│   │   └── user/migrate/  # Migration utilisateurs
│   ├── page.tsx           # Page principale
│   └── layout.tsx         # Layout global
├── components/            # Composants React
│   ├── RoomInventoryCard.tsx
│   ├── InventoryItemInline.tsx
│   ├── ItemDetailsModal.tsx
│   ├── RoomPhotoGrid.tsx
│   └── UserTestPanel.tsx
├── lib/                   # Utilitaires
│   ├── auth.ts           # Auth côté serveur
│   ├── auth-client.ts    # Auth côté client
│   ├── user-storage.ts   # localStorage par utilisateur
│   ├── storage.ts        # Sauvegarde DB
│   └── db.ts             # Connexion Prisma
├── prisma/
│   ├── schema.prisma     # Schéma de base de données
│   └── dev.db           # Base SQLite
└── services/             # Services IA
    ├── claudeVision.ts
    ├── roomDetection.ts
    └── ...
```

### **Flux de données**
```
1. Upload photo → app/api/photos/analyze/
2. Analyse IA → services/claudeVision.ts
3. Sauvegarde DB → lib/storage.ts
4. Création Room → prisma.room.upsert() [❌ ÉCHEC]
5. Affichage → app/api/room-groups/ [❌ ÉCHEC]
6. Interface → components/RoomInventoryCard.tsx
```

---

## 📋 SCHÉMA DE BASE DE DONNÉES

### **Modèles Prisma**
```prisma
model User {
  id             String             @id @default(uuid())
  email          String?            @unique
  projects       Project[]
  rooms          Room[]
  modifications  UserModification[]
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

model Room {
  id        String   @id @default(uuid())
  name      String
  roomType  String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, roomType], name: "userId_roomType")  // ❌ MANQUANT EN DB
  @@index([userId])
}

model Project {
  id              String   @id @default(uuid())
  name            String
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  photos          Photo[]
  // ... autres champs
}

model Photo {
  id          String   @id @default(uuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  filename    String
  filePath    String
  url         String
  roomType    String?
  analysis    Json?
  createdAt   DateTime @default(now())
}

model UserModification {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  photoId     String
  itemIndex   Int
  field       String   // 'dismountable' | 'fragile' | 'selected'
  value       String   // JSON value
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, photoId, itemIndex, field])
  @@index([userId])
  @@index([photoId])
}
```

---

## 🔍 ANALYSE DÉTAILLÉE DES ERREURS

### **Erreur 1: Base readonly**
**Stack trace complète :**
```
Invalid `prisma.project.create()` invocation:
Error occurred during query execution:
ConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(SqliteError { extended_code: 1032, message: Some("attempt to write a readonly database") }), transient: false })
    at async savePhotoToDatabase (lib/storage.ts:144:15)
    at async POST (app/api/photos/analyze/route.ts:153:5)
```

**Fichier concerné :** `lib/storage.ts:144`
```typescript
project = await prisma.project.create({
  data: {
    userId: userId,
    name: "Projet Moverz",
    // ...
  }
});
```

### **Erreur 2: Index userId_roomType manquant**
**Stack trace complète :**
```
Invalid `prisma.room.upsert()` invocation:
{
  where: {
    userId_roomType: {
      userId: "temp-ece35736-9e2d-4365-ac8b-5245c8894a17",
      roomType: "salon"
    },
    // ...
  }
}
Unknown argument `userId_roomType`. Available options are marked with ?.
    at async savePhotoToDatabase (lib/storage.ts:179:5)
```

**Fichier concerné :** `lib/storage.ts:179`
```typescript
await prisma.room.upsert({
  where: {
    userId_roomType: {  // ❌ Index n'existe pas en DB
      userId: userId,
      roomType: roomType
    }
  },
  // ...
});
```

### **Erreur 3: Syntaxe Prisma incorrecte**
**Stack trace complète :**
```
Invalid `prisma.photo.findMany()` invocation:
{
  where: {
    project: {
      userId: null,  // ❌ userId est null
      // ...
    }
  }
}
Unknown argument `userId`. Available options are marked with ?.
    at async GET (app/api/room-groups/route.ts:16:20)
```

**Fichier concerné :** `app/api/room-groups/route.ts:16`
```typescript
const photos = await prisma.photo.findMany({
  where: {
    project: { userId },  // ❌ userId est null
    analysis: { not: null }
  },
  // ...
});
```

---

## 🔧 LOGS DÉTAILLÉS D'EXÉCUTION

### **Séquence d'événements lors de l'upload :**
```
1. [14:00:00] POST /api/photos/analyze - Début analyse
2. [14:00:10] Analyse Claude terminée: 5 objets détectés
3. [14:00:13] prisma:query BEGIN IMMEDIATE
4. [14:00:13] prisma:query SELECT `main`.`Project`.`id` FROM `main`.`Project`
5. [14:00:13] ❌ ERREUR: attempt to write a readonly database
6. [14:00:13] POST /api/photos/analyze 500 in 13536ms
```

### **Séquence d'événements pour l'affichage :**
```
1. [14:01:00] GET /api/room-groups?userId=dev-user
2. [14:01:00] prisma:query SELECT `main`.`User`.`id` FROM `main`.`User`
3. [14:01:00] ❌ ERREUR: Unknown argument `userId`
4. [14:01:00] GET /api/room-groups 500 in 87ms
```

---

## 🎯 SERVICES ET COMPOSANTS

### **Services IA fonctionnels :**
- ✅ `services/claudeVision.ts` - Analyse d'objets (5 objets détectés)
- ✅ `services/roomDetection.ts` - Détection type de pièce
- ✅ `ai-mock-server.js` - Serveur mock sur port 8000

### **Composants React :**
- ✅ `components/RoomInventoryCard.tsx` - Affichage inventaire
- ✅ `components/InventoryItemInline.tsx` - Ligne d'objet
- ✅ `components/ItemDetailsModal.tsx` - Modal détails
- ✅ `components/RoomPhotoGrid.tsx` - Grille photos
- ✅ `components/UserTestPanel.tsx` - Panel de test

### **APIs fonctionnelles :**
- ✅ `app/api/ai-status/route.ts` - Status services IA
- ✅ `app/api/photos/analyze/route.ts` - Analyse photos (partiellement)
- ❌ `app/api/room-groups/route.ts` - Groupement pièces (erreur 500)
- ❌ `app/api/user-modifications/route.ts` - Modifications utilisateur

---

## 🔐 SYSTÈME D'AUTHENTIFICATION

### **Côté client :** `lib/auth-client.ts`
```typescript
const COOKIE_NAME = 'moverz_user_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export class UserSessionManager {
  getCurrentUserId(): string {
    migrateCookies(); // Migration anciens cookies
    const cookieUserId = getUserIdCookie();
    if (cookieUserId) return cookieUserId;
    
    const newUserId = generateTemporaryUserId();
    setUserIdCookie(newUserId);
    return newUserId;
  }
}
```

### **Côté serveur :** `lib/auth.ts`
```typescript
export async function getUserId(req: NextRequest): Promise<string | null> {
  // 1. Header x-user-id
  const headerUserId = req.headers.get('x-user-id');
  if (headerUserId) {
    const exists = await userExists(headerUserId);
    if (!exists) await createUser(headerUserId); // Auto-création
    return headerUserId;
  }
  
  // 2. Query param userId
  const queryUserId = url.searchParams.get('userId');
  if (queryUserId) {
    return await userExists(queryUserId) ? queryUserId : null;
  }
  
  // 3. Cookie moverz_user_id
  const cookieUserId = req.cookies.get('moverz_user_id')?.value;
  if (cookieUserId) {
    return await userExists(cookieUserId) ? cookieUserId : null;
  }
  
  return null; // ❌ Retourne null si pas trouvé
}
```

---

## 📊 ÉTAT ACTUEL DES DONNÉES

### **Base de données :**
- **Users** : 2 utilisateurs (dev-user, temp-ece35736-...)
- **Projects** : 1 projet créé mais erreur readonly
- **Photos** : 1 photo analysée avec succès
- **Rooms** : 0 entrées (erreur index manquant)
- **UserModifications** : 0 modifications

### **Services en cours :**
- ✅ Next.js dev server : `localhost:3001`
- ✅ AI Mock server : `localhost:8000`
- ❌ Prisma Studio : Port 5556 occupé
- ✅ Base SQLite : `prisma/dev.db` (permissions incorrectes)

---

## 🚀 PLAN DE CORRECTION RECOMMANDÉ

### **Étape 1 : Réparation base de données**
```bash
# 1. Corriger permissions
chmod 755 prisma/
chmod 664 prisma/dev.db

# 2. Synchroniser schéma Prisma
npx prisma db push --force-reset --accept-data-loss

# 3. Redémarrer serveur Next.js
npm run dev
```

### **Étape 2 : Tests de validation**
```bash
# 1. Tester upload photo
curl -X POST http://localhost:3001/api/photos/analyze \
  -H "x-user-id: test-user" \
  -F "photo=@test.jpg"

# 2. Tester API room-groups
curl "http://localhost:3001/api/room-groups?userId=test-user"

# 3. Vérifier Prisma Studio
npx prisma studio --port 5556
```

### **Étape 3 : Validation fonctionnelle**
1. Upload d'une photo → Analyse IA → Sauvegarde DB
2. Création automatique d'entrée Room
3. Affichage dans l'interface utilisateur
4. Test des modifications utilisateur

---

## 🎯 RÉSULTATS ATTENDUS

### **Après correction :**
- ✅ Upload de photos fonctionnel
- ✅ Analyse IA opérationnelle
- ✅ Sauvegarde en base de données
- ✅ Création automatique des entrées Room
- ✅ Affichage des inventaires par pièce
- ✅ Persistance des modifications utilisateur
- ✅ Interface utilisateur complète

### **Métriques de succès :**
- Temps d'analyse IA : ~10-15 secondes
- Temps de sauvegarde DB : <100ms
- Temps de chargement interface : <2 secondes
- Taux d'erreur : 0%

---

## 📝 COMMANDES DE DEBUGGING

### **Vérifier l'état des services :**
```bash
# Status Next.js
curl -I http://localhost:3001

# Status AI Mock
curl http://localhost:8000/health

# Status base de données
npx prisma studio --port 5556
```

### **Logs détaillés :**
```bash
# Logs Next.js avec Prisma
DEBUG=prisma:* npm run dev

# Logs spécifiques
tail -f .next/server.log
```

---

## 🔍 FICHIERS CLÉS À EXAMINER

### **Priorité 1 (Erreurs critiques) :**
- `lib/storage.ts:144` - Création projet (erreur readonly)
- `lib/storage.ts:179` - Création Room (index manquant)
- `app/api/room-groups/route.ts:16` - Requête Prisma (syntaxe)

### **Priorité 2 (Fonctionnalités) :**
- `lib/auth.ts` - Authentification serveur
- `lib/auth-client.ts` - Authentification client
- `components/RoomInventoryCard.tsx` - Affichage inventaire

### **Priorité 3 (Configuration) :**
- `prisma/schema.prisma` - Schéma base de données
- `package.json` - Dépendances et scripts
- `next.config.ts` - Configuration Next.js

---

**📅 Date d'analyse :** 8 octobre 2025  
**👨‍💻 Analyste :** Assistant IA Claude  
**🎯 Objectif :** Rendre le système pleinement fonctionnel  
**⏱️ Temps estimé de correction :** 30-45 minutes
