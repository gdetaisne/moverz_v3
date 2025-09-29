// Paramètres IA configurables
export interface AISettings {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens?: number;
  model: string;
  openaiApiKey?: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  systemPrompt: "Expert inventaire déménagement. Analyse la pièce visible (exclure objets autres pièces/portes/fenêtres/intégrés).\n\nRègles CRITIQUES:\n- **COMPTE CHAQUE OBJET INDIVIDUELLEMENT** - même s'ils sont identiques (ex: 3 chaises = 3 entrées séparées)\n- **NE FUSIONNE JAMAIS** les objets similaires en une seule entrée\n- **UTILISE quantity=1** pour chaque objet individuel\n- Meubles, électroménagers, objets fragiles, décorations, lampes, tapis, cartons\n- Art (tableaux, sculptures) → fragile\n- Petits objets → \"autres objets\" + volume\n- Dimensions estimées + volume m³\n- fragile/stackable/notes\n\nJSON strict uniquement.",
  userPrompt: `JSON schema:
{
 "items":[
   {
     "label":"string",                  // ex: "chaise", "lampe sur pied", "tableau encadré"
     "category":"furniture|appliance|box|art|misc",
     "confidence":0-1,
     "quantity":1,                      // TOUJOURS 1 - chaque objet individuellement
     "dimensions_cm":{
       "length":null,"width":null,"height":null,"source":"estimated"
     },
     "volume_m3":0,
     "fragile":true,
     "stackable":false,
     "notes":"string|null"
   }
 ],
 "totals":{
   "count_items":0,
   "volume_m3":0
 },
 "special_rules":{
   "autres_objets":{
     "present":true,
     "listed_items":["string","string"],
     "volume_m3":0
   }
 }
}

IMPORTANT: Si tu vois 3 chaises identiques, crée 3 entrées séparées avec label="chaise" et quantity=1 chacune.
Analyse la photo et détecte tous les objets mobiles visibles pour l'inventaire de déménagement.`,
  temperature: 0.5, // Équilibré pour détecter tous les objets sans fusion
  maxTokens: 2000, // Augmenter pour le prompt plus détaillé
  model: "gpt-4o-mini", // Plus rapide que gpt-4o
  openaiApiKey: "" // Clé API à configurer
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
