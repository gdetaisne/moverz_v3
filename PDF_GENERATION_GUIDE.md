# Guide de génération PDF - Devis de déménagement

## 📋 Vue d'ensemble

Le système de génération PDF permet de créer un document professionnel **100% anonyme** contenant :

1. **Informations générales** (sans email) : adresses, dates, offre choisie
2. **Récapitulatif de l'inventaire** : volume total, nombre d'objets, statistiques
3. **Détails de l'inventaire** : liste complète avec photos et caractéristiques

---

## 🏗️ Architecture

```
/lib/pdf/
  ├── generator.ts           # Orchestrateur principal
  ├── types.ts               # Types TypeScript
  ├── styles.ts              # Constantes de style (couleurs, fonts, espacements)
  └── sections/
      ├── header.ts          # En-tête avec numéro de référence
      ├── generalInfo.ts     # Informations du formulaire
      ├── summary.ts         # Récapitulatif visuel
      └── inventory.ts       # Détails avec photos

/app/api/pdf/generate/
  └── route.ts               # Endpoint API POST
```

---

## 🚀 Utilisation

### Depuis le frontend (app/page.tsx)

1. Remplir le formulaire (Étape 3)
2. Valider l'inventaire (Étape 2)
3. Aller à l'étape 4 : "Envoyer le devis"
4. Cliquer sur le bouton **"📄 PDF Complet"**

Le PDF se télécharge automatiquement avec le nom : `devis-demenagement-[timestamp].pdf`

---

## 🔧 Développement

### Tester l'API directement

```bash
curl -X POST http://localhost:3000/api/pdf/generate \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "email": "test@example.com",
      "departureCity": "Paris",
      "departurePostalCode": "75001",
      "departureElevator": true,
      "arrivalCity": "Lyon",
      "arrivalPostalCode": "69001",
      "arrivalElevator": false,
      "movingDate": "2025-11-15",
      "selectedOffer": "standard"
    },
    "rooms": [{
      "id": "room-1",
      "name": "Salon",
      "photos": [{
        "items": [
          {
            "label": "Canapé 3 places",
            "category": "furniture",
            "quantity": 1,
            "volume_m3": 1.5,
            "fragile": false,
            "dismountable": true
          },
          {
            "label": "Table basse",
            "category": "furniture",
            "quantity": 1,
            "volume_m3": 0.3,
            "fragile": true,
            "dismountable": false
          }
        ]
      }]
    }]
  }' \
  --output test-devis.pdf
```

### Personnaliser les styles

Modifiez `/lib/pdf/styles.ts` :

```typescript
export const COLORS = {
  primary: '#2563eb',      // Couleur principale
  secondary: '#64748b',    // Couleur secondaire
  // ... etc
};

export const FONTS = {
  sizes: {
    h1: 24,               // Titre principal
    h2: 18,               // Sous-titres
    body: 11,             // Texte normal
  }
};
```

---

## 📸 Gestion des photos

### ⚠️ Important : Format requis

Les photos doivent être au **format base64** pour être incluses dans le PDF :

```javascript
// ✅ BON format
photoData: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."

// ❌ MAUVAIS format (non supporté actuellement)
photoData: "https://example.com/photo.jpg"
fileUrl: "/uploads/photo.jpg"
```

### Solution actuelle

Si `photoData` n'est pas fourni ou invalide, un **placeholder** est affiché :

```
┌─────────────────┐
│                 │
│  📷 Photo non   │
│    incluse      │
│                 │
└─────────────────┘
```

### TODO : Amélioration future

Ajouter un helper côté API pour convertir les URLs en base64 :

```typescript
// lib/pdf/helpers/imageConverter.ts
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}
```

---

## 📊 Structure du PDF généré

### Page 1
```
┌─────────────────────────────────────┐
│ DEVIS DÉMÉNAGEMENT                  │
│ Référence: DEV-20251001-1234        │
│ Généré le: 1 octobre 2025           │
├─────────────────────────────────────┤
│ 📍 INFORMATIONS GÉNÉRALES           │
│   🏠 Départ: Paris 75001            │
│   🎯 Arrivée: Lyon 69001            │
│   📅 Date: 15/11/2025               │
│   💼 Offre: Standard                │
├─────────────────────────────────────┤
│ 📊 RÉCAPITULATIF                    │
│   Volume: 45.3 m³                   │
│   Objets: 127 articles              │
│   ⚠️ Objets fragiles                │
│   🔧 Démontage requis               │
└─────────────────────────────────────┘
```

### Pages suivantes
```
┌─────────────────────────────────────┐
│ 📋 DÉTAIL DE L'INVENTAIRE           │
│                                     │
│ 1. SALON                            │
│ ┌────────┐  • Canapé 3 places      │
│ │ PHOTO  │    1.5m³ • 🔧 Démontable│
│ │        │  • Table basse           │
│ │        │    0.3m³ • ⚠️ Fragile    │
│ └────────┘                          │
│                                     │
│ 2. CHAMBRE                          │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## 🐛 Dépannage

### Erreur : "ENOENT: no such file or directory, open '.../Helvetica.afm'"

**Cause** : Les fichiers de fonts PDFKit ne sont pas copiés.

**Solution** : 
```bash
node scripts/setup-pdfkit.js
npm run dev
```

Le script `setup-pdfkit.js` s'exécute automatiquement avec `npm run dev` ou `npm install`. Si l'erreur persiste, exécutez-le manuellement.

**Voir:** `PDF_SETUP_FIX.md` pour plus de détails.

---

### Erreur : "Cannot read property 'departureCity' of undefined"

**Cause** : Le formulaire n'a pas été rempli.

**Solution** : Remplir l'étape 3 avant de générer le PDF.

### Erreur : "Invalid base64 string"

**Cause** : Format de photo invalide.

**Solution** : Le PDF sera généré avec des placeholders. Pour inclure les photos, fournir des images en base64.

### PDF vide ou pages manquantes

**Cause** : Aucun objet sélectionné dans l'inventaire.

**Solution** : Valider l'inventaire à l'étape 2 et s'assurer que des objets sont sélectionnés.

### Erreur 500 lors de la génération

**Vérifier les logs serveur** :

```bash
# En développement
npm run dev

# Vérifier la console pour les erreurs PDFKit
```

---

## 🎨 Personnalisation avancée

### Ajouter une nouvelle section

1. Créer `/lib/pdf/sections/maSection.ts` :

```typescript
import PDFDocument from 'pdfkit';
import { COLORS, FONTS, PDF_CONFIG } from '../styles';

export function addMaSection(doc: PDFDocument, data: any): void {
  doc
    .fontSize(FONTS.sizes.h2)
    .fillColor(COLORS.primary)
    .text('Ma Section', PDF_CONFIG.margins.left, doc.y);
  
  // ... votre contenu
}
```

2. Importer dans `/lib/pdf/generator.ts` :

```typescript
import { addMaSection } from './sections/maSection';

// Dans generateMovingQuotePDF
addHeader(doc, ...);
addGeneralInfo(doc, ...);
addMaSection(doc, data.customData);  // ← Ajouter ici
addSummary(doc, ...);
```

### Modifier la mise en page

Éditer `/lib/pdf/styles.ts` :

```typescript
export const PDF_CONFIG = {
  margins: {
    top: 60,        // Augmenter les marges
    bottom: 60,
    left: 60,
    right: 60,
  },
};
```

---

## ✅ Tests

### Test manuel complet

1. `npm run dev`
2. Ouvrir http://localhost:3000
3. Suivre le workflow complet :
   - Charger des photos → Étape 1
   - Valider l'inventaire → Étape 2
   - Remplir le formulaire → Étape 3
   - Générer le PDF → Étape 4

### Checklist de validation

- [ ] PDF téléchargé avec succès
- [ ] Informations générales correctes (sans email)
- [ ] Récapitulatif avec totaux corrects
- [ ] Liste d'objets complète
- [ ] Placeholders affichés pour photos manquantes
- [ ] Mise en page professionnelle
- [ ] Pas d'erreurs console

---

## 📦 Dépendances

```json
{
  "pdfkit": "^0.15.0",
  "@types/pdfkit": "^0.13.5"
}
```

Installées automatiquement via :
```bash
npm install pdfkit @types/pdfkit
```

---

## 🔐 Sécurité

### Données anonymisées

L'**email est exclu** du PDF généré (voir `/lib/pdf/types.ts` et `/lib/pdf/sections/generalInfo.ts`).

### Validation côté serveur

L'endpoint API valide les données entrantes :

```typescript
if (!body.formData || !body.rooms) {
  return NextResponse.json(
    { error: 'Données manquantes' },
    { status: 400 }
  );
}
```

---

## 📝 Notes techniques

- **Format** : A4 (595.28 × 841.89 points)
- **Fonts** : Helvetica (incluse dans PDFKit)
- **Couleurs** : Palette Tailwind CSS (Slate, Blue, Green)
- **Génération** : Côté serveur (Node.js) pour qualité optimale
- **Performance** : ~300-500ms pour un PDF typique

---

## 🚧 TODO / Améliorations futures

- [ ] Support images URL → base64 automatique
- [ ] Export Excel (.xlsx)
- [ ] Export CSV
- [ ] Ajout logo personnalisé en header
- [ ] Multi-langues (EN, ES)
- [ ] Signature électronique
- [ ] Envoi email automatique avec PDF attaché
- [ ] Cache des PDFs générés (1h)
- [ ] Compression PDF pour réduire taille

---

## 🆘 Support

En cas de problème, vérifier :

1. Les logs dans la console navigateur (F12)
2. Les logs serveur (`npm run dev`)
3. Le format des données envoyées à l'API
4. Les fichiers de ce guide

---

**Créé le** : 1 octobre 2025  
**Version** : 1.0.0  
**Auteur** : Moverz Team

