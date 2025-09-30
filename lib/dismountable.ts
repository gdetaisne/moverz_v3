/**
 * Base de données des probabilités de démontabilité par type d'objet
 * Utilisée pour l'approche hybride IA + Base de données
 */

export interface DismountableConfig {
  dismountable_probability: number; // 0-1, probabilité que ce type soit démontable
  default_dismountable: boolean;    // Valeur par défaut si ambigu
  requires_visual_check: boolean;   // Si l'IA doit analyser l'image
  category: 'furniture' | 'appliance' | 'misc';
}

export const DISMOUNTABLE_DATABASE: Record<string, DismountableConfig> = {
  // LITS - Généralement démontables
  'lit': {
    dismountable_probability: 0.95,
    default_dismountable: true,
    requires_visual_check: false,
    category: 'furniture'
  },
  'lit double': {
    dismountable_probability: 0.95,
    default_dismountable: true,
    requires_visual_check: false,
    category: 'furniture'
  },
  'matelas': {
    dismountable_probability: 0.0, // Un matelas n'est pas "démontable"
    default_dismountable: false,
    requires_visual_check: false,
    category: 'furniture'
  },
  'tête de lit': {
    dismountable_probability: 0.8,
    default_dismountable: true,
    requires_visual_check: true, // Peut être fixe ou démontable
    category: 'furniture'
  },

  // ARMORIES - Très souvent démontables
  'armoire': {
    dismountable_probability: 0.9,
    default_dismountable: true,
    requires_visual_check: false,
    category: 'furniture'
  },
  'dressing': {
    dismountable_probability: 0.9,
    default_dismountable: true,
    requires_visual_check: false,
    category: 'furniture'
  },
  'placard': {
    dismountable_probability: 0.7, // Peut être intégré
    default_dismountable: true,
    requires_visual_check: true,
    category: 'furniture'
  },

  // TABLES - Variable selon le type
  'table': {
    dismountable_probability: 0.6,
    default_dismountable: false,
    requires_visual_check: true,
    category: 'furniture'
  },
  'table à manger': {
    dismountable_probability: 0.7,
    default_dismountable: false,
    requires_visual_check: true,
    category: 'furniture'
  },
  'table basse': {
    dismountable_probability: 0.5,
    default_dismountable: false,
    requires_visual_check: true,
    category: 'furniture'
  },
  'bureau': {
    dismountable_probability: 0.8,
    default_dismountable: true,
    requires_visual_check: true,
    category: 'furniture'
  },

  // CHAISES - Très variable
  'chaise': {
    dismountable_probability: 0.4,
    default_dismountable: false,
    requires_visual_check: true, // Peut être pliable, vissée, ou soudée
    category: 'furniture'
  },
  'fauteuil': {
    dismountable_probability: 0.3,
    default_dismountable: false,
    requires_visual_check: true,
    category: 'furniture'
  },
  'canapé': {
    dismountable_probability: 0.2,
    default_dismountable: false,
    requires_visual_check: true, // Peut être modulaire
    category: 'furniture'
  },

  // ÉLECTROMÉNAGER - Généralement non démontables
  'réfrigérateur': {
    dismountable_probability: 0.1,
    default_dismountable: false,
    requires_visual_check: false,
    category: 'appliance'
  },
  'lave-linge': {
    dismountable_probability: 0.1,
    default_dismountable: false,
    requires_visual_check: false,
    category: 'appliance'
  },
  'lave-vaisselle': {
    dismountable_probability: 0.1,
    default_dismountable: false,
    requires_visual_check: false,
    category: 'appliance'
  },

  // DIVERS - Généralement non démontables
  'miroir': {
    dismountable_probability: 0.1,
    default_dismountable: false,
    requires_visual_check: false,
    category: 'misc'
  },
  'tableau': {
    dismountable_probability: 0.0,
    default_dismountable: false,
    requires_visual_check: false,
    category: 'misc'
  },
  'lampe': {
    dismountable_probability: 0.3,
    default_dismountable: false,
    requires_visual_check: true, // Peut être démontable
    category: 'misc'
  }
};

/**
 * Trouve la configuration de démontabilité pour un objet
 */
export function getDismountableConfig(label: string): DismountableConfig | null {
  const normalizedLabel = label.toLowerCase().trim();
  
  // Recherche exacte
  if (DISMOUNTABLE_DATABASE[normalizedLabel]) {
    return DISMOUNTABLE_DATABASE[normalizedLabel];
  }
  
  // Recherche par mots-clés
  for (const [key, config] of Object.entries(DISMOUNTABLE_DATABASE)) {
    if (normalizedLabel.includes(key) || key.includes(normalizedLabel)) {
      return config;
    }
  }
  
  // Configuration par défaut pour objets non trouvés
  return {
    dismountable_probability: 0.3,
    default_dismountable: false,
    requires_visual_check: true,
    category: 'furniture'
  };
}

/**
 * Détermine si un objet doit être analysé visuellement par l'IA
 */
export function requiresVisualCheck(label: string): boolean {
  const config = getDismountableConfig(label);
  return config?.requires_visual_check || false;
}

/**
 * Calcule la probabilité finale de démontabilité
 * Combine la base de données avec l'analyse IA
 */
export function calculateDismountableProbability(
  label: string,
  aiDismountable?: boolean,
  aiConfidence?: number
): { isDismountable: boolean; confidence: number; source: 'database' | 'ai' | 'hybrid' } {
  const config = getDismountableConfig(label);
  
  // Si pas de config trouvée, utiliser les valeurs par défaut
  if (!config) {
    return {
      isDismountable: false,
      confidence: 0.5,
      source: 'database'
    };
  }
  
  // Si pas d'analyse IA ou confiance faible, utiliser la base de données
  if (!aiDismountable || aiConfidence === undefined || aiConfidence < 0.6) {
    return {
      isDismountable: config.default_dismountable,
      confidence: config.dismountable_probability,
      source: 'database'
    };
  }
  
  // Si analyse IA avec bonne confiance, l'utiliser
  if (aiConfidence >= 0.8) {
    return {
      isDismountable: aiDismountable,
      confidence: aiConfidence,
      source: 'ai'
    };
  }
  
  // Approche hybride : combiner IA + base de données
  const hybridConfidence = (aiConfidence + config.dismountable_probability) / 2;
  const hybridDismountable = aiConfidence > config.dismountable_probability ? aiDismountable : config.default_dismountable;
  
  return {
    isDismountable: hybridDismountable,
    confidence: hybridConfidence,
    source: 'hybrid'
  };
}
