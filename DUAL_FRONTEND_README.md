# 🚀 Dual Frontend Setup - Moverz

Cette configuration permet d'avoir **2 versions du site** :
- **Desktop** : Version actuelle (Next.js avec API backend)
- **Mobile** : Version optimisée mobile-first

## 📁 Structure

```
apps/
├── web/              # Desktop (inchangé)
│   ├── app/          # Pages + API routes
│   └── ...
└── web-mobile/       # Mobile (nouveau)
    ├── app/          # Pages mobile uniquement
    ├── components/   # Composants mobile-first
    └── ...
```

## 🔧 Développement Local

### Lancer le backend + desktop
```bash
cd apps/web
pnpm dev
# http://localhost:3001
```

### Lancer la version mobile
```bash
cd apps/web-mobile
pnpm dev
# http://localhost:5174
```

### Tester les deux en même temps
```bash
# Terminal 1 - Backend
cd apps/web && pnpm dev

# Terminal 2 - Mobile
cd apps/web-mobile && pnpm dev
```

## 🐳 Déploiement CapRover

### Option 1 : Remplacer l'app existante

```bash
# 1. Renommer captain-definition
mv captain-definition captain-definition.old
mv captain-definition-dual captain-definition

# 2. Deploy comme d'habitude
git add .
git commit -m "Deploy dual frontend"
git push caprover main
```

### Option 2 : Nouvelle app CapRover

```bash
# 1. Créer une nouvelle app dans CapRover UI
#    Nom: moverz-dual

# 2. Ajouter remote
git remote add caprover-dual captain@your-server.com:moverz-dual

# 3. Deploy
git push caprover-dual main
```

## 🌐 Routing (automatique via nginx)

### User-Agent Detection

| Device | User-Agent Match | Version Servie |
|--------|------------------|----------------|
| iPhone/iPad | `~*iphone`, `~*ipad` | Mobile |
| Android | `~*android` | Mobile |
| Desktop | Autres | Desktop |

### Routes Forcées

| URL | Version |
|-----|---------|
| `/mobile` | Mobile (forcée) |
| `/desktop` | Desktop (forcée) |
| `/admin` | Desktop (toujours) |
| `/api/*` | Backend (toujours) |

### Exemples

```bash
# Mobile user-agent → version mobile
curl -A "Mozilla/5.0 (iPhone)" https://app.moverz.com/

# Desktop user-agent → version desktop
curl -A "Mozilla/5.0 (Macintosh)" https://app.moverz.com/

# Force mobile (n'importe quel device)
https://app.moverz.com/mobile

# Force desktop (n'importe quel device)
https://app.moverz.com/desktop
```

## 🎨 Personnalisation Mobile

### Modifier les couleurs

```typescript
// apps/web-mobile/tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: "#3b82f6",    // Bleu
      secondary: "#10b981",  // Vert
      accent: "#f59e0b",     // Orange
    },
  },
},
```

### Ajouter une nouvelle page

```tsx
// apps/web-mobile/app/nouvelle-page/page.tsx
'use client'

import MobileHeader from '@/components/MobileHeader'
import MobileBottomNav from '@/components/MobileBottomNav'

export default function NouvellePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Nouvelle Page" />
      
      <div className="p-4">
        {/* Votre contenu */}
      </div>
      
      <MobileBottomNav />
    </div>
  )
}
```

## 🔄 Variables d'Environnement

Les variables d'env sont les **mêmes** pour les 2 versions :

```env
# Backend API (apps/web tourne sur port 3001)
DATABASE_URL=postgresql://...
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=dev-secret
PORT=3001

# Frontend Mobile (optionnel, auto-détecté)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📱 Flow Utilisateur Mobile

```
1. Upload Photos
   ↓
2. Analyse IA (loading)
   ↓
3. Inventaire (édition)
   ↓
4. Devis (estimation)
   ↓
5. Demande de contact
```

## ✅ Test de Validation

### Desktop (inchangé)
```bash
curl http://localhost:3001/
# → Page Next.js desktop
```

### Mobile
```bash
curl -A "iPhone" http://localhost:80/
# → Page mobile (nginx routing)
```

### API (partagée)
```bash
curl -X POST http://localhost:80/api/photos \
  -H "x-user-id: test" \
  -F "file=@photo.jpg"
# → Backend Next.js
```

## 🐛 Debug

### Logs Nginx
```bash
docker exec -it <container> tail -f /var/log/nginx/access.log
```

### Logs Next.js
```bash
docker exec -it <container> tail -f /app/logs/app.log
```

### Vérifier routing
```bash
# Test mobile user-agent
curl -v -A "Mozilla/5.0 (iPhone)" http://localhost:80/ | grep "DOCTYPE"

# Test desktop user-agent
curl -v -A "Mozilla/5.0 (Macintosh)" http://localhost:80/ | grep "DOCTYPE"
```

## 📦 Build Local (test)

```bash
# Build avec Docker
docker build -f Dockerfile.dual-frontend -t moverz-dual .

# Run
docker run -p 80:80 -e DATABASE_URL=... moverz-dual

# Test
open http://localhost
```

## 🎯 Prochaines Étapes

1. ✅ Structure créée
2. ✅ Composants mobile
3. ✅ Pages principales
4. ✅ Dockerfile + nginx
5. 🔲 Test en local
6. 🔲 Deploy sur CapRover
7. 🔲 Affiner l'UI mobile
8. 🔲 Ajouter PWA (optionnel)

## 💡 Tips

- **Mobile size** : Le bundle mobile est ~500KB (vs 2MB desktop)
- **Cache** : Les assets mobiles sont mis en cache 1h
- **Offline** : Possibilité d'ajouter un Service Worker plus tard
- **Toggle manuel** : Lien "Version desktop" dans footer mobile possible

---

**Questions ?** Teste d'abord en local, puis déploie sur CapRover ! 🚀

