# 🧹 Plan de Purge - Étape 1 : Audit & Code Mort

**Date**: 8 octobre 2025  
**Version**: v3.1  
**Objectif**: Réduire la surface de code inutile sans régression

---

## 📊 État Actuel du Projet

### Fichiers par catégorie
- **Services IA**: 27 fichiers (dont plusieurs non référencés)
- **Composants**: 22 fichiers (dont 1 supprimé RoomValidationStep.tsx)
- **Routes API**: 15 endpoints actifs (App Router uniquement ✅)
- **Scripts**: 11 fichiers (dont plusieurs jamais appelés dans package.json)
- **Documentation MD**: ~60 fichiers (beaucoup dans .gitignore mais présents)
- **Lib**: 30 fichiers (plusieurs helpers non utilisés)

---

## 🎯 Candidats à la Suppression (par catégorie)

### 🔴 **CATÉGORIE 1 : Fichiers de Test & Debug (RISQUE FAIBLE)**

#### Serveurs de test
- `serve-test.js` - Serveur HTTP basique pour tester iframes (jamais importé)
- `test-services.js` - Script de test manuel (pas dans package.json)
- `test-upload.js` - Script de test upload (pas dans package.json)

#### Fichiers HTML de test
- `test-iframe-simple.html` - Page de test iframe
- `test-iframe.html` - Page de test iframe alternative
- `demo-bordeaux.html` - Demo locale

#### Autres fichiers de test
- `test-image.jpg` - Image de test
- `test.txt` - Fichier texte temporaire
- `photo_id.txt` - Fichier texte temporaire
- `ai-mock.log` - Log du mock (déjà dans .gitignore)

#### Archives
- `moverz-deploy.tar.gz` - Archive de déploiement
- `prisma/dev.db.backup.20251008_092749` - Backup DB

**Sous-total**: ~13 fichiers  
**Risque**: ⚪ TRÈS FAIBLE (fichiers de dev/test uniquement)

---

### 🟡 **CATÉGORIE 2 : Scripts Inutilisés (RISQUE FAIBLE)**

Aucun de ces scripts n'est référencé dans `package.json`:

- `scripts/clean-duplicates.js` - Nettoyage doublons (logique obsolète)
- `scripts/clean-old-photos.js` - Nettoyage photos anciennes
- `scripts/clean-remaining-old.js` - Nettoyage résiduel
- `scripts/cleanup-photos.js` - Nettoyage générique photos
- `scripts/reset-all-photos.js` - Reset photos
- `scripts/reset-database.js` - Reset DB (dangereux en prod)
- `scripts/create-test-data.js` - Création données test

**Note**: Garder `scripts/update-build-info.js`, `scripts/setup-pdfkit.js`, `scripts/init-google-credentials.js` (utilisés)

**Sous-total**: 7 fichiers  
**Risque**: ⚪ FAIBLE (scripts one-shot ou obsolètes)

---

### 🟠 **CATÉGORIE 3 : Services IA Non Utilisés (RISQUE MOYEN)**

#### Services jamais ou presque jamais importés:

1. **`services/optimizedAnalysis.ts`** - Importé dans route analyze mais jamais vraiment utilisé (détecté via grep)
2. **`services/armoiresAnalysis.ts`** - Importé uniquement dans optimizedAnalysis
3. **`services/canapesAnalysis.ts`** - Importé uniquement dans optimizedAnalysis
4. **`services/tablesAnalysis.ts`** - Importé uniquement dans optimizedAnalysis
5. **`services/fastMeasurementTool.ts`** - Importé uniquement dans volumineuxAnalysis
6. **`services/measurementTool.ts`** - JAMAIS importé
7. **`services/hybridMeasurementService.ts`** - Importé uniquement dans volumineuxAnalysis
8. **`services/imageCalibrationService.ts`** - JAMAIS importé (sauf dans son test)
9. **`services/contextualAnalysisService.ts`** - Importé uniquement dans optimizedAnalysis
10. **`services/spatialRelationsDetector.ts`** - Importé uniquement dans contextualAnalysisService
11. **`services/amazonRekognitionService.ts`** - Importé uniquement dans hybridMeasurementService
12. **`services/googleVisionService.ts`** - Importé uniquement dans hybridMeasurementService
13. **`services/referenceObjectDetector.ts`** - Importé uniquement dans imageCalibrationService + test

**Logique actuelle v3.1**:
- `claudeVision.ts` ✅ (utilisé par analyze/route)
- `openaiVision.ts` ✅ (utilisé en fallback)
- `roomDetection.ts` ✅ (détection de pièces)
- `roomBasedAnalysis.ts` ✅ (analyse par pièce)
- `parallelRoomDetection.ts` ⚠️ (à vérifier si utilisé)
- `petitsAnalysis.ts` ✅ (petits objets)
- `volumineuxAnalysis.ts` ✅ (gros objets)

**Sous-total**: 13 services + tests associés  
**Risque**: 🟡 MOYEN (services expérimentaux/legacy, mais doivent être vérifiés)

---

### 🟠 **CATÉGORIE 4 : Composants & Lib Non Utilisés (RISQUE MOYEN)**

#### Lib
- `lib/depthDatabase.ts` - Utilisé uniquement par services supprimés (amazonRekognition, googleVision)
- `lib/measurementValidation.ts` - Utilisé par optimizedAnalysis et hybridMeasurement (à supprimer si ces services partent)

#### Note sur auth-client.ts & user-storage.ts
Ces fichiers sont utilisés dans `app/page.tsx` donc doivent être conservés.

**Sous-total**: 2 fichiers lib  
**Risque**: 🟡 MOYEN

---

### 🔵 **CATÉGORIE 5 : Documentation Redondante (RISQUE TRÈS FAIBLE)**

**À garder**: README.md, README_v3.1.md, CHANGELOG_v3.1.md

**Candidats à suppression** (documentation obsolète/temporaire):
- Tous les fichiers MD dans le pattern .gitignore mais non ignorés par Git
- Ces fichiers existent mais ne devraient plus être versionnés

**Liste des MD à évaluer**:
```
AMELIORATIONS_IA_IMPLEMENTEES.md
AMELIORATIONS_ROADMAP.md
ANALYSE_FLOW_VOLUMINEUX.md
ANALYSE_IA_AMELIORATIONS.md
ANALYSE_PRIORITES_PRECISION.md
AUTH_SETUP.md
AWS_FIX_KEYS.md
AWS_KEYS_GUIDE.md
aws-rekognition-setup.md
CAPROVER_DEPLOYMENT_GUIDE.md
CAPROVER_GOOGLE_CONFIG.md
CAPROVER_VALIDATION.md
CAPROVER-TROUBLESHOOTING.md
CAPROVER.md
CORRECTIONS_SCHEMAS_2025-10-01.md
CTO_AUDIT_RESULTS.md
CTO_CHECKLIST_SPRINT1_SPRINT2.md
DEPLOYMENT_CHECKLIST.md
EMAIL_CONTINUATION_FEATURE.md
ENV_WORKFLOW.md
EXPLICATION_CI_CD.md
EXPLICATION_COVERAGE.md
EXPLICATION_DOUBLONS.md
EXPLICATION_LINTING.md
EXPLICATION_MERGE_DOUBLONS.md
EXPLICATION_TESTS_IA.md
EXPLICATION_TESTS_UNITAIRES.md
FEATURE_EMAIL_SUMMARY.md
FINAL_SUCCESS_REPORT.md
FINAL_TEST_RESULTS.md
google-cloud-setup.md
GUIDE_INTERACTIF.md
IA_ANALYSIS_LOGIC_REVIEW.md
IA_CONFIGURATION_COMPLETE.md
IMPLEMENTATION_COMPLETE_TESTS.md
INTEGRATION_DOUBLONS_COMPLETE.md
LOCALHOST_SERVICES_STATUS.md
LOGS_DIMENSIONS_DEBUG.md
MOVERZ_V3_COMPLETE_ANALYSIS_UPDATED.md
MOVERZ_V3_COMPLETE_ANALYSIS.md
PDF_GENERATION_GUIDE.md
PDF_SETUP_FIX.md
PDF_SUCCESS_REPORT.md
PERSISTENCE_IMPLEMENTATION.md
PROCHAINES_ETAPES_IMPLEMENTATION.md
PROMPT_GEMINI_GPT_MESURES.md
QUICK_FIX_GOOGLE_AWS.md
QUICK_START_EMAIL.md
RAPPORT_FINAL_TESTS.md
RAPPORT_LINTING_CORRECTION.md
RAPPORT_TESTS_CREATION.md
README-integration.md
RECAPITULATIF_FINAL_TESTS.md
REPONSE_GEMINI.md
REPONSE_GPT.md
REVUE_RISQUES_INCOHERENCES.md
SESSION_SUMMARY.md
SETUP_GITHUB_ACTIONS.md
SOLUTION_OPTIMALE_DOUBLONS.md
SPRINT1_COMPLETED.md
SPRINT1_INTEGRATION_COMPLETE.md
SPRINT2_COMPLETE.md
SPRINT2_START.md
STATUS_API_SERVICES.md
STATUS_COMPLET.md
STORAGE_FILES_VPS.md
STRATEGIES_COMPTAGE.md
SYNTHESE_PROMPTS_SPECIALISES.md
TEMPS_ANALYSE_IA.md
VERIFICATION_EFFETS_DE_BORD.md
```

**Sous-total**: ~65 fichiers MD  
**Risque**: ⚪ TRÈS FAIBLE (documentation uniquement)

**Stratégie**: Créer un dossier `docs/archive/` et y déplacer ces fichiers au lieu de les supprimer

---

### 🟣 **CATÉGORIE 6 : Console.log Bruyants (RISQUE FAIBLE)**

Fichiers contenant des console.log de debug à nettoyer:

#### Lib (7 fichiers)
- `lib/storage.ts`
- `lib/auth-client.ts`
- `lib/user-storage.ts`
- `lib/roomTypeNormalizer.ts`
- `lib/imageOptimization.ts`
- `lib/serverSettings.ts`
- `lib/email.ts`

#### Services (12 fichiers)
- `services/roomDetection.ts`
- `services/roomBasedAnalysis.ts`
- `services/volumineuxAnalysis.ts`
- `services/petitsAnalysis.ts`
- `services/claudeVision.ts`
- `services/optimizedAnalysis.ts`
- `services/tablesAnalysis.ts`
- `services/openaiVision.ts`
- `services/core/cacheService.ts`
- `services/canapesAnalysis.ts`
- `services/armoiresAnalysis.ts`
- `services/amazonRekognitionService.ts`

#### Composants (7 fichiers)
- `components/RoomValidationStepV2.tsx`
- `components/RoomInventoryCard.tsx`
- `components/RoomPhotoCarousel.tsx`
- `components/RoomGroupCard.tsx`
- `components/WorkflowSteps.tsx`
- `components/QuoteForm.tsx`
- `components/BackOffice.tsx`

**Stratégie**: Garder uniquement les console.error et logs critiques, supprimer les logs de debug

**Sous-total**: 26 fichiers  
**Risque**: ⚪ FAIBLE (nettoyage uniquement)

---

## 📋 Plan d'Exécution en 3 LOTS

### 🎯 **LOT 1 : Fichiers de Test & Scripts (RISQUE FAIBLE)**

**Contenu**:
- Catégorie 1 complète (13 fichiers test/debug)
- Catégorie 2 complète (7 scripts inutilisés)
- **Total**: 20 fichiers

**Actions**:
1. Créer branche `chore/cleanup-step1`
2. Supprimer les fichiers listés
3. Commit: `chore: remove test files and unused scripts`
4. Tests de validation:
   - `npm run build`
   - `npm run dev` → healthcheck /api/ai-status
   - Test endpoints: POST /api/photos/analyze, POST /api/photos/analyze-by-room, GET /api/room-groups, POST /api/user-modifications

**Estimation**: 5-10 min  
**Rollback**: Git revert simple

---

### 🎯 **LOT 2 : Services IA & Lib Non Utilisés (RISQUE MOYEN)**

**Contenu**:
- Catégorie 3 : 13 services + tests (après vérification approfondie)
- Catégorie 4 : 2 fichiers lib
- **Total**: ~15 fichiers

**Pré-requis**: Valider que ces services ne sont PAS utilisés via import dynamique ou autre

**Actions**:
1. Vérifier chaque service avec analyse statique
2. Supprimer en batch
3. Commit: `chore: remove unused AI services and legacy measurement tools`
4. Tests complets (même que LOT 1)

**Estimation**: 10-15 min  
**Rollback**: Git revert

---

### 🎯 **LOT 3 : Documentation & Console.log (RISQUE TRÈS FAIBLE)**

**Contenu**:
- Catégorie 5 : 65 fichiers MD (déplacement vers docs/archive/)
- Catégorie 6 : Nettoyage console.log dans 26 fichiers

**Actions**:
1. Créer `docs/archive/`
2. Déplacer les MD obsolètes
3. Commit: `chore: archive legacy documentation`
4. Nettoyer les console.log (garder console.error)
5. Commit: `chore: clean debug console.log statements`

**Estimation**: 15-20 min  
**Rollback**: Git revert par commit

---

## ✅ Critères de Validation (après chaque LOT)

### Tests Automatiques
```bash
npm run build        # Pas d'erreur TypeScript
npm run dev          # Démarrage OK sur :3001
```

### Tests Manuels (smoke tests)
```bash
# 1. Health check
curl http://localhost:3001/api/ai-status

# 2. Analyze photo
curl -X POST http://localhost:3001/api/photos/analyze \
  -F "file=@test-image.jpg"

# 3. Analyze by room
curl -X POST http://localhost:3001/api/photos/analyze-by-room \
  -H "Content-Type: application/json" \
  -d '{"roomType":"salon","photoIds":["id1"]}'

# 4. Room groups
curl http://localhost:3001/api/room-groups

# 5. User modifications
curl -X POST http://localhost:3001/api/user-modifications \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Workflow Manuel
1. Upload photo
2. Classification pièce
3. Validation pièce
4. Inventaire généré
5. PDF généré (optionnel)

---

## 📊 Résultat Attendu

### Avant
- **Total fichiers**: ~250+ (hors node_modules)
- **Services IA**: 27
- **Scripts**: 11
- **Documentation MD**: 65

### Après (estimation)
- **Total fichiers**: ~170
- **Services IA**: 14 (actifs seulement)
- **Scripts**: 4 (utiles seulement)
- **Documentation MD**: 3 (core) + 65 archivés

**Réduction**: ~30% de fichiers code/scripts/test  
**Gain lisibilité**: Documentation archivée, logs nettoyés

---

## 🚨 Garde-Fous

### À NE PAS TOUCHER
- ❌ Schéma Prisma (`prisma/schema.prisma`)
- ❌ Routes API existantes (`app/api/*`)
- ❌ Composants actifs du workflow
- ❌ Version Node/engines
- ❌ Configuration Next.js core

### Si Doute
- Marquer le fichier pour revue manuelle
- Ne PAS supprimer sans preuve d'inutilité
- Consulter git log pour historique

---

## 🎯 Prochaines Étapes (après Step 1)

1. **Step 2**: Refactoring packages (core/ai/ui)
2. **Step 3**: Migration Postgres
3. **Step 4**: Tests E2E
4. **Step 5**: CI/CD

---

**Prêt pour validation et exécution LOT 1** ✅

