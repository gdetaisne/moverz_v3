# 🔍 DIAGNOSTIC PRÉCIS - Pourquoi les Photos ne sont pas en DB

## 📋 Contexte

**Situation** :
- 9 photos uploadées sur https://movers-test.gslv.cloud/
- Étape 5 du workflow (devis)
- Photos visibles dans l'interface
- **0 photos dans Prisma**

---

## 🏗️ Architecture PRÉVUE selon LOTs 8-11

D'après les rapports de lots, voici le workflow prévu :

### **LOT 8 - Upload Direct S3**
```
1. Client upload photo → S3 direct (presigned URL)
2. Callback `/api/upload/callback` confirme upload
3. Asset créé en DB avec status UPLOADED
```

### **LOT 10 - Pipeline Asynchrone**
```
1. POST /api/photos/enqueue { photoId, userId }
2. Worker traite la photo
3. Photo mise à jour avec status DONE + analysis
```

### **LOT 11 - Batch Orchestration**  
```
1. POST /api/batches {
     projectId: "xxx",
     imageUrls: [
       { filename, filePath, url, roomType }
     ]
   }
2. createBatch() crée:
   - 1 Batch en DB
   - N Photos en DB (status PENDING)
3. enqueueBatch() lance N jobs d'analyse
4. Workers traitent les photos
5. Photos mises à jour (DONE + analysis)
```

**C'EST L'API `/api/batches` QUI SAUVEGARDE EN DB !**

---

## 🔴 CE QUI NE VA PAS

### **Fichier**: `app/page.tsx`
### **Ligne**: 546-572
### **Fonction**: `handleSubmitQuote()`

**Code actuel** :
```javascript
const handleSubmitQuote = async () => {
  if (!quoteFormData) {
    alert('Veuillez d\'abord remplir le formulaire de demande.');
    return;
  }

  setIsSubmittingQuote(true);
  
  try {
    // 🔴 PROBLÈME ICI
    // Simuler l'envoi (remplacer par un vrai appel API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Succès
    alert('✅ Demande de devis envoyée avec succès !');
    
    // ❌ AUCUN APPEL à /api/batches
    // ❌ AUCUN APPEL à /api/projects
    // ❌ Données restent en localStorage uniquement
    
  } catch (error) {
    alert('❌ Erreur lors de l\'envoi.');
  } finally {
    setIsSubmittingQuote(false);
  }
};
```

**Problème** :
- Ligne 556 : `await new Promise(resolve => setTimeout(resolve, 2000));`
- C'est une **simulation** !
- Aucun appel API réel
- Les photos restent en localStorage

---

## ✅ CE QUI DEVRAIT SE PASSER

### **Workflow Attendu (selon LOTs 8-11)**

```javascript
const handleSubmitQuote = async () => {
  if (!quoteFormData) {
    alert('Veuillez remplir le formulaire');
    return;
  }

  setIsSubmittingQuote(true);
  
  try {
    // 1. Créer le projet (ou récupérer existant)
    const projectResponse = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify({
        name: 'Projet Moverz',
        customerName: quoteFormData.name,
        customerEmail: quoteFormData.email,
        customerPhone: quoteFormData.phone,
        customerAddress: quoteFormData.address,
        currentStep: 5
      })
    });
    
    const project = await projectResponse.json();
    
    // 2. Préparer les imageUrls depuis roomGroups (localStorage)
    const imageUrls = [];
    for (const room of roomGroups) {
      for (const photo of room.photos) {
        imageUrls.push({
          filename: photo.file?.name || 'photo.jpg',
          filePath: photo.fileUrl || `/uploads/${photo.file?.name}`,
          url: photo.fileUrl || `/uploads/${photo.file?.name}`,
          roomType: room.roomType
        });
      }
    }
    
    // 3. ✅ CRÉER LE BATCH (sauvegarde en DB)
    const batchResponse = await fetch('/api/batches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify({
        projectId: project.id,
        imageUrls: imageUrls
      })
    });
    
    const batch = await batchResponse.json();
    
    alert(`✅ Devis envoyé ! ${batch.photosCount} photos sauvegardées`);
    
  } catch (error) {
    alert('❌ Erreur lors de l\'envoi');
    console.error(error);
  } finally {
    setIsSubmittingQuote(false);
  }
};
```

---

## 📊 Flux de Données Attendu

```
┌─────────────────────────────────────────────────────────────┐
│                    ÉTAPES 1-3 (localStorage)                 │
│  - Upload photos (localStorage)                              │
│  - Classification pièces (localStorage)                      │
│  - Inventaire (localStorage)                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │   ÉTAPE 4          │
         │   handleSubmitQuote│
         └────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
  ┌──────────┐      ┌──────────────┐
  │ POST     │      │ POST         │
  │/api/     │      │/api/batches  │
  │projects  │      │              │
  └─────┬────┘      └──────┬───────┘
        │                  │
        ▼                  ▼
  ┌──────────┐      ┌──────────────────────┐
  │ Project  │      │ createBatch()        │
  │ en DB    │      │ - Crée Batch en DB   │
  └──────────┘      │ - Crée Photos en DB  │
                    │ - Enqueue jobs       │
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ enqueueBatch │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Workers      │
                    │ traitent     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │ Photos en DB     │
                    │ status: DONE     │
                    │ analysis: {...}  │
                    └──────────────────┘
```

---

## 🎯 Ce Qui Manque Exactement

### **Dans `app/page.tsx`**

**Ligne 546-572** : `handleSubmitQuote()`

**Manque** :
1. ❌ Appel à `/api/projects` (créer ou récupérer projet)
2. ❌ Conversion roomGroups (localStorage) → imageUrls[]
3. ❌ Appel à `/api/batches` (sauvegarde en DB + enqueue jobs)
4. ❌ Gestion du batchId retourné
5. ❌ Optionnel : Polling `/api/batches/{id}` pour progression

**Actuellement** :
- ✅ Récupère quoteFormData
- ❌ Fait juste un setTimeout(2000)
- ❌ Ne sauvegarde rien en DB

---

## 📝 Alignement avec les LOTs

| LOT | Fonctionnalité | Implémenté Backend | Appelé Frontend | Statut |
|-----|----------------|-------------------|-----------------|--------|
| 8 | Upload S3 direct | ✅ `/api/upload/sign` | ❓ Pas vérifié | ⚠️ |
| 10 | Pipeline async | ✅ Workers + `/api/photos/enqueue` | ❌ Non | 🔴 |
| 11 | Batch orchestration | ✅ `/api/batches` | ❌ Non | 🔴 |

**Problème** : 
- Le backend (LOTs 10-11) est prêt
- Le frontend (app/page.tsx) n'appelle pas ces APIs
- Les données restent en localStorage

---

## ✅ Solution Correcte

### **Modification à Faire**

**Fichier** : `app/page.tsx`  
**Fonction** : `handleSubmitQuote()` (ligne 546)  
**Action** : Remplacer la simulation par des vrais appels API

**Étapes** :
1. Créer ou récupérer le Project via `/api/projects`
2. Construire l'array `imageUrls[]` depuis `roomGroups` (localStorage)
3. Appeler `/api/batches` avec projectId + imageUrls
4. Gérer la réponse (batchId, photosCount)
5. Optionnel : Polling pour afficher progression

**Pas de script manuel needed** : Modifier directement le code frontend.

---

## 🚫 Ce qu'il NE FAUT PAS Faire

❌ **Script localStorage → DB** : Pas aligné avec l'architecture  
❌ **Appeler Prisma directement depuis le frontend** : Impossible  
❌ **Contourner l'API `/api/batches`** : Casse l'orchestration  

---

## ✅ Prochaine Action

**Décision** :
- Soit : Modifier `handleSubmitQuote()` pour appeler `/api/batches`
- Soit : Accepter que l'application actuelle ne sauvegarde pas en DB

**Si on modifie** :
- 1 seule fonction à changer : `handleSubmitQuote()`
- ~30 lignes de code à ajouter
- Alignement complet avec LOTs 8-11

---

**Question pour vous** : Voulez-vous que je prépare la modification exacte à faire dans `handleSubmitQuote()` en respectant 100% l'architecture des LOTs 8-11 ?

