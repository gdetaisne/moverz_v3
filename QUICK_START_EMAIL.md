# 🚀 Quick Start - Fonctionnalité Email de Continuation

**Temps d'installation**: 5 minutes ⏱️

---

## ✅ **Fichiers Créés**

Les fichiers suivants ont été ajoutés à votre projet:

```
moverz_v3/
├── lib/
│   └── email.ts                              ← Service d'email
├── app/
│   └── api/
│       └── send-continuation-link/
│           └── route.ts                      ← API route
├── components/
│   └── ContinuationModal.tsx                 ← Composant modal
├── app/
│   └── page.tsx                              ← Modifications (modal intégré)
└── docs/
    ├── EMAIL_CONTINUATION_FEATURE.md         ← Documentation complète
    └── QUICK_START_EMAIL.md                  ← Ce fichier
```

---

## 📋 **Étapes de Configuration**

### 1. **Obtenir une clé API Resend** (2 min)

```bash
# 1. Aller sur https://resend.com/signup
# 2. Créer un compte (gratuit)
# 3. Vérifier votre email
# 4. Dashboard → API Keys → Create API Key
# 5. Copier la clé (commence par re_...)
```

### 2. **Ajouter la clé dans `.env.local`** (30 sec)

```bash
# Éditer /Users/guillaumestehelin/moverz_v3/.env.local
# Ajouter ces lignes:

# Service d'email
RESEND_API_KEY=re_...votre_clé_ici...
EMAIL_FROM=Moverz <noreply@moverz.fr>
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3. **Redémarrer le serveur** (10 sec)

```bash
# Arrêter (Ctrl+C) puis:
npm run dev
```

### 4. **Tester la fonctionnalité** (2 min)

```bash
# 1. Ouvrir http://localhost:3001
# 2. Uploader 1-2 photos
# 3. Cliquer "Étape 2 - Valider l'inventaire"
# 4. Attendre 5 secondes → Modal apparaît 🎉
# 5. Entrer votre email
# 6. Cliquer "Envoyer le lien"
# 7. Vérifier votre boîte mail ✉️
```

---

## 🎯 **Comportement de la Fonctionnalité**

### Quand le modal apparaît-il ?
- ✅ Après 5 secondes sur l'étape "Valider l'inventaire"
- ✅ Si au moins 1 photo a été uploadée
- ✅ Une seule fois par session (ne se ré-affiche pas si fermé)

### Que se passe-t-il quand j'envoie ?
1. **Validation** des données (email, project ID)
2. **Génération** d'un token sécurisé unique
3. **Sauvegarde** de l'email dans la base de données
4. **Envoi** d'un email HTML magnifique 📧
5. **Feedback** visuel (succès / erreur)

### Que contient l'email ?
- Salutation personnalisée (si nom fourni)
- Statistiques de progression (nombre de photos)
- Bouton CTA pour continuer le devis
- Lien direct (fallback texte)
- Note de sécurité (lien expire dans 30 jours)

---

## 🔥 **Tester Sans Resend (Mode Dev)**

Si vous n'avez pas encore de clé Resend:

```bash
# 1. Assurez-vous que RESEND_API_KEY n'est PAS dans .env.local
# 2. npm run dev
# 3. Testez le flow
# 4. Ouvrez la console browser (F12)
# 5. Cherchez: "📧 Email (mode dev)"
# 6. Copier le debugUrl et ouvrir dans un nouvel onglet
```

**Note**: En mode dev sans clé, l'email n'est pas vraiment envoyé mais loggé dans la console.

---

## 🎨 **Personnaliser l'Email**

### Changer les couleurs
```typescript
// Éditer lib/email.ts ligne ~80
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// Remplacer par vos couleurs
```

### Changer le texte
```typescript
// Éditer lib/email.ts
<h2>Bonjour ${userName || 'cher client'}</h2>
// Personnaliser le message
```

### Ajouter votre logo
```typescript
// Dans lib/email.ts, section Header
<img src="https://votre-domaine.com/logo.png" alt="Logo" />
```

---

## 🐛 **Problèmes Fréquents**

### Modal ne s'affiche pas ?
```typescript
// Dans app/page.tsx, ligne 433-443
// Vérifier les conditions:
console.log({
  currentStep,              // Doit être 2
  photos: currentRoom.photos.length, // Doit être > 0
  shown: hasShownContinuationModal   // Doit être false
});
```

**Solution**: Refresh la page et réessayez.

### Email non reçu ?
1. Vérifier le Dashboard Resend: https://resend.com/emails
2. Check spam/indésirables
3. Vérifier console serveur pour erreurs

### Erreur "Project not found" ?
```typescript
// TODO: Le projet doit être créé automatiquement
// Temporaire: un project par défaut est créé à l'upload
```

---

## 📊 **Vérifier que ça Marche**

### Checklist
- [ ] Modal apparaît après 5s sur étape 2
- [ ] Formulaire email fonctionne
- [ ] Email reçu dans boîte mail
- [ ] Lien dans l'email fonctionne
- [ ] Console ne montre pas d'erreurs

### Logs à surveiller
```bash
# Serveur Next.js (terminal)
✅ Lien de continuation envoyé à user@example.com (projet abc-123)
✅ Email envoyé via Resend: [ID]
📸 Photo DB: [ID] → /api/uploads/[filename].jpg

# Browser console (F12)
✅ Lien de continuation envoyé: {success: true, ...}
🔗 URL debug: http://localhost:3001?userId=...&token=...
```

---

## 🚀 **Déploiement Production**

### Avant de déployer
1. **Vérifier le domaine** dans Resend
2. **Configurer SPF/DKIM** (améliore deliverability)
3. **Changer EMAIL_FROM** pour utiliser votre domaine
4. **Ajouter NEXT_PUBLIC_APP_URL** en production

### Variables d'env CapRover
```bash
# À ajouter dans CapRover → Apps → moverz → Environment Variables
RESEND_API_KEY=re_prod_...
EMAIL_FROM=Moverz <noreply@votre-domaine.com>
NEXT_PUBLIC_APP_URL=https://moverz.votre-domaine.com
```

---

## 📈 **Prochaines Étapes**

### Améliorations Suggérées
1. **Tracking**: Ajouter Google Analytics sur le clic email
2. **Rappel**: Email automatique 24h après si non complété
3. **Partage**: Permettre de partager le devis par email
4. **Multi-projet**: Lister tous les projets dans l'email

### Monitoring
- **Resend Dashboard**: Surveiller le taux de délivrance
- **Logs**: Check erreurs régulièrement
- **Feedback users**: Demander si emails reçus

---

## 🎓 **En Savoir Plus**

### Documentation Complète
- `EMAIL_CONTINUATION_FEATURE.md` - Guide complet (20 pages)

### Support
- Resend: https://resend.com/support
- Issues: Créer une issue GitHub

---

## ✨ **C'est Tout !**

Vous êtes prêt ! 🎉

La fonctionnalité est:
- ✅ **Implémentée** dans le code
- ✅ **Testée** en local
- ✅ **Documentée** complètement
- ✅ **Prête pour prod** (avec clé Resend)

**Bonne continuation !** 🚀

---

**Questions ?** Consultez `EMAIL_CONTINUATION_FEATURE.md` ou contactez le support.

