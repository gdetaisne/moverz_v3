# 🚀 Intégration Moverz.fr - Inventaire IA

## 📁 Fichiers d'intégration créés

### 1. **integration-moverz.html** - Version complète avec design
- Page HTML complète avec header, navigation et design moderne
- Intégration iframe optimisée
- Responsive design pour mobile/desktop
- Section features avec explications

### 2. **integration-simple.html** - Version minimaliste
- Page HTML simple avec juste l'iframe
- Parfait pour intégration rapide
- Pas de design complexe

### 3. **integration-react-component.jsx** - Composant React
- Composant React réutilisable
- 3 versions : basique, avec header, mobile
- Props personnalisables (className, style)

### 4. **integration-nextjs-page.tsx** - Page Next.js
- Page Next.js complète avec Tailwind CSS
- Breadcrumb navigation
- Section features
- Design professionnel

## 🎯 Comment utiliser

### Option 1 : Page HTML standalone
```bash
# Copier le fichier sur votre serveur
cp integration-moverz.html /path/to/moverz.fr/inventaire-ia.html
```

### Option 2 : Intégration React/Next.js
```bash
# Copier le composant dans votre projet
cp integration-react-component.jsx /path/to/moverz.fr/components/InventaireIA.jsx
cp integration-nextjs-page.tsx /path/to/moverz.fr/app/inventaire-ia/page.tsx
```

## 🔧 Configuration requise

### Headers CORS (déjà configurés)
L'app movers_v3 est déjà configurée avec :
- `X-Frame-Options: ALLOWALL`
- `Content-Security-Policy: frame-ancestors *`

### Permissions iframe
L'iframe inclut les permissions nécessaires :
- `allow="camera; microphone; fullscreen"`
- `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"`

## 📱 Fonctionnalités

✅ **Mode iframe détecté** : L'app s'adapte automatiquement  
✅ **Mobile optimisé** : Interface 1 ligne par article  
✅ **Navigation cachée** : Version info masquée en mode iframe  
✅ **Responsive** : S'adapte à toutes les tailles d'écran  
✅ **Sécurisé** : Headers CORS configurés  

## 🚀 URL de production

**App déployée** : https://moverz-v3.vercel.app/

## 📋 Checklist d'intégration

- [ ] Copier le fichier d'intégration choisi
- [ ] Tester l'iframe sur votre site
- [ ] Vérifier le responsive mobile
- [ ] Personnaliser le design si nécessaire
- [ ] Ajouter à la navigation de moverz.fr

## 🎨 Personnalisation

### Changer l'URL de l'iframe
```html
<iframe src="https://moverz-v3.vercel.app/" ...>
```

### Modifier le style
```css
.iframe-container {
    height: 80vh; /* Ajuster la hauteur */
    border-radius: 12px; /* Changer les coins arrondis */
}
```

### Ajouter des fonctionnalités
- Analytics (Google Analytics, etc.)
- Tracking des conversions
- A/B testing
- Personnalisation par utilisateur

## 🔍 Debug

### Problèmes courants
1. **Iframe ne se charge pas** : Vérifier les headers CORS
2. **Erreur de sécurité** : Vérifier les permissions sandbox
3. **Mobile cassé** : Vérifier le viewport meta tag

### Tests recommandés
- [ ] Test sur desktop (Chrome, Firefox, Safari)
- [ ] Test sur mobile (iOS Safari, Android Chrome)
- [ ] Test de l'upload de photos
- [ ] Test de l'analyse IA
- [ ] Test du responsive design

## 📞 Support

L'app movers_v3 est indépendante et peut être modifiée sans impact sur moverz.fr.

**Repo movers_v3** : https://github.com/gdetaisne/moverz_v3  
**Déploiement** : https://moverz-v3.vercel.app/
