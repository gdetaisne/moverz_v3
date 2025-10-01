# 🤖 PROMPT POUR GEMINI & GPT : Stratégies de mesure intelligente

**À copier/coller dans Gemini et GPT-4 séparément**

---

## 📋 CONTEXTE

Nous développons un système d'analyse IA pour les déménagements qui :
1. Prend des photos de pièces avec meubles
2. Détecte automatiquement les objets
3. **Estime leurs dimensions en cm (Longueur × Largeur × Hauteur)**
4. Calcule le volume total pour établir un devis

**PROBLÈME ACTUEL** : Les IAs (Claude, OpenAI) font souvent des erreurs de mesure car elles tentent une estimation visuelle directe, sans raisonnement contextuel.

**NOTRE OBSERVATION** : Tu (Gemini/GPT) es bien meilleur car tu utilises un **raisonnement logique** plutôt qu'une estimation visuelle.

**EXEMPLE CONCRET (Tables)** :
- ❌ Approche visuelle : "Cette table mesure environ 200×100cm" (souvent faux)
- ✅ Approche contextuelle : "Je vois 6 chaises → Table pour 6 personnes → Standard 140×140cm ou 160×90cm" (bien plus fiable)

---

## 🎯 NOTRE STRATÉGIE

Nous allons créer **3 prompts IA spécialisés** pour les catégories à fort impact volumétrique :

### **1️⃣ ARMOIRES / PENDERIES** 🚪
- Volume individuel : 1.5-2.5 m³
- Fréquence : 2-4 par déménagement
- **Impact erreur 20%** : ±1-1.5 m³ sur total déménagement (CRITIQUE)

### **2️⃣ TABLES À MANGER** 🍽️
- Volume individuel : 0.4-0.8 m³
- Fréquence : 1 par déménagement
- **Problème fréquent** : Confusion carré vs rectangulaire (150×150 → 200×100)

### **3️⃣ CANAPÉS** 🛋️
- Volume individuel : 1.2-2.0 m³
- Fréquence : 1-2 par déménagement
- **Problème fréquent** : Sous-estimation de la profondeur et des accoudoirs

---

## ❓ QUESTIONS POUR TOI

Pour chacune des 3 catégories ci-dessous, **explique ta méthode de raisonnement** pour estimer les dimensions **sans outil de mesure**, en utilisant uniquement :
- Le contexte visible (autres objets, architecture)
- Les standards courants du mobilier
- La logique déductive

---

### **📦 CATÉGORIE 1 : ARMOIRES / PENDERIES**

**Question** :
> Tu analyses une photo montrant une armoire/penderie. Comment déterminerais-tu ses dimensions (L×W×H) de manière intelligente ?

**Éléments à considérer** :
- Nombre de portes (1, 2, 3, 4 portes ?)
- Type (armoire classique, penderie, dressing, armoire d'angle ?)
- Références architecturales (porte de chambre ≈ 80cm, hauteur sous plafond ≈ 250cm)
- Standards du mobilier (1 porte ≈ 80cm large, 2 portes ≈ 120cm, etc.)

**Format de réponse attendu** :
```
MÉTHODE DE RAISONNEMENT :
1. [Étape 1 de ton analyse]
2. [Étape 2...]
3. [Étape 3...]

RÈGLES DE DÉDUCTION :
- Si [condition], alors [dimension estimée]
- Si [condition], alors [dimension estimée]

EXEMPLES :
- Armoire 2 portes classique → [dimensions] parce que [raison]
- Armoire 3 portes → [dimensions] parce que [raison]
```

---

### **📦 CATÉGORIE 2 : TABLES À MANGER**

**Question** :
> Tu analyses une photo montrant une table à manger. Comment déterminerais-tu ses dimensions (L×W×H) de manière intelligente ?

**Éléments à considérer** :
- Nombre de chaises autour (0, 2, 4, 6, 8+ ?)
- Forme (carrée, rectangulaire, ronde, ovale ?)
- Configuration (chaises sur combien de côtés ?)
- Standards du mobilier (table 4 personnes, 6 personnes, 8 personnes)

**NOTE IMPORTANTE** : Il est CRUCIAL de distinguer table carrée vs rectangulaire car l'erreur est fréquente (150×150 détecté mais catalogue force 200×100).

**Format de réponse attendu** :
```
MÉTHODE DE RAISONNEMENT :
1. [Étape 1 de ton analyse]
2. [Étape 2...]
3. [Étape 3...]

RÈGLES DE DÉDUCTION :
- Si [X chaises] ET [forme carrée], alors [dimensions]
- Si [X chaises] ET [forme rectangulaire], alors [dimensions]

VALIDATION DE LA FORME :
- Comment distinguer une table carrée d'une rectangulaire ?
- Comment vérifier la cohérence forme détectée vs dimensions estimées ?

EXEMPLES :
- 4 chaises visibles, forme carrée → [dimensions] parce que [raison]
- 6 chaises visibles, forme rectangulaire → [dimensions] parce que [raison]
```

---

### **📦 CATÉGORIE 3 : CANAPÉS**

**Question** :
> Tu analyses une photo montrant un canapé. Comment déterminerais-tu ses dimensions (L×W×H) de manière intelligente ?

**Éléments à considérer** :
- Nombre de places assises (2 places, 3 places, 4+ places ?)
- Type (canapé droit, canapé d'angle, méridienne ?)
- Présence/taille des accoudoirs (larges, fins, absents ?)
- Profondeur (canapé profond type "lounge" vs classique)
- Standards du mobilier (2 places ≈ 160cm, 3 places ≈ 220cm)

**Format de réponse attendu** :
```
MÉTHODE DE RAISONNEMENT :
1. [Étape 1 de ton analyse]
2. [Étape 2...]
3. [Étape 3...]

RÈGLES DE DÉDUCTION :
- Si [X places] ET [type], alors [dimensions]
- Si [caractéristique visible], alors ajuster [dimension] de [X cm]

PIÈGES À ÉVITER :
- [Erreur fréquente à éviter]
- [Erreur fréquente à éviter]

EXEMPLES :
- Canapé 3 places avec gros accoudoirs → [dimensions] parce que [raison]
- Canapé d'angle → [dimensions] parce que [raison]
```

---

## 🎯 OBJECTIF FINAL

Avec tes réponses, nous allons créer **3 prompts IA spécialisés** qui :
1. Guident Claude/OpenAI vers un **raisonnement contextuel** plutôt qu'une estimation visuelle
2. Utilisent les **standards du mobilier** comme référence
3. Appliquent des **règles de validation** (ex: vérifier cohérence forme vs dimensions)

**Merci d'être le plus détaillé possible dans ta méthode de raisonnement !** 🙏

---

## 📸 OPTIONNEL : Exemples de photos

Si tu veux analyser des cas concrets, voici des descriptions :

**ARMOIRE** : Armoire 3 portes en bois, dans une chambre, hauteur semble atteindre presque le plafond.

**TABLE** : Table carrée avec 6 chaises identiques (2 sur chaque côté visible), dans une salle à manger moderne.

**CANAPÉ** : Canapé d'angle en L gris clair, semble accueillir 5-6 personnes, avec coussins de dossier épais.

---

## ✅ FORMAT DE SOUMISSION

**Copie ce prompt dans Gemini** → Note sa réponse dans un fichier "REPONSE_GEMINI.txt"

**Copie ce prompt dans GPT-4** → Note sa réponse dans un fichier "REPONSE_GPT4.txt"

Ensuite, envoie-moi les deux réponses pour que je crée les prompts optimaux !

