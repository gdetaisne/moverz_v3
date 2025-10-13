# 🎨 Audit des boutons - Problèmes de contraste

## ❌ Problèmes identifiés

### 1. **Boutons avec couleurs hors charte**
- `bg-blue-*` → À remplacer par `brand-accent` ou `brand-soft`
- `bg-green-600` (étape 5 : "Envoyer ma demande") → OK mais peut être harmonisé
- `focus:ring-blue-*` → À remplacer par `focus:ring-brand-accent`

### 2. **Risques de blanc sur blanc**
- Boutons sur `bg-white` avec `text-white` ❌
- Boutons `bg-gray-50` sur fond clair
- Input checkboxes avec `bg-gray-100`

### 3. **Éléments spécifiques à corriger**

#### FragileToggle.tsx
```
Ligne 48: focus:ring-blue-300 → focus:ring-brand-accent/30
Ligne 58: bg-blue-500 → bg-brand-accent
```

#### app/page.tsx
```
Ligne 1485: focus:ring-brand-accent ✅ (déjà OK)
Ligne 1619: focus:ring-brand-accent ✅ (déjà OK)
Ligne 1648: bg-green-50 text-green-600 → OK (packaging)
Ligne 1870: bg-green-500 → OK (statut completed)
Ligne 2829: bg-green-600 → peut rester ou passer à brand-accent
```

## ✅ Palette Moverz à utiliser

### Boutons principaux (CTA)
- **Fond** : `bg-brand-accent` (#2b7a78) - vert turquoise foncé
- **Texte** : `text-white` (#ffffff)
- **Hover** : `hover:brightness-110` ou `hover:bg-brand-accent/90`
- **Focus** : `focus:ring-brand-accent focus:ring-offset-2`

### Boutons secondaires
- **Fond** : `bg-white/20` (sur fond sombre) ou `border-brand-accent`
- **Texte** : `text-brand-accent` ou `text-white`
- **Style** : `border-2 border-brand-accent`

### Boutons tertiaires/discrets
- **Fond** : `bg-gray-50` ou `bg-white/10`
- **Texte** : `text-gray-600` (sur fond clair) ou `text-white/60` (sur fond sombre)

## 📝 Actions recommandées

1. ✅ Remplacer tous les `focus:ring-blue-*` → `focus:ring-brand-accent`
2. ✅ Remplacer les indicateurs `bg-blue-500` → `bg-brand-accent`
3. ⚠️  Évaluer le bouton vert étape 5 (peut rester ou harmoniser)
4. ✅ Vérifier tous les boutons sur fond blanc ont du texte foncé visible


