// Paramètres IA configurables
export interface AISettings {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens?: number;
  model: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  systemPrompt: "Tu es un expert en analyse d'inventaire de déménagement. Analyse chaque photo et détecte tous les éléments pertinents. Utilise uniquement des labels en français. Chaque objet visible doit être listé séparément. Sortie STRICTEMENT au format JSON défini, sans texte supplémentaire.",
  userPrompt: `JSON schema:
{
 "items":[
   {
     "label":"string",                 // nom de l'objet (en français, ex: "chaise", "lampe sur pied", "autres objets")
     "category":"furniture|appliance|fragile|box|misc",
     "confidence":0-1,                 // niveau de certitude
     "quantity":1,
     "dimensions_cm":{
       "length":null,"width":null,"height":null,"source":"estimated"
     },
     "volume_m3":0,
     "fragile":true|false,             // préciser si fragile
     "stackable":true|false,           // peut être empilé ou non
     "notes":"string|null"             // précisions utiles (ex: "miroir mural", "carton marqué fragile")
   }
 ],
 "totals":{
   "count_items":0,
   "volume_m3":0
 },
 "special_rules":{
   "autres_objets":{
     "present":true|false,             // si un regroupement a été créé
     "listed_items":["string","string"], // liste textuelle des petits objets regroupés
     "volume_m3":0                      // volume global estimé pour ce regroupement
   }
 }
}

Analyse chaque photo et détecte tous les éléments pertinents pour un inventaire de déménagement.

Inclure systématiquement :
- Meubles (chaises, tables, lits, armoires, commodes, canapés, etc.)
- Électroménagers (petits et gros appareils)
- Objets fragiles (miroirs, vases, télévisions, écrans, verreries, etc.)
- Décorations volumineuses (tableaux, sculptures, plantes en pot, horloges, etc.)
- Lampes de tous types (lampes de plafond, lustres, suspensions, appliques murales, lampes de table, lampadaires)
- Tapis, moquettes amovibles, carpettes → estimer leur volume **roulés** (forme cylindrique)
- Cartons visibles (même non fermés)
- Équipements particuliers (instruments de musique, matériel sportif, poussettes, vélos, etc.)
- Petits objets visibles non listés individuellement → créer une entrée générique **"autres objets"** avec une **liste textuelle des items inclus** et une **estimation du volume global**.

Règles :
- Utiliser uniquement des labels en français.
- Chaque objet visible doit être listé séparément, même si plusieurs sont identiques (ex. deux fauteuils distincts = deux entrées différentes).
- Toujours estimer les dimensions et le volume (m³). Indiquer "estimated" comme source si non mesurable précisément.
- Pour les tapis : estimer comme un cylindre roulé (longueur = largeur du tapis, diamètre approximatif une fois roulé).
- Catégoriser correctement : furniture, appliance, fragile, box, misc.
- Préciser si un objet est fragile ou empilable dans le JSON.
- Ne jamais fusionner plusieurs objets différents en un seul.
- Si plusieurs petits objets ne sont pas listés individuellement, ajouter une entrée "autres objets" avec la liste et un volume total estimé.
- La sortie doit être STRICTEMENT au format JSON défini, sans texte supplémentaire.`,
  temperature: 0.3, // Plus déterministe = plus rapide
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
