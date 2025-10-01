// lib/depthDatabase.ts
// Base de données de profondeurs typiques par catégorie d'objet

export interface DepthInfo {
  min: number;        // Profondeur minimale (cm)
  max: number;        // Profondeur maximale (cm)
  average: number;    // Profondeur moyenne (cm)
  confidence: number; // Confiance dans ces valeurs (0-1)
  notes?: string;     // Notes additionnelles
}

export interface ObjectDepthEntry {
  category: string;
  objectTypes: string[];  // Noms d'objets correspondants
  depth: DepthInfo;
  aspectRatio?: {         // Ratio typique longueur/largeur/profondeur
    lengthToDepth: number;
    widthToDepth: number;
  };
}

/**
 * Base de données de profondeurs typiques pour les objets de déménagement
 * Valeurs basées sur des mesures réelles et standards de l'industrie
 */
export const DEPTH_DATABASE: ObjectDepthEntry[] = [
  // === MEUBLES ASSISES ===
  {
    category: 'seating',
    objectTypes: ['chair', 'chaise', 'seat', 'dining chair'],
    depth: {
      min: 45,
      max: 55,
      average: 50,
      confidence: 0.95,
      notes: 'Chaise standard de salle à manger'
    },
    aspectRatio: {
      lengthToDepth: 1.0,  // Carré
      widthToDepth: 1.0
    }
  },
  {
    category: 'seating',
    objectTypes: ['armchair', 'fauteuil', 'lounge chair', 'reading chair'],
    depth: {
      min: 70,
      max: 90,
      average: 80,
      confidence: 0.90,
      notes: 'Fauteuil salon/lecture'
    },
    aspectRatio: {
      lengthToDepth: 1.1,
      widthToDepth: 1.0
    }
  },
  {
    category: 'seating',
    objectTypes: ['sofa', 'couch', 'canapé', 'settee', 'loveseat'],
    depth: {
      min: 80,
      max: 100,
      average: 90,
      confidence: 0.95,
      notes: 'Canapé standard 2-3 places'
    },
    aspectRatio: {
      lengthToDepth: 2.0,  // Souvent 2x plus long que profond
      widthToDepth: 1.0
    }
  },
  {
    category: 'seating',
    objectTypes: ['bench', 'banc', 'ottoman', 'pouf'],
    depth: {
      min: 35,
      max: 50,
      average: 40,
      confidence: 0.85,
      notes: 'Banc ou pouf'
    }
  },

  // === TABLES ===
  {
    category: 'table',
    objectTypes: ['dining table', 'table à manger', 'dinner table'],
    depth: {
      min: 80,
      max: 100,
      average: 90,
      confidence: 0.90,
      notes: 'Table de salle à manger'
    },
    aspectRatio: {
      lengthToDepth: 1.5,  // Souvent rectangulaire
      widthToDepth: 1.0
    }
  },
  {
    category: 'table',
    objectTypes: ['coffee table', 'table basse', 'salon table'],
    depth: {
      min: 50,
      max: 70,
      average: 60,
      confidence: 0.90,
      notes: 'Table basse de salon'
    }
  },
  {
    category: 'table',
    objectTypes: ['desk', 'bureau', 'work table', 'writing desk'],
    depth: {
      min: 60,
      max: 80,
      average: 70,
      confidence: 0.90,
      notes: 'Bureau standard'
    },
    aspectRatio: {
      lengthToDepth: 1.8,
      widthToDepth: 1.0
    }
  },
  {
    category: 'table',
    objectTypes: ['side table', 'table d\'appoint', 'end table', 'nightstand', 'bedside table'],
    depth: {
      min: 30,
      max: 45,
      average: 35,
      confidence: 0.85,
      notes: 'Table d\'appoint ou chevet'
    },
    aspectRatio: {
      lengthToDepth: 1.0,  // Souvent carré
      widthToDepth: 1.0
    }
  },

  // === RANGEMENTS ===
  {
    category: 'storage',
    objectTypes: ['wardrobe', 'armoire', 'closet', 'cabinet'],
    depth: {
      min: 55,
      max: 65,
      average: 60,
      confidence: 0.95,
      notes: 'Armoire standard (profondeur pour cintres)'
    },
    aspectRatio: {
      lengthToDepth: 2.5,
      widthToDepth: 1.0
    }
  },
  {
    category: 'storage',
    objectTypes: ['dresser', 'commode', 'chest of drawers'],
    depth: {
      min: 40,
      max: 55,
      average: 45,
      confidence: 0.90,
      notes: 'Commode standard'
    }
  },
  {
    category: 'storage',
    objectTypes: ['bookshelf', 'bibliothèque', 'étagère', 'shelving unit'],
    depth: {
      min: 25,
      max: 35,
      average: 30,
      confidence: 0.90,
      notes: 'Bibliothèque/étagère standard'
    },
    aspectRatio: {
      lengthToDepth: 3.0,
      widthToDepth: 1.0
    }
  },
  {
    category: 'storage',
    objectTypes: ['tv stand', 'meuble tv', 'media console', 'entertainment center'],
    depth: {
      min: 35,
      max: 50,
      average: 40,
      confidence: 0.85,
      notes: 'Meuble TV standard'
    },
    aspectRatio: {
      lengthToDepth: 3.0,
      widthToDepth: 1.0
    }
  },
  {
    category: 'storage',
    objectTypes: ['sideboard', 'buffet', 'credenza'],
    depth: {
      min: 40,
      max: 50,
      average: 45,
      confidence: 0.85,
      notes: 'Buffet/vaisselier'
    }
  },

  // === ÉLECTROMÉNAGER ===
  {
    category: 'appliance',
    objectTypes: ['refrigerator', 'réfrigérateur', 'fridge', 'frigo'],
    depth: {
      min: 60,
      max: 75,
      average: 65,
      confidence: 0.95,
      notes: 'Réfrigérateur standard'
    }
  },
  {
    category: 'appliance',
    objectTypes: ['washing machine', 'lave-linge', 'washer'],
    depth: {
      min: 55,
      max: 65,
      average: 60,
      confidence: 0.95,
      notes: 'Lave-linge standard'
    }
  },
  {
    category: 'appliance',
    objectTypes: ['dryer', 'sèche-linge'],
    depth: {
      min: 55,
      max: 65,
      average: 60,
      confidence: 0.95,
      notes: 'Sèche-linge standard'
    }
  },
  {
    category: 'appliance',
    objectTypes: ['dishwasher', 'lave-vaisselle'],
    depth: {
      min: 55,
      max: 60,
      average: 57,
      confidence: 0.95,
      notes: 'Lave-vaisselle encastrable standard'
    }
  },
  {
    category: 'appliance',
    objectTypes: ['oven', 'four', 'stove', 'cuisinière'],
    depth: {
      min: 55,
      max: 65,
      average: 60,
      confidence: 0.90,
      notes: 'Four/cuisinière standard'
    }
  },
  {
    category: 'appliance',
    objectTypes: ['microwave', 'micro-ondes'],
    depth: {
      min: 30,
      max: 45,
      average: 35,
      confidence: 0.85,
      notes: 'Micro-ondes pose libre'
    }
  },

  // === LITS ===
  {
    category: 'bed',
    objectTypes: ['single bed', 'lit simple', 'twin bed'],
    depth: {
      min: 190,
      max: 200,
      average: 190,
      confidence: 0.95,
      notes: 'Lit simple (90x190cm standard)'
    },
    aspectRatio: {
      lengthToDepth: 0.5,  // 90cm de large pour 190cm de long
      widthToDepth: 1.0
    }
  },
  {
    category: 'bed',
    objectTypes: ['double bed', 'lit double', 'full bed', 'queen bed', 'king bed'],
    depth: {
      min: 190,
      max: 200,
      average: 190,
      confidence: 0.95,
      notes: 'Lit double standard'
    },
    aspectRatio: {
      lengthToDepth: 0.8,  // ~140-160cm de large
      widthToDepth: 1.0
    }
  },

  // === DÉCORAT ION ===
  {
    category: 'decor',
    objectTypes: ['lamp', 'lampe', 'floor lamp', 'lampadaire'],
    depth: {
      min: 20,
      max: 35,
      average: 25,
      confidence: 0.75,
      notes: 'Lampe sur pied - base'
    }
  },
  {
    category: 'decor',
    objectTypes: ['mirror', 'miroir'],
    depth: {
      min: 2,
      max: 5,
      average: 3,
      confidence: 0.90,
      notes: 'Miroir mural (épaisseur)'
    }
  },
  {
    category: 'decor',
    objectTypes: ['picture', 'tableau', 'painting', 'frame'],
    depth: {
      min: 2,
      max: 8,
      average: 4,
      confidence: 0.85,
      notes: 'Cadre/tableau (épaisseur)'
    }
  },
  {
    category: 'decor',
    objectTypes: ['plant', 'plante', 'pot'],
    depth: {
      min: 15,
      max: 40,
      average: 25,
      confidence: 0.70,
      notes: 'Plante en pot (diamètre pot)'
    }
  },

  // === DIVERS ===
  {
    category: 'misc',
    objectTypes: ['box', 'boîte', 'carton', 'container'],
    depth: {
      min: 30,
      max: 50,
      average: 40,
      confidence: 0.80,
      notes: 'Carton standard de déménagement'
    }
  },
  {
    category: 'misc',
    objectTypes: ['suitcase', 'valise', 'luggage'],
    depth: {
      min: 15,
      max: 30,
      average: 20,
      confidence: 0.75,
      notes: 'Valise standard'
    }
  },
  {
    category: 'misc',
    objectTypes: ['bicycle', 'vélo', 'bike'],
    depth: {
      min: 40,
      max: 60,
      average: 50,
      confidence: 0.80,
      notes: 'Vélo (largeur du guidon)'
    }
  }
];

/**
 * Trouve la profondeur typique pour un objet donné
 */
export function getTypicalDepth(objectLabel: string, category?: string): DepthInfo {
  const lowerLabel = objectLabel.toLowerCase();
  
  // Rechercher par label d'abord
  for (const entry of DEPTH_DATABASE) {
    if (entry.objectTypes.some(type => lowerLabel.includes(type.toLowerCase()) || type.toLowerCase().includes(lowerLabel))) {
      return entry.depth;
    }
  }
  
  // Rechercher par catégorie si fournie
  if (category) {
    const lowerCategory = category.toLowerCase();
    for (const entry of DEPTH_DATABASE) {
      if (entry.category.toLowerCase() === lowerCategory) {
        return entry.depth;
      }
    }
  }
  
  // Fallback par défaut
  return {
    min: 20,
    max: 80,
    average: 50,
    confidence: 0.3,
    notes: 'Estimation par défaut (objet non trouvé dans la base)'
  };
}

/**
 * Calcule une profondeur intelligente basée sur la largeur et la hauteur
 */
export function calculateSmartDepth(
  objectLabel: string,
  width: number,
  height: number,
  category?: string
): number {
  const depthInfo = getTypicalDepth(objectLabel, category);
  
  // Trouver l'entrée complète pour les aspect ratios
  const lowerLabel = objectLabel.toLowerCase();
  const entry = DEPTH_DATABASE.find(e => 
    e.objectTypes.some(type => lowerLabel.includes(type.toLowerCase()))
  );
  
  if (entry?.aspectRatio) {
    // Utiliser les ratios pour estimer la profondeur
    const depthFromWidth = width / entry.aspectRatio.lengthToDepth;
    const depthFromHeight = height / entry.aspectRatio.widthToDepth;
    
    // Moyenne pondérée
    const estimatedDepth = (depthFromWidth + depthFromHeight) / 2;
    
    // Limiter aux bornes min/max
    return Math.max(
      depthInfo.min,
      Math.min(depthInfo.max, Math.round(estimatedDepth))
    );
  }
  
  // Sinon, utiliser la profondeur moyenne
  return depthInfo.average;
}

/**
 * Valide si une profondeur est cohérente pour un objet donné
 */
export function validateDepth(
  objectLabel: string,
  depth: number,
  category?: string
): { isValid: boolean; correctedDepth?: number; reason?: string } {
  const depthInfo = getTypicalDepth(objectLabel, category);
  
  if (depth >= depthInfo.min && depth <= depthInfo.max) {
    return { isValid: true };
  }
  
  // Profondeur hors limites, proposer une correction
  let correctedDepth = depth;
  let reason = '';
  
  if (depth < depthInfo.min) {
    correctedDepth = depthInfo.min;
    reason = `Profondeur trop faible (${depth}cm < ${depthInfo.min}cm), corrigée à ${depthInfo.min}cm`;
  } else if (depth > depthInfo.max) {
    correctedDepth = depthInfo.max;
    reason = `Profondeur trop élevée (${depth}cm > ${depthInfo.max}cm), corrigée à ${depthInfo.max}cm`;
  }
  
  return {
    isValid: false,
    correctedDepth,
    reason
  };
}

/**
 * Obtient des statistiques sur la base de données
 */
export function getDepthDatabaseStats() {
  return {
    totalEntries: DEPTH_DATABASE.length,
    categories: [...new Set(DEPTH_DATABASE.map(e => e.category))],
    totalObjectTypes: DEPTH_DATABASE.reduce((sum, e) => sum + e.objectTypes.length, 0),
    averageConfidence: DEPTH_DATABASE.reduce((sum, e) => sum + e.depth.confidence, 0) / DEPTH_DATABASE.length
  };
}

