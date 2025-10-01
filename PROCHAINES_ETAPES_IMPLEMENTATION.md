# 🚀 PROCHAINES ÉTAPES : Implémentation des services spécialisés

## ✅ CE QUI EST FAIT

1. ✅ Prompts Gemini/GPT créés et soumis
2. ✅ Réponses reçues et analysées (REPONSE_GEMINI.md, REPONSE_GPT.md)
3. ✅ Synthèse comparative créée (SYNTHESE_PROMPTS_SPECIALISES.md)
4. ✅ **3 prompts spécialisés créés** dans `lib/specializedPrompts.ts` :
   - `ARMOIRES_SYSTEM_PROMPT` + `ARMOIRES_USER_PROMPT`
   - `TABLES_SYSTEM_PROMPT` + `TABLES_USER_PROMPT`
   - `CANAPES_SYSTEM_PROMPT` + `CANAPES_USER_PROMPT`

---

## 🔧 CE QUI RESTE À FAIRE

### **ÉTAPE 1 : Créer les 3 services spécialisés** 📦

Créer 3 nouveaux fichiers dans `/services/` :

#### **A) `services/armoiresAnalysis.ts`**

Structure similaire à `volumineuxAnalysis.ts` :

```typescript
export interface ArmoiresAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid';
  analysisType: 'armoires';
}

export async function analyzeArmoiresHybrid(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<ArmoiresAnalysisResult> {
  // 1. Lancer Claude + OpenAI en parallèle avec prompts ARMOIRES
  // 2. Merger les résultats
  // 3. Post-traiter (catalogue, validation)
  // 4. Retourner résultat
}
```

**Points clés** :
- Utiliser `SPECIALIZED_AI_SETTINGS.armoires` pour les prompts
- Parser le champ `reasoning` pour vérifier la qualité du raisonnement
- Valider que `detected_features.nb_portes` est présent
- Appliquer catalogue SEULEMENT si cohérent

#### **B) `services/tablesAnalysis.ts`**

```typescript
export interface TablesAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid';
  analysisType: 'tables';
}

export async function analyzeTablesHybrid(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<TablesAnalysisResult> {
  // 1. Lancer Claude + OpenAI en parallèle avec prompts TABLES
  // 2. Merger les résultats
  // 3. VALIDATION MORPHOLOGIQUE CRITIQUE (ratio L/W)
  // 4. Retourner résultat
}
```

**Points clés** :
- Valider `detected_features.forme` + `detected_features.ratio_LW`
- **JAMAIS appliquer catalogue si forme incompatible**
- Si ratio < 1.2 → force "carrée", si > 1.2 → force "rectangulaire"

#### **C) `services/canapesAnalysis.ts`**

```typescript
export interface CanapesAnalysisResult extends TPhotoAnalysis {
  processingTime: number;
  aiProvider: 'claude' | 'openai' | 'hybrid';
  analysisType: 'canapes';
}

export async function analyzeCanapesHybrid(opts: {
  photoId: string;
  imageUrl: string;
}): Promise<CanapesAnalysisResult> {
  // 1. Lancer Claude + OpenAI en parallèle avec prompts CANAPES
  // 2. Merger les résultats
  // 3. Vérifier formule L = Places×60 + 2×Accoudoirs
  // 4. Retourner résultat
}
```

**Points clés** :
- Valider `detected_features.nb_places` + `detected_features.type`
- Parser `reasoning` pour vérifier présence de la formule
- Détecter canapé d'angle → séparer en 2 modules

---

### **ÉTAPE 2 : Modifier `services/optimizedAnalysis.ts`** 🔗

Passer de **2 analyses parallèles** à **5 analyses parallèles** :

#### **AVANT** :
```typescript
export async function analyzePhotoWithOptimizedVision(opts) {
  const [volumineuxResults, petitsResults] = await Promise.all([
    analyzeVolumineuxHybrid(opts),
    analyzePetitsHybrid(opts)
  ]);
  
  const deduplicatedItems = deduplicateItems(
    volumineuxResults.items,
    petitsResults.items
  );
}
```

#### **APRÈS** :
```typescript
export async function analyzePhotoWithOptimizedVision(opts) {
  const [armoiresResults, tablesResults, canapesResults, autresVolumineuxResults, petitsResults] = await Promise.all([
    analyzeArmoiresHybrid(opts),    // NOUVEAU
    analyzeTablesHybrid(opts),      // NOUVEAU
    analyzeCanapesHybrid(opts),     // NOUVEAU
    analyzeVolumineuxHybrid(opts),  // Modifié (exclure armoires/tables/canapés)
    analyzePetitsHybrid(opts)       // Inchangé
  ]);
  
  const deduplicatedItems = deduplicateItems(
    armoiresResults.items,
    tablesResults.items,
    canapesResults.items,
    autresVolumineuxResults.items,
    petitsResults.items
  );
}
```

**Points clés** :
- Modifier `VOLUMINEUX_USER_PROMPT` pour exclure armoires/tables/canapés
- Adapter `deduplicateItems()` pour 5 sources au lieu de 2
- Garder même logique de merge

---

### **ÉTAPE 3 : Modifier `VOLUMINEUX_USER_PROMPT`** ✏️

Exclure les catégories maintenant spécialisées :

```typescript
export const VOLUMINEUX_USER_PROMPT = `JSON schema pour objets VOLUMINEUX (>50cm):

⚠️ EXCLURE de cette analyse (catégories spécialisées traitées ailleurs) :
❌ Armoires, penderies, dressings
❌ Tables à manger
❌ Canapés

✅ Objets à DÉTECTER dans cette analyse :
- Lits, matelas, têtes de lit
- Commodes, buffets, bibliothèques
- Électroménagers : réfrigérateur, lave-linge, etc.
- **CHAISES** (toutes)
- Gros objets : piano, vélo, etc.

[...reste du prompt...]
`;
```

---

### **ÉTAPE 4 : Tester et mesurer** 🧪

#### **Tests à effectuer** :

1. **Test ARMOIRES** :
   - Photo avec armoire 2 portes → doit retourner ~120×60×220
   - Photo avec armoire 3 portes → doit retourner ~150-180×60×220
   - Vérifier `reasoning` contient le calcul (nb_portes × largeur_porte)

2. **Test TABLES** :
   - Photo table carrée 150×150 avec 6 chaises → doit retourner 140×140×75 (PAS 200×100 !)
   - Photo table rectangulaire 6 places → doit retourner 160×90×75
   - Vérifier `detected_features.ratio_LW` < 1.2 pour carré

3. **Test CANAPÉS** :
   - Photo canapé 3 places accoudoirs larges → doit retourner ~230×90-100×85
   - Photo canapé d'angle → doit séparer en 2 modules
   - Vérifier `reasoning` contient formule (3×60 + 2×25 = 230)

#### **Métriques à mesurer** :

| Avant (2 analyses) | Après (5 analyses) |
|--------------------|-------------------|
| Temps total : ~X ms | Temps total : ~Y ms (doit être similaire car parallèle) |
| Précision armoires : ? | Précision armoires : à mesurer |
| Précision tables : ? | Précision tables : à mesurer |
| Précision canapés : ? | Précision canapés : à mesurer |

---

### **ÉTAPE 5 : Documentation** 📝

Créer `ARCHITECTURE_ANALYSES_V2.md` :

```
IMAGE → 5 ANALYSES PARALLÈLES → MERGE → INVENTAIRE

├─ analyzeArmoiresHybrid()
│  ├─ Claude (ARMOIRES_SYSTEM_PROMPT)
│  └─ OpenAI (ARMOIRES_SYSTEM_PROMPT)
│  → Raisonnement : Compter portes + Calculer largeur
│
├─ analyzeTablesHybrid()
│  ├─ Claude (TABLES_SYSTEM_PROMPT)
│  └─ OpenAI (TABLES_SYSTEM_PROMPT)
│  → Validation morphologique : ratio L/W < 1.2 = carré
│
├─ analyzeCanapesHybrid()
│  ├─ Claude (CANAPES_SYSTEM_PROMPT)
│  └─ OpenAI (CANAPES_SYSTEM_PROMPT)
│  → Formule : L = Places×60 + 2×Accoudoirs
│
├─ analyzeVolumineuxHybrid()
│  └─ Reste des gros objets (lits, électroménagers, etc.)
│
└─ analyzePetitsHybrid()
   └─ Petits objets (<50cm)
```

---

## 🎯 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### **Phase 1 : TABLES (priorité immédiate)**
1. Créer `services/tablesAnalysis.ts`
2. Tester sur ta photo problématique (table 150×150)
3. Valider que ça corrige l'erreur 150×150 → 200×100

### **Phase 2 : ARMOIRES (impact maximal)**
1. Créer `services/armoiresAnalysis.ts`
2. Tester sur photos avec armoires 2/3 portes
3. Mesurer amélioration précision (±1-1.5 m³ attendu)

### **Phase 3 : CANAPÉS (optimisation)**
1. Créer `services/canapesAnalysis.ts`
2. Tester formule accoudoirs
3. Mesurer amélioration

### **Phase 4 : Intégration complète**
1. Modifier `optimizedAnalysis.ts`
2. Adapter `deduplicateItems()`
3. Tester flow complet

---

## ✅ CRITÈRES DE SUCCÈS

| Critère | Objectif | Mesure |
|---------|----------|--------|
| Précision tables carrées | 100% | Table 150×150 détectée comme 140×140 (PAS 200×100) |
| Précision armoires | ±10% | Armoire 2 portes → 110-130×55-65×210-230 |
| Précision canapés | ±10% | Canapé 3 places → 210-240×85-100×80-90 |
| Performance | < +20% | Temps total analyses ≤ 1.2× temps actuel |
| Raisonnement explicite | 100% | Tous items ont `reasoning` détaillé |

---

## 🤔 QUESTIONS OUVERTES

1. **Quand un objet est détecté par 2 analyses** (ex: table détectée par TABLES + VOLUMINEUX) :
   - Priorité à l'analyse spécialisée ? ✅ OUI
   - Supprimer doublon dans `deduplicateItems()` ? ✅ OUI

2. **Si analyse spécialisée échoue** (ex: pas de chaises autour table) :
   - Fallback sur analyse volumineux ? ✅ OUI (via merge)
   - Ou rejeter l'objet ? ❌ NON

3. **Ordre de priorité pour merge** :
   - Tables spécialisé > Volumineux > Catalogue
   - Armoires spécialisé > Volumineux > Catalogue
   - Canapés spécialisé > Volumineux > Catalogue

---

## 🚀 TU VEUX QUE JE COMMENCE PAR QUOI ?

**Option A** : Créer `services/tablesAnalysis.ts` d'abord (test rapide sur ton cas)

**Option B** : Créer les 3 services d'un coup

**Option C** : Faire un commit des prompts d'abord, puis implémenter

