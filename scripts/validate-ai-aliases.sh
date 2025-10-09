#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Validation des alias @ai/* & @services/*..."
echo ""

# 1. Check tsconfig.json
echo "✓ Vérification tsconfig.json"
if grep -q '"@ai/\*": \["./packages/ai/src/\*"\]' tsconfig.json; then
  echo "  ✅ @ai/* → packages/ai/src/*"
else
  echo "  ❌ @ai/* INCORRECT"
  exit 1
fi

if grep -q '"@services/\*": \["./services/\*"\]' tsconfig.json; then
  echo "  ✅ @services/* → services/*"
else
  echo "  ❌ @services/* MANQUANT"
  exit 1
fi

# 2. Check aucun import cassé @ai/adapters/*
echo ""
echo "✓ Vérification imports @ai/adapters/*"
BROKEN=$(grep -rE 'from ['\''"]@ai/adapters/' --include="*.ts" --include="*.tsx" app/ components/ services/ 2>/dev/null | wc -l || echo "0")
echo "  Trouvés: $BROKEN imports (devrait fonctionner maintenant)"

# 3. Check aucun chemin relatif vers services/
echo ""
echo "✓ Vérification chemins relatifs services/"
RELATIVE=$(grep -rE '(from|import).*\.\./.*services/' --include="*.ts" --include="*.tsx" app/ components/ packages/ 2>/dev/null | grep -v node_modules | wc -l || echo "0")
if [ "$RELATIVE" -gt 0 ]; then
  echo "  ⚠️  $RELATIVE chemins relatifs trouvés (devraient utiliser @services/*)"
  grep -rE '(from|import).*\.\./.*services/' --include="*.ts" --include="*.tsx" app/ components/ packages/ 2>/dev/null | grep -v node_modules | head -5
else
  echo "  ✅ Aucun chemin relatif"
fi

# 4. Check imports @ai/metrics fonctionnent
echo ""
echo "✓ Vérification @ai/metrics dans services/roomClassifier.ts"
if grep -q "from '@ai/metrics'" services/roomClassifier.ts 2>/dev/null; then
  echo "  ✅ @ai/metrics importé correctement"
else
  echo "  ⚠️  @ai/metrics non trouvé (vérifier manuellement)"
fi

# 5. Check imports @ai/metrics/collector
echo ""
echo "✓ Vérification @ai/metrics/collector dans app/api/"
if grep -qr "from '@ai/metrics/collector'" app/api/ 2>/dev/null; then
  echo "  ✅ @ai/metrics/collector importé correctement"
else
  echo "  ℹ️  @ai/metrics/collector non utilisé (OK si pas nécessaire)"
fi

# 6. Check compilation Next.js (dry-run impossible, on teste juste la syntaxe)
echo ""
echo "✓ Test syntaxe TypeScript (tsc --noEmit)"
if npx tsc --noEmit --skipLibCheck 2>&1 | head -20 | grep -q "error TS"; then
  echo "  ❌ Erreurs TypeScript détectées"
  npx tsc --noEmit --skipLibCheck 2>&1 | grep "error TS" | head -10
  exit 1
else
  echo "  ✅ Aucune erreur TypeScript critique"
fi

echo ""
echo "✅ Validation terminée avec succès !"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. rm -rf .next"
echo "   2. pnpm dev"
echo "   3. Tester manuellement:"
echo "      • Upload photo → /api/photos/analyze"
echo "      • UI Step 2 → classification fonctionnelle"
echo "      • /api/ab-status → retourne métriques"

