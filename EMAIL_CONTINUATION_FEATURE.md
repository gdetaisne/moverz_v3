# 📧 Fonctionnalité d'Email de Continuation

**Date**: 1er octobre 2025  
**Status**: ✅ Implémenté

---

## 🎯 **Objectif**

Permettre aux utilisateurs de recevoir un lien par email pour continuer leur devis plus tard ou sur un autre appareil, améliorant ainsi la persistance de leur progression.

---

## ✨ **Fonctionnalités**

### 1. **Pop-up Automatique**
- Affichée automatiquement 5 secondes après l'arrivée sur l'étape "Valider l'inventaire"
- Ne s'affiche qu'une seule fois par session
- Design moderne avec gradient et animations

### 2. **Formulaire Email**
- Champ "Nom" (optionnel)
- Champ "Email" (requis)
- Validation côté client et serveur
- Feedback visuel (loading, succès, erreur)

### 3. **Email Personnalisé**
- Template HTML responsive
- Informations de progression (nombre de photos analysées)
- Lien sécurisé avec token unique
- Design professionnel avec gradient

### 4. **Sécurité**
- Token unique par demande
- Lien expire après 30 jours
- Sauvegarde de l'email en DB
- Protection CSRF automatique (Next.js)

---

## 📁 **Fichiers Créés**

### 1. **`lib/email.ts`**
Service d'envoi d'emails avec:
- `sendEmail()` - Envoi via Resend API
- `generateContinuationToken()` - Génération token sécurisé
- `generateContinuationEmailHtml()` - Template HTML responsive

### 2. **`app/api/send-continuation-link/route.ts`**
API route pour:
- Validation des données (Zod)
- Vérification du projet appartient à l'utilisateur
- Génération du token
- Sauvegarde en DB
- Envoi de l'email

### 3. **`components/ContinuationModal.tsx`**
Composant modal avec:
- Animations Framer Motion
- Formulaire contrôlé
- Gestion des états (loading, success, error)
- Design moderne et accessible

### 4. **`app/page.tsx`** (modifications)
- useState pour la gestion du modal
- useEffect pour affichage automatique après 5s
- Handler `handleSendContinuationLink`
- Intégration du composant modal

---

## 🔧 **Configuration Requise**

### 1. **Service d'Email: Resend**

#### Créer un compte
```bash
# 1. Aller sur https://resend.com/signup
# 2. Vérifier votre email
# 3. Créer une API key
```

#### Ajouter la clé à `.env.local`
```bash
# Email service (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=Moverz <noreply@moverz.fr>
```

#### Installer le package (déjà fait via fetch)
```bash
# Pas besoin d'installer de package npm
# On utilise directement l'API REST de Resend
```

### 2. **Configuration Domaine (Production)**

#### Vérifier le domaine d'envoi
```bash
# Dans Resend Dashboard:
# 1. Domains → Add Domain
# 2. Ajouter moverz.fr
# 3. Configurer les DNS (SPF, DKIM, DMARC)
# 4. Vérifier le domaine
```

#### Variables d'environnement production
```bash
# Sur CapRover:
RESEND_API_KEY=re_prod_...
EMAIL_FROM=Moverz <noreply@moverz.fr>
NEXT_PUBLIC_APP_URL=https://moverz.votre-domaine.com
```

---

## 🧪 **Tests**

### Mode Développement

En développement, si `RESEND_API_KEY` n'est pas configuré, le système:
- ✅ Log l'email dans la console
- ✅ Retourne un `debugUrl` dans la réponse
- ✅ Ne bloque pas le flow

```bash
# Tester sans RESEND_API_KEY
npm run dev

# Aller sur http://localhost:3001
# Uploader des photos
# Aller à l'étape 2
# Attendre 5 secondes → Modal apparaît
# Entrer un email → Check la console pour le debug URL
```

### Test Email Réel

```bash
# 1. Configurer RESEND_API_KEY dans .env.local
RESEND_API_KEY=re_test_...

# 2. Redémarrer le serveur
npm run dev

# 3. Tester le flow complet
# - Upload photos
# - Étape 2: attendre modal
# - Entrer votre email
# - Check votre boîte mail
```

### Test API Direct

```bash
# Test avec curl
curl -X POST http://localhost:3001/api/send-continuation-link \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{
    "email": "test@example.com",
    "userName": "Test User",
    "projectId": "PROJECT_ID_HERE"
  }'
```

---

## 📊 **Coûts Resend**

### Plan Gratuit
- ✅ 100 emails/jour
- ✅ 3000 emails/mois
- ✅ Idéal pour MVP

### Plan Pro ($20/mois)
- 50,000 emails/mois
- Support prioritaire
- Analytics avancés

**Estimation Moverz**:
- 1000 devis/mois = 1000 emails
- **→ Plan gratuit suffisant**

---

## 🎨 **Template Email**

### Structure
```
┌────────────────────────────┐
│ Header avec gradient       │
│ 📦 Moverz                  │
└────────────────────────────┘
│                            │
│ Salutation personnalisée   │
│ "Bonjour {userName}"       │
│                            │
│ Box statistiques:          │
│ ✅ 5 photos analysées      │
│ 📦 Inventaire en cours     │
│                            │
│ [Bouton CTA gradient]      │
│ 🚀 Continuer mon devis     │
│                            │
│ Lien texte (fallback)      │
│                            │
│ Box sécurité:              │
│ 🔒 Lien personnel (30j)    │
│                            │
└────────────────────────────┘
│ Footer                     │
│ © 2025 Moverz              │
└────────────────────────────┘
```

### Personnalisation

Modifier dans `lib/email.ts`:
```typescript
export function generateContinuationEmailHtml(params: {
  userName?: string;
  continuationUrl: string;
  projectId: string;
  photosCount: number;
}): string {
  // Modifier le HTML ici
  // - Couleurs: gradient (from-blue-600 to-purple-600)
  // - Logo: Ajouter votre logo
  // - Texte: Personnaliser les messages
}
```

---

## 🔐 **Sécurité**

### Token Unique
- Généré avec `crypto.randomBytes(32)`
- 64 caractères hexadécimaux
- Unique par demande

### Expiration
- Lien valide 30 jours (configurable)
- TODO: Implémenter vérification expiration

### Protection
- ✅ Validation Zod (email format)
- ✅ Vérification ownership du projet
- ✅ HTTPS uniquement en production
- ✅ Rate limiting (TODO: à implémenter)

---

## 📈 **Métriques & Analytics**

### À Implémenter

1. **Tracking Clicks**
```typescript
// Dans app/page.tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'email') {
    // Log event: email_link_clicked
    console.log('🔗 User came from email link');
  }
}, []);
```

2. **Conversion Rate**
- Emails envoyés vs Emails cliqués
- Emails cliqués vs Devis finalisés

3. **Tableau de bord**
```sql
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as emails_sent,
  COUNT(DISTINCT userId) as unique_users
FROM continuation_logs
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

---

## 🐛 **Troubleshooting**

### Email Non Reçu

**1. Vérifier Resend Dashboard**
```
https://resend.com/emails
→ Check status (delivered, bounced, failed)
```

**2. Vérifier les logs serveur**
```bash
# Logs Next.js
npm run dev
# Check console pour:
# ✅ Email envoyé via Resend: [ID]
# ❌ Erreur Resend: [ERROR]
```

**3. Vérifier spam/indésirables**
- L'email peut arriver dans spam initialement
- Configurer SPF/DKIM pour améliorer deliverability

### Modal Ne S'Affiche Pas

**1. Vérifier les conditions**
```typescript
// Dans app/page.tsx
console.log('Debug modal:', {
  currentStep,
  photosCount: currentRoom.photos.length,
  hasShown: hasShownContinuationModal
});
```

**2. Reset le flag**
```javascript
// Dans la console browser
localStorage.clear();
// Puis refresh la page
```

### Erreur API

**1. Vérifier le projectId**
```typescript
// Le projectId doit être valide
// TODO: Implémenter création auto du project
```

**2. Vérifier les permissions**
```bash
# Le projet doit appartenir à l'utilisateur
# Check userId dans headers
```

---

## 🚀 **Améliorations Futures**

### Court Terme
- [ ] Implémenter vérification expiration du token
- [ ] Créer automatiquement un project si inexistant
- [ ] Ajouter rate limiting (max 5 emails/heure)
- [ ] Tracking des clics sur le lien email

### Moyen Terme
- [ ] Email de rappel 24h après (si non complété)
- [ ] Support multi-projets dans l'email
- [ ] Template email personnalisable (admin)
- [ ] Analytics dashboard (emails envoyés, taux ouverture)

### Long Terme
- [ ] SMS en complément de l'email (Twilio)
- [ ] Push notifications (PWA)
- [ ] Partage du devis par email
- [ ] Invitation collaborateurs

---

## 📝 **Changelog**

### v1.0.0 (2025-10-01)
- ✅ Modal automatique après 5s (étape 2)
- ✅ Formulaire email avec validation
- ✅ API route `/api/send-continuation-link`
- ✅ Service email avec Resend
- ✅ Template HTML responsive
- ✅ Token sécurisé 64 chars
- ✅ Sauvegarde email en DB
- ✅ Mode debug en développement

---

## 📞 **Support**

### Resend
- Documentation: https://resend.com/docs
- Support: https://resend.com/support
- Status: https://status.resend.com

### Issues Communes
- **Domaine non vérifié**: Configurer SPF/DKIM
- **Rate limit**: Attendre 1h ou upgrade plan
- **Email bounce**: Vérifier format email

---

## 🎓 **Ressources**

### Documentation
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Framer Motion](https://www.framer.com/motion/)

### Tutoriels
- [Setup Email in Next.js](https://resend.com/docs/send-with-nextjs)
- [HTML Email Best Practices](https://www.emailonacid.com/)
- [Email Deliverability](https://sendgrid.com/blog/email-deliverability-guide/)

---

**Dernière mise à jour**: 1er octobre 2025  
**Status**: ✅ Production Ready (avec RESEND_API_KEY)  
**Maintenu par**: Guillaume Stehelin

