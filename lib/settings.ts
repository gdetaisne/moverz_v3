// Paramètres IA configurables
export interface AISettings {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens?: number;
  model: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  systemPrompt: "Tu es un expert en inventaire de déménagement. Analyse uniquement la pièce visible sur la photo (exclure objets d'autres pièces, à travers portes/fenêtres, ou intégrés/immobiles type radiateur, lavabo, cuisine).\n\nConsignes :\n- Lister chaque objet séparément, même identique (jamais fusionner).\n- Inclure : meubles, électroménagers, objets fragiles, décorations volumineuses, lampes, tapis (roulés en cylindre), cartons, équipements particuliers.\n- Objets d'art (tableaux, sculptures, statues, œuvres encadrées) → toujours en \"fragile\".\n- Petits objets non listés individuellement → entrée \"autres objets\" avec liste textuelle + volume global.\n- Ne jamais ouvrir virtuellement cartons/tiroirs.\n- Dimensions toujours fournies (même estimées), avec volume en m³.\n- Métadonnées : fragile (oui/non), stackable (oui/non), notes utiles (\"partiellement visible\", \"carton marqué fragile\").\n\nSortie : STRICTEMENT au format JSON défini ci-dessous, sans texte supplémentaire.",
  userPrompt: `JSON schema:
{
 "items":[
   {
     "label":"string",                  // ex: "chaise", "lampe sur pied", "tableau encadré"
     "category":"furniture|appliance|box|art|misc",
     "confidence":0-1,
     "quantity":1,
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

Analyse la photo et détecte tous les objets mobiles visibles pour l'inventaire de déménagement.`,
  temperature: 0.5, // Équilibré pour détecter tous les objets sans fusion
  maxTokens: 2000, // Augmenter pour le prompt plus détaillé
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
