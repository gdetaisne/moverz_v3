# ✅ Checklist de tests manuels - Moverz v4 Frontend

## 🚀 Démarrage

```bash
cd apps/web
pnpm dev
```

URL : http://localhost:3000

---

## 📝 Tests à effectuer

### 1. Page d'accueil (/)

- [ ] La page charge sans erreur
- [ ] Le header est visible avec le logo "M" et le titre "Moverz"
- [ ] Les 5 liens de navigation sont présents (Upload, Inventaire, Estimation, Devis, Admin)
- [ ] Le hero affiche "Bienvenue sur Moverz v4"
- [ ] Les 3 cartes de features sont visibles (Upload, Inventaire, Devis)
- [ ] Le bouton "Commencer maintenant" est cliquable
- [ ] Clic sur "Commencer" → redirige vers /upload

---

### 2. Page Upload (/upload)

- [ ] Le stepper horizontal est visible (étape 1 active)
- [ ] La zone de drag & drop s'affiche
- [ ] L'icône de photo est présente
- [ ] Texte "Glissez-déposez vos photos ici"
- [ ] Drag & drop d'une image → aperçu miniature apparaît
- [ ] Bouton de suppression (×) sur hover de la miniature
- [ ] Multiple images → grid 2x4 s'affiche correctement
- [ ] Bouton "Analyser avec l'IA" devient actif
- [ ] Clic "Analyser" → loader s'affiche
- [ ] Après analyse → redirection vers /inventory

---

### 3. Page Inventaire (/inventory)

- [ ] Le stepper affiche l'étape 2 active
- [ ] Le tableau d'inventaire s'affiche
- [ ] Colonnes : Nom, Catégorie, Quantité, Fragile, Démontable, Actions
- [ ] Édition inline de la quantité fonctionne
- [ ] Checkbox "Fragile" cliquable
- [ ] Checkbox "Démontable" cliquable
- [ ] Bouton "Supprimer" retire l'objet
- [ ] Hover sur ligne → fond gris léger
- [ ] Bouton "Continuer vers l'estimation" en bas à droite
- [ ] Clic → redirection vers /estimate

---

### 4. Page Estimation (/estimate)

- [ ] Le stepper affiche l'étape 3 active
- [ ] La carte bleue d'estimation s'affiche
- [ ] Volume total en m³ visible
- [ ] Prix estimé en € visible
- [ ] Breakdown : nombre d'objets, fragiles, démontables
- [ ] Message informatif en bas de carte
- [ ] Bouton "Préparer la demande de devis"
- [ ] Clic → redirection vers /quote

---

### 5. Page Devis (/quote)

- [ ] Le stepper affiche l'étape 4 active
- [ ] Header bleu "Récapitulatif de votre devis"
- [ ] Carte résumé avec 3 métriques (volume, objets, prix)
- [ ] Carte détails avec liste d'objets
- [ ] Badges "Fragile" et "Démontable" visibles
- [ ] Scroll si liste longue
- [ ] Bouton "Envoyer le devis" en bas
- [ ] Clic → écran de confirmation avec ✓ vert
- [ ] Message "Devis envoyé avec succès"
- [ ] Redirection automatique vers / après 3s

---

### 6. Page Admin (/admin)

- [ ] Titre "Administration"
- [ ] Icône ⚙️ visible
- [ ] 2 boutons : "Vérifier le statut" et "Réinitialiser"
- [ ] Clic "Vérifier" → loader s'affiche
- [ ] Si API OK → 3 cartes de statut (IA, DB, Queue)
- [ ] Badges verts pour "ok"
- [ ] Clic "Réinitialiser" → alert de confirmation
- [ ] localStorage vidé après confirmation

---

## 🎨 Tests visuels (responsive)

### Desktop (1920px)
- [ ] Layout centré avec max-width
- [ ] Espacement généreux
- [ ] Grids bien alignés

### Tablet (768px)
- [ ] Navigation responsive
- [ ] Grids passent en 1 ou 2 colonnes
- [ ] Boutons pleine largeur

### Mobile (375px)
- [ ] Header compact
- [ ] Stepper lisible
- [ ] Tableaux avec scroll horizontal
- [ ] Touch-friendly (zones de clic >44px)

---

## 🛡️ Tests d'erreurs

### Sans authentification
- [ ] Page d'accueil affiche "Authentification requise"
- [ ] Popup rouge avec icône 🔒
- [ ] Message clair sur NEXT_PUBLIC_ADMIN_BYPASS_TOKEN

### Erreur API
- [ ] Carte rouge avec message d'erreur
- [ ] Pas de crash de l'application
- [ ] SafeBoundary attrape les erreurs React

### Navigation sans données
- [ ] Inventaire vide → message "Aucun objet"
- [ ] Estimation sans items → warning jaune
- [ ] Boutons désactivés si données manquantes

---

## ⚡ Tests de performance

- [ ] Pas de console.log en production
- [ ] Images optimisées
- [ ] Pas de re-render excessif
- [ ] Transitions fluides (<100ms)
- [ ] First paint < 2s

---

## ✅ Validation finale

- [ ] Aucune erreur dans la console
- [ ] Aucun warning React
- [ ] TypeScript sans erreur
- [ ] Linter sans erreur
- [ ] Workflow complet fonctionne de bout en bout
- [ ] Design cohérent sur toutes les pages
- [ ] Navigation claire et intuitive

---

## 🐛 Bugs connus / Limitations

- Build production échoue à cause des routes API backend existantes (app/api/batches, etc.)
- Les appels API réels doivent être testés avec le backend en fonctionnement
- Mock data utilisé pour la démonstration

---

## 📞 Contact

En cas de problème, vérifier :
1. Node version : `node -v` → v24+
2. Dépendances : `pnpm install`
3. Variables d'env : `NEXT_PUBLIC_ADMIN_BYPASS_TOKEN`
4. Backend actif : http://localhost:3001

---

**Date de création** : 8 octobre 2025  
**Version** : Moverz v4 Frontend Rebuild



