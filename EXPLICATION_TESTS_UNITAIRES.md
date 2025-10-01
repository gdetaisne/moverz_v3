# 🧪 C'est quoi les Tests Unitaires ?

## 📖 Définition Simple

**Un test unitaire** = Vérifier qu'une fonction fait bien ce qu'elle doit faire

C'est comme **tester une voiture avant de la vendre** :
- ✅ Les freins fonctionnent ?
- ✅ Le moteur démarre ?
- ✅ Les phares s'allument ?

Pour le code, c'est pareil !

---

## 🎯 Analogie Facile

### Sans Tests (Dangereux)
```
Vous : "J'ai créé une fonction qui calcule 2 + 2"
Client : "Elle marche ?"
Vous : "Je pense que oui... 🤷"
Client : "Vous PENSEZ ?!" 😱
```

### Avec Tests (Professionnel)
```
Vous : "J'ai créé une fonction qui calcule 2 + 2"
Test : ✅ 2 + 2 = 4 (OK)
Test : ✅ 5 + 3 = 8 (OK)
Test : ✅ 0 + 0 = 0 (OK)
Vous : "Oui, elle marche ! J'ai 100 tests qui le prouvent"
Client : "Excellent !" 😊
```

---

## 💡 Exemple Concret dans notre Projet

### Fonction à Tester (depthDatabase.ts)
```typescript
// Cette fonction calcule la profondeur typique d'un objet
export function calculateSmartDepth(
  label: string,
  width: number,
  height: number
): number {
  // Si c'est un canapé, retourne ~90cm
  if (label.toLowerCase().includes('canapé')) {
    return 90;
  }
  // Si c'est une chaise, retourne ~48cm
  if (label.toLowerCase().includes('chaise')) {
    return 48;
  }
  // Par défaut, 60% de la largeur
  return width * 0.6;
}
```

### Test Unitaire (depthDatabase.test.ts)
```typescript
import { calculateSmartDepth } from './depthDatabase';

describe('calculateSmartDepth', () => {
  
  // Test 1 : Canapé
  it('devrait retourner 90cm pour un canapé', () => {
    const result = calculateSmartDepth('canapé', 200, 80);
    expect(result).toBe(90);
    // ✅ Si result = 90, test PASS
    // ❌ Si result ≠ 90, test FAIL
  });

  // Test 2 : Chaise
  it('devrait retourner 48cm pour une chaise', () => {
    const result = calculateSmartDepth('chaise', 50, 100);
    expect(result).toBe(48);
  });

  // Test 3 : Objet inconnu
  it('devrait retourner 60% de la largeur pour un objet inconnu', () => {
    const result = calculateSmartDepth('table', 100, 75);
    expect(result).toBe(60); // 100 * 0.6 = 60
  });

  // Test 4 : Edge case (cas limite)
  it('devrait gérer les valeurs à 0', () => {
    const result = calculateSmartDepth('objet', 0, 0);
    expect(result).toBe(0);
  });
});
```

---

## 🔧 Structure d'un Test

### Anatomie d'un Test
```typescript
describe('NomDeLaFonction', () => {
  //        ↑
  //    Groupe de tests
  
  it('devrait faire quelque chose de précis', () => {
    // 1. ARRANGE (Préparer)
    const input = 'canapé';
    const width = 200;
    const height = 80;
    
    // 2. ACT (Agir)
    const result = calculateSmartDepth(input, width, height);
    
    // 3. ASSERT (Vérifier)
    expect(result).toBe(90);
    //              ↑
    //         Ce qu'on attend
  });
});
```

### Les 3 Étapes (AAA Pattern)
1. **Arrange** (Préparer) : Préparer les données de test
2. **Act** (Agir) : Appeler la fonction à tester
3. **Assert** (Vérifier) : Vérifier que le résultat est correct

---

## 🎓 Vocabulaire des Tests

### Les Mots Clés
```typescript
describe()   // Groupe de tests (comme un dossier)
it()         // Un test individuel
expect()     // Ce qu'on attend comme résultat
toBe()       // Doit être égal à
toEqual()    // Doit être profondément égal à (objets)
toBeNull()   // Doit être null
toBeDefined()// Doit être défini
toContain()  // Doit contenir
```

### Exemples d'Assertions
```typescript
// Égalité simple
expect(2 + 2).toBe(4);

// Égalité d'objets
expect({ name: 'John' }).toEqual({ name: 'John' });

// Contient
expect([1, 2, 3]).toContain(2);

// Null/Undefined
expect(null).toBeNull();
expect(undefined).toBeUndefined();

// Vrai/Faux
expect(true).toBeTruthy();
expect(false).toBeFalsy();

// Plus grand/petit
expect(10).toBeGreaterThan(5);
expect(3).toBeLessThan(10);
```

---

## 💼 Pourquoi c'est Important ?

### Avantages des Tests

| Sans Tests | Avec Tests |
|------------|------------|
| ❌ Bugs découverts en prod | ✅ Bugs détectés avant |
| ❌ "Ça marche sur ma machine" | ✅ "Ça marche partout" |
| ❌ Peur de modifier le code | ✅ Confiance pour refactorer |
| ❌ Régression facile | ✅ Régression détectée |
| ❌ Documentation absente | ✅ Tests = documentation |

### Exemple Réel

**Scénario** : Vous modifiez `calculateSmartDepth()` :
```typescript
// AVANT
return width * 0.6;

// APRÈS (erreur)
return width * 6;  // Oups ! Oublié le 0.
```

**Sans test** :
- ❌ Vous ne voyez pas l'erreur
- ❌ Vous déployez
- ❌ Toutes les profondeurs sont 10x trop grandes !
- ❌ Clients mécontents

**Avec test** :
- ✅ Test FAIL immédiatement : "Expected 60, got 600"
- ✅ Vous corrigez avant de déployer
- ✅ Aucun bug en production !

---

## 🛠️ Comment Créer des Tests dans notre Projet ?

### Structure des Fichiers
```
moverz_v3/
├── services/
│   ├── imageCalibrationService.ts
│   └── __tests__/                    ← Dossier de tests
│       └── imageCalibrationService.test.ts
├── lib/
│   ├── depthDatabase.ts
│   └── __tests__/
│       └── depthDatabase.test.ts
```

### Framework Utilisé : Jest + TypeScript

**Jest** = L'outil de test le plus populaire pour JavaScript/TypeScript
- Facile à utiliser
- Rapide
- Intégré avec TypeScript

---

## 📝 Exemple Complet : Test de depthDatabase

### Fichier à Tester
```typescript
// lib/depthDatabase.ts
export function getTypicalDepth(label: string): number {
  const depths = {
    'canapé': 90,
    'chaise': 48,
    'table basse': 65
  };
  return depths[label.toLowerCase()] || 60;
}
```

### Fichier de Test
```typescript
// lib/__tests__/depthDatabase.test.ts
import { getTypicalDepth } from '../depthDatabase';

describe('getTypicalDepth', () => {
  
  it('devrait retourner 90 pour un canapé', () => {
    expect(getTypicalDepth('canapé')).toBe(90);
  });

  it('devrait retourner 48 pour une chaise', () => {
    expect(getTypicalDepth('chaise')).toBe(48);
  });

  it('devrait être insensible à la casse', () => {
    expect(getTypicalDepth('CANAPÉ')).toBe(90);
    expect(getTypicalDepth('Chaise')).toBe(48);
  });

  it('devrait retourner 60 pour un objet inconnu', () => {
    expect(getTypicalDepth('objet_inconnu')).toBe(60);
  });

  it('devrait gérer les chaînes vides', () => {
    expect(getTypicalDepth('')).toBe(60);
  });
});
```

### Lancer les Tests
```bash
# Lancer tous les tests
npm test

# Lancer un fichier spécifique
npm test depthDatabase.test.ts

# Lancer avec coverage (voir quelles lignes sont testées)
npm test -- --coverage
```

### Résultat Attendu
```
 PASS  lib/__tests__/depthDatabase.test.ts
  getTypicalDepth
    ✓ devrait retourner 90 pour un canapé (2 ms)
    ✓ devrait retourner 48 pour une chaise (1 ms)
    ✓ devrait être insensible à la casse (1 ms)
    ✓ devrait retourner 60 pour un objet inconnu (1 ms)
    ✓ devrait gérer les chaînes vides (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        1.234 s
```

---

## 🎯 Tests à Créer pour Sprint 1 & 2

### Priorité 1 : Tests Critiques (4 fichiers)

#### 1. lib/depthDatabase.test.ts
```typescript
describe('getTypicalDepth', () => {
  it('devrait retourner des profondeurs correctes pour objets connus');
  it('devrait gérer les objets inconnus');
});

describe('calculateSmartDepth', () => {
  it('devrait calculer la profondeur avec ratios');
  it('devrait valider les dimensions');
});
```

#### 2. services/referenceObjectDetector.test.ts
```typescript
describe('ReferenceObjectDetector', () => {
  it('devrait détecter les objets de référence');
  it('devrait filtrer par qualité');
  it('devrait trier par priorité');
});
```

#### 3. services/imageCalibrationService.test.ts
```typescript
describe('ImageCalibrationService', () => {
  it('devrait calculer le scale factor');
  it('devrait gérer le fallback si pas de référence');
  it('devrait appliquer la calibration');
});
```

#### 4. services/contextualAnalysisService.test.ts
```typescript
describe('ContextualAnalysisService', () => {
  it('devrait détecter les incohérences');
  it('devrait générer des ajustements');
  it('devrait calculer le score de cohérence');
});
```

---

## ⏱️ Temps Estimé

- **Setup** : 15 min (installer Jest si nécessaire)
- **Test depthDatabase** : 30 min (le plus simple)
- **Test referenceObjectDetector** : 45 min
- **Test imageCalibrationService** : 1h (mocks API)
- **Test contextualAnalysisService** : 1h (mocks)

**TOTAL : 3-4 heures pour 50%+ de coverage**

---

## 🚀 Prochaine Étape

**Je peux créer les tests pour vous !**

### Option 1 : Tests Minimaux (2h)
- depthDatabase ✅
- referenceObjectDetector ✅

### Option 2 : Tests Complets (4h)
- Tous les 4 fichiers ✅
- Coverage > 50% ✅

**Voulez-vous que je crée les tests maintenant ?**

---

## 📚 Ressources

### Documentation
- Jest : https://jestjs.io/
- Testing Best Practices : https://testingjavascript.com/

### Analogie Finale
```
Code sans tests = Pont construit sans vérification
Code avec tests = Pont certifié, inspecté, sûr

Vous voulez quel pont pour vos clients ? 😉
```
