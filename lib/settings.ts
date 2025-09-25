// Paramètres IA configurables
export interface AISettings {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens?: number;
  model: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  systemPrompt: "Expert en inventaire déménagement. Détecte tous les objets visibles. Labels français uniquement. JSON strict.",
  userPrompt: `Schema: {"items":[{"label":"string","category":"furniture|appliance|fragile|box|misc","confidence":0-1,"quantity":1,"dimensions_cm":{"length":cm,"width":cm,"height":cm,"source":"estimated"},"volume_m3":m3,"fragile":bool,"stackable":bool,"notes":"string"}],"totals":{"count_items":n,"volume_m3":m3}}

Détecte TOUS les objets pour déménagement:
- Meubles: chaises, tables, lits, armoires, commodes, canapés
- Électroménagers: tous appareils
- Fragiles: miroirs, vases, télévisions, verreries
- Décorations: tableaux, sculptures, plantes
- Lampes: plafond, table, lampadaires
- Tapis: volume roulé (cylindre)
- Cartons visibles
- Équipements: musique, sport, vélos
- "autres objets" si petits objets multiples

RÈGLES:
- Labels français uniquement
- Chaque objet séparément (même identiques)
- Dimensions + volume toujours estimés
- Catégorie correcte
- Fragile/stackable précisés
- JSON strict, pas de texte`,
  temperature: 0.3, // Plus déterministe = plus rapide
  maxTokens: 1500, // Limiter la réponse pour plus de vitesse
  model: "gpt-4o-mini" // Plus rapide que gpt-4o
};

// Stockage local des paramètres (pour MVP)
export function getAISettings(): AISettings {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('ai-settings');
    if (stored) {
      try {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_AI_SETTINGS;
      }
    }
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ai-settings', JSON.stringify(settings));
  }
}

export function resetAISettings(): AISettings {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ai-settings');
  }
  return DEFAULT_AI_SETTINGS;
}
