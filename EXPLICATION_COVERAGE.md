# 📊 C'est quoi le "Coverage" (Couverture de Tests) ?

## 🎯 Définition Simple

**Coverage** = Pourcentage de votre code qui est testé

C'est comme un **bilan de santé** de vos tests :
- 🟢 **80-100%** : Excellent (la plupart du code est testé)
- 🟡 **50-80%** : Bien (code important testé)
- 🔴 **0-50%** : Attention (beaucoup de code non testé)

---

## 💡 Analogie Facile

### Sans Coverage Report
```
Vous : "J'ai créé 48 tests !"
Boss : "Super ! Mais ça teste combien de lignes ?"
Vous : "Euh... je ne sais pas... 🤷"
Boss : "Tu as peut-être raté des parties importantes !"
```

### Avec Coverage Report
```
Vous : "J'ai créé 48 tests !"
Boss : "Super ! Ça teste combien de lignes ?"
Vous : "73% du code ! Voici le rapport détaillé 📊"
Boss : "Excellent ! Je vois exactement ce qui est testé !" 😊
```

---

## 🔍 Exemple Concret

### Votre Fonction
```typescript
function calculatePrice(quantity: number, price: number): number {
  if (quantity <= 0) {
    return 0;  // Ligne A
  }
  if (quantity > 100) {
    return quantity * price * 0.9;  // Ligne B (réduction 10%)
  }
  return quantity * price;  // Ligne C
}
```

### Vos Tests
```typescript
it('test 1', () => {
  expect(calculatePrice(5, 10)).toBe(50);  // Teste ligne C
});

it('test 2', () => {
  expect(calculatePrice(0, 10)).toBe(0);   // Teste ligne A
});
```

### Coverage Report Vous Montre
```
calculatePrice():
  ✅ Ligne A: Testée (par test 2)
  ❌ Ligne B: NON TESTÉE ! (aucun test > 100)
  ✅ Ligne C: Testée (par test 1)

Coverage: 66% (2 lignes sur 3)
```

**🚨 Alerte** : Vous avez oublié de tester les grosses quantités (> 100) !

---

## 📊 Ce que Vous Verrez avec `npm run test:coverage`

### Dans le Terminal
```bash
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
depthDatabase.ts    |   92.5  |   85.7   |  100.0  |   92.5  |
referenceObject.ts  |   78.3  |   66.7   |   80.0  |   78.3  |
imageCalibration.ts |   12.5  |    0.0   |   20.0  |   12.5  |
contextualAnalysis.ts|   5.2  |    0.0   |   10.0  |    5.2  |
--------------------|---------|----------|---------|---------|
All files           |   72.1  |   63.1   |   77.5  |   72.1  |
--------------------|---------|----------|---------|---------|
```

### Traduction
- **% Stmts** (Statements) : % de lignes de code testées
- **% Branch** : % de conditions (if/else) testées
- **% Funcs** : % de fonctions testées
- **% Lines** : % de lignes exécutées

### Rapport HTML (Bonus !)
Un fichier HTML interactif dans `coverage/lcov-report/index.html` :
- 🟢 Lignes vertes : Testées
- 🔴 Lignes rouges : NON testées
- 🟡 Lignes jaunes : Partiellement testées

Vous pouvez **cliquer** sur chaque fichier pour voir **EXACTEMENT** quelles lignes ne sont pas testées !

---

## 🎨 Exemple Visuel du Rapport HTML

### Vue d'ensemble
```
📁 moverz_v3/
  📂 lib/
    📄 depthDatabase.ts        92.5% 🟢🟢🟢🟢🟢🟢🟢🟢🟢⚪
    📄 catalog.ts               45.2% 🟢🟢🟢🟢⚪⚪⚪⚪⚪⚪
  📂 services/
    📄 referenceObjectDetector.ts  78.3% 🟢🟢🟢🟢🟢🟢🟢⚪⚪⚪
    📄 imageCalibrationService.ts  12.5% 🟢⚪⚪⚪⚪⚪⚪⚪⚪⚪
```

### Dans un fichier (avec couleurs)
```typescript
export function calculateSmartDepth(label: string, width: number, height: number) {
  // ✅ Ligne testée (verte)
  const info = getTypicalDepth(label);
  
  // ✅ Ligne testée (verte)
  if (info) {
    // ✅ Ligne testée (verte)
    return info.average;
  }
  
  // ❌ Ligne NON testée (rouge) ← VOUS DEVRIEZ AJOUTER UN TEST !
  if (width < 0 || height < 0) {
    return 0;
  }
  
  // ✅ Ligne testée (verte)
  return width * 0.6;
}
```

---

## 🛠️ Comment Générer le Rapport ?

### Commande Simple
```bash
npm run test:coverage
```

### Ce qui se passe
1. Jest lance TOUS les tests
2. Jest **enregistre** quelles lignes sont exécutées
3. Jest **calcule** les pourcentages
4. Jest **génère** un rapport HTML
5. Vous ouvrez `coverage/lcov-report/index.html` dans votre navigateur

---

## 🎯 Pourquoi C'est Utile ?

### 1. Trouver les Trous
Vous voyez **EXACTEMENT** quelles parties du code ne sont **PAS** testées.

### 2. Prioriser les Tests
Vous savez quoi tester en priorité :
- ❌ 12% de coverage → **URGENT !**
- 🟡 60% de coverage → À améliorer
- ✅ 90% de coverage → Excellent !

### 3. Confiance Déploiement
```
Coverage 90% = "J'ai testé 90% du code, je peux déployer sereinement !"
Coverage 20% = "Euh... je croise les doigts... 🤞"
```

### 4. Documentation Visuelle
Le rapport montre graphiquement l'état de vos tests !

---

## 📝 Exemple Concret pour Votre Projet

### Actuellement (sans coverage)
```
Vous : "J'ai 48 tests"
Question : "Ça teste combien de lignes de depthDatabase.ts ?"
Réponse : "Je ne sais pas... 🤷"
```

### Avec Coverage
```bash
npm run test:coverage
```

**Résultat** :
```
depthDatabase.ts: 92.5% 🟢
- getTypicalDepth: 95% ✅
- calculateSmartDepth: 90% ✅
- validateDepth: 92% ✅

referenceObjectDetector.ts: 78% 🟡
- filterByQuality: 100% ✅
- sortByPriority: 100% ✅
- detectReferences: 0% ❌ (pas testé, utilise API)

imageCalibrationService.ts: 12% 🔴
- calibrateImage: 10% ❌
- applyCalibration: 15% ❌
```

**Vous savez maintenant** :
- ✅ `depthDatabase` est bien testé (92%)
- 🟡 `referenceObjectDetector` est OK (78%)
- ❌ `imageCalibration` a besoin de tests (12%)

---

## 🎯 En Résumé

### Option 3 = Voir un Rapport Détaillé

**Commande** :
```bash
npm run test:coverage
```

**Vous obtenez** :
1. 📊 Un tableau de % dans le terminal
2. 📄 Un rapport HTML interactif
3. 🎨 Des lignes colorées (vert = testé, rouge = non testé)

**Utilité** :
- Voir **EXACTEMENT** ce qui est testé
- Identifier les **trous** dans vos tests
- **Prioriser** les prochains tests à créer

**Temps** : 5 minutes

---

## 🚀 Voulez-vous l'essayer ?

**Je peux lancer le rapport maintenant !**

Ça vous montrera :
- ✅ Votre coverage actuel (probablement ~70%)
- 📊 Quelles lignes de code sont testées
- 🎯 Quoi améliorer si vous voulez

**C'est visuel, concret, et très informatif !**

Voulez-vous que je lance `npm run test:coverage` ? 😊
