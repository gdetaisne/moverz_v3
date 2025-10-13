# 🎨 Palette de couleurs Moverz appliquée

Date: 11 octobre 2025

## 📋 Résumé

La palette de couleurs et les styles visuels du projet [moverz_main](https://github.com/gdetaisne/moverz_main) ont été appliqués à l'application moverz_v3-1.

## 🎨 Palette de couleurs

### Couleurs principales (Brand Colors)

```css
/* Variables CSS */
--brand-primary: 4, 22, 58;     /* #04163a - Bleu marine foncé */
--brand-accent: 43, 122, 120;   /* #2b7a78 - Vert/Turquoise foncé */
--brand-soft: 107, 207, 207;    /* #6bcfcf - Turquoise clair/Cyan */
```

### Classes Tailwind

```typescript
brand: {
  DEFAULT: '#04163a',
  primary: '#04163a',
  accent: '#2b7a78',
  soft: '#6bcfcf',
  secondary: '#6bcfcf',
  white: '#ffffff'
}
```

## 🎭 Styles visuels appliqués

### 1. Ombres marketing

```js
boxShadow: {
  'marketing-xl': '0 10px 30px -10px rgba(0,0,0,0.35)',
  'marketing-2xl': '0 25px 60px -12px rgba(0,0,0,0.4)',
  'card': '0 8px 30px rgba(0,0,0,.12)',
  'soft': '0 4px 16px rgba(0,0,0,.08)',
  'glow': '0 0 0 4px rgba(107,207,207,.22)'
}
```

### 2. Bordures arrondies

```js
borderRadius: {
  'xl': '0.875rem',
  '2xl': '1.25rem',
  '3xl': '1.75rem'
}
```

### 3. Animations

```css
/* Fade in up */
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 4. Effets spéciaux

#### Glassmorphism
```css
.card-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### Hero gradient
```css
.bg-hero {
  background: radial-gradient(1200px 600px at 10% -10%, rgba(43,122,120,0.25), transparent), 
              linear-gradient(180deg, #04163a 0%, #04163a 60%, #06224d 100%);
}
```

#### Glow effect
```css
.glow {
  filter: blur(60px);
  background: radial-gradient(400px 200px at 80% 20%, rgba(107,207,207,0.25), transparent);
}
```

## 📝 Fichiers modifiés

### 1. `/tailwind.config.js`
- ✅ Ajout de la palette `brand` complète
- ✅ Ajout des ombres marketing
- ✅ Ajout des bordures arrondies personnalisées
- ✅ Ajout des animations fade-in-up
- ✅ Ajout de la fonction d'animation smooth

### 2. `/apps/web/app/globals.css`
- ✅ Ajout des variables CSS brand (primary, accent, soft)
- ✅ Mise à jour des couleurs des liens (brand-accent)
- ✅ Mise à jour des couleurs des boutons (brand-accent)
- ✅ Mise à jour des focus rings (brand-accent)
- ✅ Ajout des classes `.btn-brand`
- ✅ Ajout des gradients Moverz (bg-hero, bg-gradient-primary)
- ✅ Ajout des effets glassmorphism (card-glass)
- ✅ Ajout de l'effet glow

### 3. `/apps/web/app/page.tsx`
- ✅ Mise à jour du logo (bg-brand-accent)
- ✅ Mise à jour du titre (text-brand-primary)
- ✅ Mise à jour du bouton CTA (bg-brand-accent)
- ✅ Mise à jour des cartes de fonctionnalités (shadow-card, brand-primary)
- ✅ Ajout des animations (animate-fade-in-up)
- ✅ Ajout des effets hover (hover:shadow-soft, hover:-translate-y-1)

## 🎯 Utilisation dans le code

### Boutons

```tsx
// Bouton primary (vert/turquoise)
<button className="bg-brand-accent text-white hover:brightness-110">
  Action
</button>

// Bouton brand (bleu marine)
<button className="btn-brand">
  Action
</button>
```

### Titres et textes

```tsx
<h1 className="text-brand-primary">Titre principal</h1>
<p className="text-gray-600">Texte secondaire</p>
<a className="text-brand-accent hover:text-brand-soft">Lien</a>
```

### Cartes

```tsx
<div className="bg-white rounded-2xl shadow-card hover:shadow-soft">
  <div className="bg-brand-soft/20 rounded-lg">
    {/* Icon container */}
  </div>
  <h3 className="text-brand-primary">Titre</h3>
</div>
```

### Effets spéciaux

```tsx
// Hero section avec gradient
<div className="bg-hero">
  {/* Contenu */}
</div>

// Carte glassmorphism
<div className="card-glass">
  {/* Contenu transparent avec blur */}
</div>

// Effet glow
<div className="relative">
  <div className="glow absolute" />
  {/* Contenu */}
</div>
```

## 🔗 Référence

Source: [https://github.com/gdetaisne/moverz_main](https://github.com/gdetaisne/moverz_main)
- Template: `/moverz-template/tailwind.config.ts`
- Site de référence: `/sites/bordeaux/`

## 🚀 Prochaines étapes

Pour appliquer ces couleurs à d'autres composants:

1. **Remplacer les couleurs bleues par défaut**
   - `bg-blue-500` → `bg-brand-accent`
   - `text-blue-600` → `text-brand-primary`
   - `border-blue-300` → `border-brand-soft`

2. **Utiliser les nouvelles ombres**
   - `shadow-lg` → `shadow-marketing-xl`
   - `shadow-xl` → `shadow-marketing-2xl`

3. **Ajouter des effets hover**
   - `hover:shadow-soft`
   - `hover:-translate-y-1`
   - `hover:brightness-110`

4. **Utiliser les animations**
   - `animate-fade-in-up`
   - `transition-smooth`

---

**Auteur**: AI Assistant  
**Date**: 11 octobre 2025  
**Version**: 1.0


