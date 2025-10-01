# 🔀 EXPLICATION : MERGE ET DOUBLONS (Claude + OpenAI)

## 📍 Fichier concerné
`services/volumineuxAnalysis.ts` → fonction `mergeVolumineuxItems` (lignes 377-403)

---

## 🔧 COMMENT ÇA FONCTIONNE ACTUELLEMENT

### Étape 1 : Créer une Map avec les items de Claude
```typescript
items1.forEach(item => {
  const key = item.label.toLowerCase();  // ← LA CLÉ DE COMPARAISON
  mergedMap.set(key, { ...item, source: 'claude' });
});
```

**Exemple :**
```javascript
Claude détecte : "table à manger"
→ Map: { "table à manger": {...item, source: 'claude'} }
```

---

### Étape 2 : Fusionner avec les items d'OpenAI
```typescript
items2.forEach(item => {
  const key = item.label.toLowerCase();  // ← LA CLÉ DE COMPARAISON
  const existing = mergedMap.get(key);
  
  if (existing) {
    // ✅ MÊME CLÉ → Fusionner
    mergedMap.set(key, {
      ...item,
      quantity: Math.max(existing.quantity, item.quantity),
      confidence: Math.max(existing.confidence, item.confidence),
      source: 'hybrid'
    });
  } else {
    // ❌ CLÉ DIFFÉRENTE → Ajouter comme nouvel item
    mergedMap.set(key, { ...item, source: 'openai' });
  }
});
```

**Exemple problématique :**
```javascript
OpenAI détecte : "table"

Comparaison:
  mergedMap.get("table") === undefined  // ❌ Pas de match avec "table à manger"

Résultat:
  Map: { 
    "table à manger": {...item1, source: 'claude'},
    "table": {...item2, source: 'openai'}  // ← DOUBLON !
  }
```

---

## 🐛 LE PROBLÈME

### Comparaison STRICTE par label
```typescript
const key = item.label.toLowerCase();
```

**Ça marche SI :**
- Claude dit : `"chaise"`
- OpenAI dit : `"chaise"`
- Clé identique → ✅ Fusion OK

**Ça NE marche PAS SI :**
- Claude dit : `"table à manger"`
- OpenAI dit : `"table"`
- Clés différentes → ❌ 2 entrées créées !

---

## 🎯 AUTRES CAS PROBLÉMATIQUES

| Claude | OpenAI | Résultat actuel |
|--------|--------|-----------------|
| `"canapé"` | `"sofa"` | ❌ 2 entrées |
| `"table à manger"` | `"dining table"` | ❌ 2 entrées |
| `"table à manger"` | `"table salle à manger"` | ❌ 2 entrées |
| `"armoire"` | `"garde-robe"` | ❌ 2 entrées |
| `"télévision"` | `"TV"` | ❌ 2 entrées |
| `"lampe suspendue"` | `"lustre"` | ❌ 2 entrées |

---

## ✅ SOLUTIONS POSSIBLES

### **Option 1 : Normalisation basique (rapide)**
Normaliser les labels avant comparaison :

```typescript
function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/table à manger|dining table|table salle à manger/g, 'table manger')
    .replace(/canapé|sofa|couch/g, 'canape')
    .replace(/télévision|tv|écran/g, 'television')
    .trim();
}

// Utilisation:
const key = normalizeLabel(item.label);
```

**Avantages :** Simple, rapide
**Inconvénients :** Maintenance (faut ajouter tous les cas), pas flexible

---

### **Option 2 : Similarité textuelle (intelligent)**
Comparer la similarité entre 2 labels :

```typescript
function areSimilarLabels(label1: string, label2: string): boolean {
  const l1 = label1.toLowerCase();
  const l2 = label2.toLowerCase();
  
  // Exacte
  if (l1 === l2) return true;
  
  // L'un contient l'autre (au moins 50% de longueur)
  const shorter = l1.length < l2.length ? l1 : l2;
  const longer = l1.length < l2.length ? l2 : l1;
  
  if (longer.includes(shorter) && shorter.length >= longer.length * 0.5) {
    return true;
  }
  
  // Similarité de Levenshtein (distance d'édition)
  const distance = levenshteinDistance(l1, l2);
  const maxLength = Math.max(l1.length, l2.length);
  const similarity = 1 - (distance / maxLength);
  
  return similarity > 0.7; // 70% de similarité
}
```

**Avantages :** Flexible, intelligent, capture beaucoup de cas
**Inconvénients :** Plus complexe, peut créer des faux positifs

---

### **Option 3 : Utiliser le catalogue comme référence**
Mapper chaque label vers une "catégorie canonique" :

```typescript
// Dans normalize.ts
export function getCanonicallabel(label: string): string {
  const normalized = normalizeLabel(label);
  
  // Chercher dans le catalogue
  for (const row of CATALOG) {
    if (row.aliases.some(alias => normalizeLabel(alias) === normalized)) {
      return row.key; // Retourne la clé canonique
    }
  }
  
  return normalized; // Fallback
}

// Utilisation dans merge:
const key = getCanonicalLabel(item.label);
```

**Exemple :**
```javascript
"table à manger" → key: "table-a-manger"
"dining table" → key: "table-a-manger"
"table" → key: "table-a-manger" (si alias ajouté)

→ ✅ Même clé → Fusion !
```

**Avantages :** Robuste, utilise l'infrastructure existante
**Inconvénients :** Limité aux objets du catalogue

---

### **Option 4 : Hybride (Recommandé 🏆)**
Combiner catalogue + similarité :

```typescript
function getMergeKey(label: string, allLabels: string[]): string {
  // 1. Essayer le catalogue
  const canonical = getCanonicalLabel(label);
  
  // 2. Si pas dans le catalogue, chercher un label similaire déjà présent
  for (const existingLabel of allLabels) {
    if (areSimilarLabels(label, existingLabel)) {
      return normalizeLabel(existingLabel);
    }
  }
  
  // 3. Fallback : label normalisé
  return normalizeLabel(label);
}
```

**Avantages :** Best of both worlds
**Inconvénients :** Plus complexe

---

## 🧪 EXEMPLES DE TESTS

### Test 1 : Labels identiques
```javascript
Claude: "chaise"
OpenAI: "chaise"
→ ✅ 1 entrée "chaise"
```

### Test 2 : Labels similaires
```javascript
Claude: "table à manger"
OpenAI: "table"
→ ✅ 1 entrée "table à manger" (ou "table" selon priorité)
```

### Test 3 : Synonymes
```javascript
Claude: "canapé"
OpenAI: "sofa"
→ ✅ 1 entrée "canapé" (via catalogue)
```

### Test 4 : Objets vraiment différents
```javascript
Claude: "table"
OpenAI: "chaise"
→ ✅ 2 entrées distinctes
```

---

## 🎯 MA RECOMMANDATION

**Option 4 (Hybride)** avec cette logique :

1. **Si les 2 labels sont dans le catalogue** → Utiliser la clé canonique
2. **Sinon, calculer similarité** → Si >70%, considérer comme identique
3. **Sinon** → Objets différents

**Priorité pour le merge :**
- Prendre le label le **plus précis** (le plus long)
- Prendre la **quantité max**
- Prendre la **confidence max**

---

## 📝 QUESTIONS POUR TOI

1. **Tu veux que je code quelle option ?**
2. **Pour "table à manger" vs "table", lequel tu préfères garder ?** (le plus précis ?)
3. **Seuil de similarité acceptable ?** (70% ? 80% ?)

Dis-moi et je l'implémente ! 🚀

