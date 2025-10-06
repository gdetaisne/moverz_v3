/**
 * 🏠 TYPES ET INTERFACES POUR LA VALIDATION DES PIÈCES
 * 
 * Étape 1.5 du workflow : Validation/Correction des classifications automatiques
 */

export interface RoomGroup {
  id: string;
  roomType: string;
  confidence: number;
  photos: PhotoData[];
  isUserValidated?: boolean;
  lastModified?: Date;
  suggestions?: ValidationSuggestion[];
}

export interface PhotoData {
  id: string;
  file: File;
  fileUrl?: string;
  analysis?: any;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  error?: string;
  selectedItems: Set<number>;
  photoId?: string;
  progress?: number;
  roomName?: string;
  roomConfidence?: number;
  roomType?: string;
}

export interface ValidationSuggestion {
  type: 'low_confidence' | 'too_many_photos' | 'split_suggested' | 'merge_suggested';
  groupId: string;
  message: string;
  action: 'review_required' | 'split_suggested' | 'merge_suggested' | 'auto_fix';
  priority: 'low' | 'medium' | 'high';
}

export interface RoomValidationResult {
  totalPhotos: number;
  validatedGroups: number;
  uncertainGroups: number;
  suggestions: ValidationSuggestion[];
  processingTime: number;
}

export interface RoomTypeOption {
  value: string;
  label: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const ROOM_TYPES: RoomTypeOption[] = [
  { 
    value: 'salon', 
    label: 'Salon', 
    icon: '🛋️',
    description: 'Espace de détente avec canapés, TV, tables basses',
    keywords: ['canapé', 'tv', 'table basse', 'fauteuil', 'divan']
  },
  { 
    value: 'cuisine', 
    label: 'Cuisine', 
    icon: '🍳',
    description: 'Espace de préparation des repas avec électroménagers',
    keywords: ['réfrigérateur', 'four', 'plan de travail', 'évier', 'gazinière']
  },
  { 
    value: 'chambre', 
    label: 'Chambre', 
    icon: '🛏️',
    description: 'Espace de repos avec lit, armoire, commode',
    keywords: ['lit', 'armoire', 'commode', 'table de chevet', 'dressing']
  },
  { 
    value: 'salle-de-bain', 
    label: 'Salle de bain', 
    icon: '🚿',
    description: 'Espace sanitaire avec douche, baignoire, lavabo',
    keywords: ['douche', 'baignoire', 'lavabo', 'miroir', 'toilettes']
  },
  { 
    value: 'bureau', 
    label: 'Bureau', 
    icon: '💻',
    description: 'Espace de travail avec bureau, chaise, étagères',
    keywords: ['bureau', 'chaise', 'ordinateur', 'étagères', 'bibliothèque']
  },
  { 
    value: 'garage', 
    label: 'Garage', 
    icon: '🚗',
    description: 'Espace de stockage avec outils, voiture, rangement',
    keywords: ['outils', 'voiture', 'rangement', 'établi', 'étagères']
  },
  { 
    value: 'jardin', 
    label: 'Jardin', 
    icon: '🌳',
    description: 'Espace extérieur avec mobilier de jardin, plantes',
    keywords: ['mobilier extérieur', 'plantes', 'terrasse', 'barbecue', 'herbe']
  },
  { 
    value: 'salle-a-manger', 
    label: 'Salle à manger', 
    icon: '🍽️',
    description: 'Espace de repas avec table à manger, chaises',
    keywords: ['table à manger', 'chaises', 'buffet', 'vaisselier', 'dressoir']
  },
  { 
    value: 'couloir', 
    label: 'Couloir', 
    icon: '🚪',
    description: 'Espace de circulation avec console, miroir',
    keywords: ['console', 'miroir', 'éclairage', 'tableau', 'porte']
  },
  { 
    value: 'dressing', 
    label: 'Dressing', 
    icon: '👗',
    description: 'Espace de rangement des vêtements avec armoires',
    keywords: ['armoire', 'commode', 'miroir', 'étagères', 'cintres']
  },
  { 
    value: 'autre', 
    label: 'Autre', 
    icon: '🏠',
    description: 'Autre type de pièce non listé',
    keywords: []
  }
];

export interface RoomClassificationSettings {
  batchSize: number;
  minConfidence: number;
  maxPhotosPerGroup: number;
  enableSuggestions: boolean;
  autoReclassifyThreshold: number;
}

export const DEFAULT_CLASSIFICATION_SETTINGS: RoomClassificationSettings = {
  batchSize: 5,
  minConfidence: 0.7,
  maxPhotosPerGroup: 15,
  enableSuggestions: true,
  autoReclassifyThreshold: 0.5
};
