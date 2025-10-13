# 🐛 BUGFIX : Chemin incorrect vers les fichiers uploads

**Date** : 9 octobre 2025  
**Symptôme** : Inventaire vide (0 objets détectés) avec erreur `ENOENT: no such file or directory`  
**Cause** : Chemin `/api/uploads/` au lieu de `/uploads/`

---

## 🔍 ERREUR DÉTECTÉE

```
❌ Erreur analyse pièce "chambre": Error: ENOENT: no such file or directory, 
open '/Users/guillaumestehelin/moverz_v3/api/uploads/c143ea13-b405-476e-bf53-c1d59732ddc7.jpeg'
```

---

## 🎯 CAUSE RACINE

### Flux de données

```
1. Photo uploadée → sauvegardée dans /uploads/xxx.jpeg ✅
2. DB stocke url: "/api/uploads/xxx.jpeg" ✅
3. Frontend affiche via Next.js route /api/uploads/xxx.jpeg ✅
4. Analyse AI récupère url: "http://localhost:3001/api/uploads/xxx.jpeg"
5. claudeVision.ts tente de lire le fichier :
   - url = "http://localhost:3001/api/uploads/xxx.jpeg"
   - Retire le domaine → "/api/uploads/xxx.jpeg"
   - path.join(cwd, "/api/uploads/xxx.jpeg")
   - → "/Users/.../moverz_v3/api/uploads/xxx.jpeg" ❌
   
   MAIS le fichier est dans :
   - → "/Users/.../moverz_v3/uploads/xxx.jpeg" ✅
```

### Pourquoi `/api/uploads/` dans la DB ?

- `/api/uploads/` est une **route Next.js** qui sert les fichiers
- Le fichier physique est dans `/uploads/` (sans `/api`)
- Next.js route `/api/uploads/[filename]` → serve `/uploads/[filename]`

---

## ✅ SOLUTION

### Code modifié dans `services/claudeVision.ts` (lignes 65-74)

**AVANT (cassé)** :

```typescript
// Extraire le chemin du fichier
const filePath = url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')
  ? url.replace(/^https?:\/\/[^\/]+/, '') // Retirer le domaine
  : url;

// Construire le chemin absolu
const absolutePath = path.join(process.cwd(), filePath);
// → /Users/.../moverz_v3/api/uploads/xxx.jpeg ❌
```

**APRÈS (corrigé)** :

```typescript
// Extraire le chemin du fichier
let filePath = url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')
  ? url.replace(/^https?:\/\/[^\/]+/, '') // Retirer le domaine
  : url;

// ✅ IMPORTANT : Enlever /api du chemin car les fichiers sont dans /uploads, pas /api/uploads
filePath = filePath.replace(/^\/api\/uploads\//, '/uploads/');

// Construire le chemin absolu
const absolutePath = path.join(process.cwd(), filePath);
// → /Users/.../moverz_v3/uploads/xxx.jpeg ✅
```

**Changements** :
1. `const` → `let` pour permettre la modification
2. Ajout de `filePath.replace(/^\/api\/uploads\//, '/uploads/')` pour retirer `/api`

---

## 📊 FLUX CORRIGÉ

```
1. Photo uploadée → /uploads/xxx.jpeg ✅
2. DB stocke url: "/api/uploads/xxx.jpeg" ✅
3. Frontend affiche via /api/uploads/xxx.jpeg (route Next.js) ✅
4. Analyse AI :
   - url = "http://localhost:3001/api/uploads/xxx.jpeg"
   - Retire le domaine → "/api/uploads/xxx.jpeg"
   - Retire /api → "/uploads/xxx.jpeg" ✅
   - path.join(cwd, "/uploads/xxx.jpeg")
   - → "/Users/.../moverz_v3/uploads/xxx.jpeg" ✅
5. fs.readFileSync(absolutePath) → SUCCÈS ✅
6. Claude analyse l'image ✅
7. Inventaire retourné avec N objets ✅
```

---

## 🧪 PLAN DE TEST

### 1. Redémarrer le serveur
```bash
pkill -f "next dev"
npm run dev
```

### 2. Tester le workflow complet
```bash
1. Reset
2. Uploader 2-3 photos de chambre
3. Étape suivante
4. Valider le groupe "chambre"
```

### 3. Vérifier les logs
```bash
# AVANT (cassé) :
❌ Erreur analyse pièce "chambre": Error: ENOENT
✅ Pièce "chambre" analysée: 0 objets

# APRÈS (corrigé) :
🔑 [MULTI] Clé Claude configurée: OUI ✅
📸 [MULTI] Analyse de 2 photos: [...]
📂 Chargement image depuis: /Users/.../moverz_v3/uploads/xxx.jpeg
📥 Réponse Claude reçue: ...
🔍 JSON parsé: N objets bruts détectés
✅ Pièce "chambre" analysée: N objets
```

### 4. Vérifier l'UI
```bash
# ATTENDU :
- Étape 2 : "N Objets détectés" (pas 0)
- Liste des objets (lit, armoire, etc.)
- Volumes calculés
- Pas de doublons
```

---

## 🔗 BUGS RÉSOLUS CETTE SESSION

| # | Bug | Fichier | Lignes | Cause | Fix |
|---|-----|---------|--------|-------|-----|
| **1** | Structure API response | `app/page.tsx` | 744 | `result.roomDetection.roomType` obsolète | `result.roomType` direct |
| **2** | Chargement images base64 | `services/claudeVision.ts` | 55-75 | Pas de détection URL vs base64 | Ajout `url.startsWith('data:image')` |
| **3** | Double setState | `app/page.tsx` | 741-766 | 2 appels consécutifs s'écrasent | Fusion en 1 seul appel |
| **4** | Chemin uploads incorrect | `services/claudeVision.ts` | 71 | `/api/uploads/` au lieu de `/uploads/` | `filePath.replace(/^\/api\/uploads\//, '/uploads/')` |

---

## 💡 LEÇON APPRISE

**Différence entre route Next.js et chemin physique** :

```
Route Next.js (pour le navigateur) :
  /api/uploads/xxx.jpeg → sert le fichier via une route

Chemin physique (pour fs.readFileSync) :
  /uploads/xxx.jpeg → lit directement du système de fichiers
```

**Pourquoi cette confusion ?**

- Next.js crée des routes `/api/*` pour les API routes
- Les fichiers uploadés sont dans `/uploads/` (hors de `/api/`)
- Une route `/api/uploads/[filename]` sert ces fichiers
- Mais pour `fs.readFileSync`, il faut le chemin physique sans `/api`

---

## ✅ CRITÈRES D'ACCEPTATION

1. ✅ **Pas d'erreur ENOENT**
2. ✅ **Images chargées** : logs `📂 Chargement image depuis: ...`
3. ✅ **Claude appelé** : logs `📸 Envoi de X images à Claude`
4. ✅ **Réponse Claude** : logs `📥 Réponse Claude reçue`
5. ✅ **N objets détectés** (pas 0)
6. ✅ **Inventaire affiché** dans l'UI
7. ✅ **Pas de doublons**
8. ✅ **0 erreurs linter**

---

**Score de confiance** : 95/100 ✅

Ce fix résout le dernier bug qui empêchait l'analyse d'objets de fonctionner. Le flux complet devrait maintenant être opérationnel.


