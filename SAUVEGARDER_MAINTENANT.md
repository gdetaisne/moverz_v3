# 🚨 SAUVEGARDER VOS PHOTOS EN DB MAINTENANT

## 🔴 Le Problème

L'application **ne sauvegarde PAS en DB** actuellement ! 
La fonction `handleSubmitQuote` ne fait qu'une simulation (setTimeout de 2s).
**Tout reste en localStorage.**

---

## ✅ Solution Rapide (2 minutes)

### **Étape 1 : Récupérer les données depuis le navigateur**

Dans le navigateur où vous avez uploadé les 9 photos :

1. **Ouvrir la console** (`F12` → onglet "Console")

2. **Coller ce code** :

```javascript
// Récupérer les données localStorage
const userId = localStorage.getItem('current_user_id');
const dataKey = `inventory_data_${userId}`;
const data = localStorage.getItem(dataKey);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 DONNÉES À COPIER');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('User ID:', userId);
console.log('');
console.log('👇 COPIEZ TOUT CE QUI EST ENTRE LES LIGNES');
console.log('COPY_START');
console.log(data);
console.log('COPY_END');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Créer un objet propre à sauvegarder
const parsedData = JSON.parse(data);
const cleanData = {
  currentUserId: userId,
  currentStep: parsedData.currentStep,
  roomGroups: parsedData.roomGroups?.map(room => ({
    id: room.id,
    name: room.name,
    roomType: room.roomType,
    photos: room.photos?.map(photo => ({
      photoId: photo.photoId,
      filename: photo.file?.name || 'photo.jpg',
      fileUrl: photo.fileUrl,
      status: photo.status,
      roomType: photo.roomType,
      analysis: photo.analysis
    }))
  }))
};

console.log('');
console.log('📦 DONNÉES NETTOYÉES (à utiliser) :');
console.log(JSON.stringify(cleanData, null, 2));

// Copier automatiquement dans le clipboard
copy(JSON.stringify(cleanData));
console.log('');
console.log('✅ Données copiées dans le clipboard !');
console.log('Collez-les dans le terminal avec: Cmd+V');
```

3. **Appuyer sur Entrée**

4. **Copier les données** qui s'affichent (automatiquement dans le clipboard)

---

### **Étape 2 : Sauvegarder en DB**

Dans votre terminal :

```bash
cd /Users/guillaumestehelin/moverz_v3-1

# Méthode 1 : Copier-coller les données
node scripts/save-localstorage-to-db.js '<DONNÉES_COPIÉES>'

# Exemple :
# node scripts/save-localstorage-to-db.js '{"currentUserId":"temp-xxx","roomGroups":[...]}'
```

---

## 🔧 Méthode Alternative (Plus Simple)

Si la méthode ci-dessus est compliquée, utilisez cette méthode interactive :

### **Script Interactif**

Je vais créer un script qui lit directement depuis localStorage :

```bash
# Ce script va vous guider étape par étape
node scripts/import-from-browser.js
```

---

## 📊 Après la Sauvegarde

**Vérifier dans Prisma Studio** :

```bash
# Ouvrir Prisma Studio (si pas déjà ouvert)
npm run prisma:studio

# Aller sur http://localhost:5555
# Cliquer sur "Photo"
# → Vous devriez voir vos 9 photos !
```

**Ou vérifier en CLI** :

```bash
node scripts/show-db-stats.js
```

Vous devriez voir :
```
📸 PHOTOS
   Total: 9
   Par statut:
     DONE: 9

🏠 PIÈCES (ROOMS)
   Total: 4
   Par type:
     living_room: 2
     bedroom: 3
     kitchen: 1
     hallway: 3
```

---

## ❓ Pourquoi ce Problème ?

Le code actuel (ligne 546-572 de `app/page.tsx`) :

```javascript
const handleSubmitQuote = async () => {
  // ...
  try {
    // ❌ Simuler l'envoi (remplacer par un vrai appel API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Succès
    alert('✅ Demande de devis envoyée avec succès !');
    
    // ❌ AUCUNE sauvegarde en DB !
  }
}
```

**Il n'y a aucun appel API** pour sauvegarder en DB.

De plus, ligne 628-638, il y a ce commentaire :

```javascript
// 🚫 DÉSACTIVÉ: Auto-sauvegarde automatique en DB (causait des boucles)
// Les analyses sont maintenant sauvegardées directement par l'API d'analyse par pièce
```

**L'auto-sauvegarde a été désactivée** pour éviter des bugs.

---

## 🔨 Fix Permanent (À Faire Plus Tard)

Pour corriger définitivement, il faut modifier `handleSubmitQuote` :

```javascript
const handleSubmitQuote = async () => {
  if (!quoteFormData) {
    alert('Veuillez d\'abord remplir le formulaire de demande.');
    return;
  }

  setIsSubmittingQuote(true);
  
  try {
    // ✅ Appeler une vraie API pour sauvegarder
    const response = await fetch('/api/save-quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify({
        quoteFormData,
        roomGroups: roomGroups,
        currentStep: 5
      })
    });
    
    if (!response.ok) throw new Error('Erreur sauvegarde');
    
    alert('✅ Demande de devis envoyée avec succès !');
    
  } catch (error) {
    alert('❌ Erreur lors de l\'envoi.');
    console.error('Erreur:', error);
  } finally {
    setIsSubmittingQuote(false);
  }
};
```

Puis créer l'API `/api/save-quote/route.ts`.

---

## 🎯 Résumé

**Maintenant** :
1. Copier les données depuis la console navigateur
2. Exécuter `node scripts/save-localstorage-to-db.js '<données>'`
3. Vérifier dans Prisma Studio

**Résultat** :
- ✅ Vos 9 photos en DB
- ✅ Vos 4 pièces en DB
- ✅ Vos analyses IA en DB
- ✅ Votre projet en DB

---

**Besoin d'aide ?** Je peux vous guider pas à pas dans le terminal !

