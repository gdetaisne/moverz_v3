# 📚 Index de la Documentation - Moverz v3.1

Guide de navigation dans la documentation Moverz.

---

## 🎯 Par Besoin

### Je veux **démarrer le projet en dev**
→ [`getting-started/README.md`](./getting-started/README.md)

### Je veux **déployer en production**
→ [`/DEPLOY_NOW.md`](../DEPLOY_NOW.md) (5 min)  
→ [`deployment/README.md`](./deployment/README.md) (complet)

### Je veux **comprendre l'architecture**
→ [`architecture/README.md`](./architecture/README.md)

### Je veux **administrer l'application**
→ [`/BACKOFFICE_QUICKSTART.md`](../BACKOFFICE_QUICKSTART.md) (accès rapide)  
→ [`operations/README.md`](./operations/README.md) (complet)

### Je veux **résoudre un problème**
→ [`operations/README.md#troubleshooting`](./operations/README.md#-troubleshooting)

### Je veux **voir l'historique**
→ [`/CHANGELOG.md`](../CHANGELOG.md)  
→ [`archive/INDEX.md`](./archive/INDEX.md)

---

## 📁 Structure Complète

```
docs/
│
├── INDEX.md                          # 👈 Vous êtes ici
├── DOCUMENTATION_CLEANUP_REPORT.md   # Rapport réorganisation
│
├── getting-started/
│   └── README.md                     # Installation & premiers pas
│
├── architecture/
│   └── README.md                     # Stack, structure, APIs
│
├── deployment/
│   └── README.md                     # Production (CapRover, Docker, Vercel)
│
├── operations/
│   └── README.md                     # Administration, monitoring, DB
│
├── guides/
│   ├── GUIDE_BACKOFFICE.md           # Back-office détaillé
│   ├── GUIDE_DATABASE.md             # Gestion base de données
│   ├── MONITORING.md                 # Bull Board monitoring
│   └── BULLBOARD_CHEATSHEET.md       # Aide-mémoire queues
│
└── archive/
    ├── INDEX.md                      # Index archive complète
    ├── lots/                         # Rapports LOT 5-18 (23)
    ├── bugfixes/                     # Corrections bugs (9)
    ├── cleanup/                      # Nettoyages code (6)
    ├── migration/                    # Migration PostgreSQL (7)
    └── [divers]/                     # Docs techniques (30)
```

---

## 🚀 Parcours Recommandés

### Nouveau Développeur (Premier Jour)

```
1. /README.md                          (5 min)
2. docs/getting-started/README.md      (15 min)
3. Installer et tester localement       (10 min)
4. docs/architecture/README.md          (10 min)
   Total: ~40 minutes
```

### DevOps (Déploiement Urgent)

```
1. /DEPLOY_NOW.md                      (5 min)
2. Configurer variables CapRover        (5 min)
3. Force Rebuild                        (attendre build)
4. Tests production                     (5 min)
   Total: ~15 minutes (hors build)
```

### Admin Système (Maintenance)

```
1. /BACKOFFICE_QUICKSTART.md           (3 min)
2. docs/operations/README.md           (15 min)
3. docs/guides/MONITORING.md           (10 min)
   Total: ~30 minutes
```

### Développeur Expérimenté (Recherche Info)

```
1. Chercher dans /docs/
2. Si non trouvé → docs/archive/INDEX.md
3. grep -r "terme" docs/archive/
```

---

## 📖 Documents à la Racine

### Pourquoi certains docs restent à la racine ?

**4 fichiers stratégiques** gardés à la racine pour accès immédiat :

| Fichier | Raison | Fréquence d'accès |
|---------|--------|-------------------|
| **README.md** | Standard GitHub | ⭐⭐⭐⭐⭐ |
| **CHANGELOG.md** | Convention communauté | ⭐⭐⭐⭐ |
| **DEPLOY_NOW.md** | Urgence déploiement | ⭐⭐⭐⭐ |
| **BACKOFFICE_QUICKSTART.md** | Ops quotidiennes | ⭐⭐⭐⭐ |

**Principe** : Les documents les plus consultés restent à la racine.

---

## 🔍 Recherche dans la Documentation

### Par Mot-clé

```bash
# Chercher dans toute la doc
grep -r "PostgreSQL" docs/

# Chercher dans guides actifs seulement
grep -r "DATABASE_URL" docs/{getting-started,architecture,deployment,operations}/

# Chercher dans archive
grep -r "LOT 10" docs/archive/
```

### Par Fichier

```bash
# Lister tous les guides
find docs/ -name "README.md"

# Lister guides spécialisés
ls docs/guides/

# Lister archives par catégorie
ls docs/archive/{lots,bugfixes,cleanup,migration}/
```

---

## 🎓 Glossaire

### Acronymes

- **LOT** : Lot de développement (features groupées)
- **SSE** : Server-Sent Events (temps réel)
- **ORM** : Object-Relational Mapping (Prisma)
- **BullMQ** : Système de queues basé sur Redis
- **A/B Testing** : Test de variantes algorithmes

### Concepts Clés

- **Monorepo** : packages/core, packages/ai, packages/ui
- **Workers** : Processus asynchrones pour analyse IA
- **Batch** : Lot de photos traitées ensemble
- **Room** : Pièce détectée (living_room, bedroom, etc.)
- **Metrics** : Télémétrie (latence, coût, tokens)

---

## 📊 Métriques Documentation

### Avant Cleanup (12 oct 2025)

- **Racine** : 87 fichiers markdown
- **Structure** : Plate (tout à la racine)
- **Duplication** : Élevée (info répétée dans 10+ docs)
- **Obsolescence** : ~30% docs obsolètes
- **Temps onboarding** : 15-30 minutes

### Après Cleanup

- **Racine** : 4 fichiers essentiels
- **Structure** : Hiérarchisée (getting-started, architecture, etc.)
- **Duplication** : Minimale (consolidation)
- **Obsolescence** : 0% (guides actifs à jour)
- **Temps onboarding** : 2-5 minutes

**Gain** : **87% réduction temps** pour trouver l'information

---

## 🔄 Mise à Jour de la Documentation

### Documents Actifs (À Maintenir)

Les **7 guides actifs** doivent être mis à jour à chaque changement significatif :

1. `/README.md` - Vue d'ensemble
2. `/CHANGELOG.md` - Historique versions
3. `docs/getting-started/README.md` - Installation
4. `docs/architecture/README.md` - Stack technique
5. `docs/deployment/README.md` - Production
6. `docs/operations/README.md` - Administration
7. `docs/guides/*` - Guides spécialisés

**Fréquence** : À chaque release (minor/major)

### Archives (Lecture Seule)

Les documents dans `docs/archive/` sont **gelés** :
- ❌ Ne pas modifier
- ✅ Conserver pour référence historique
- ✅ Ajouter nouveaux documents archivés si besoin

---

## 🎯 Quick Links

### Liens Rapides

| Besoin | Lien Direct |
|--------|-------------|
| Vue d'ensemble | [`/README.md`](../README.md) |
| Démarrer | [`docs/getting-started/README.md`](./getting-started/README.md) |
| Déployer | [`/DEPLOY_NOW.md`](../DEPLOY_NOW.md) |
| Architecture | [`docs/architecture/README.md`](./architecture/README.md) |
| Back-office | [`/BACKOFFICE_QUICKSTART.md`](../BACKOFFICE_QUICKSTART.md) |
| Operations | [`docs/operations/README.md`](./operations/README.md) |
| Historique | [`docs/archive/INDEX.md`](./archive/INDEX.md) |

---

## 📞 Support

**Problème avec la documentation ?**

1. Vérifier si info dans guides actifs (`docs/`)
2. Sinon, chercher dans archives (`docs/archive/INDEX.md`)
3. Si toujours pas trouvé → Ouvrir issue GitHub

---

**Dernière mise à jour** : 12 octobre 2025  
**Version documentation** : v2.0 (post-cleanup)

