// Types pour la validation des pièces
export interface PhotoData {
  id: string;
  photoId?: string;
  file: File;
  fileUrl?: string;
  analysis?: {
    items: InventoryItem[];
  };
}

export interface InventoryItem {
  label: string;
  category: string;
  volume_m3: number;
  packaged_volume_m3: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

export interface RoomGroup {
  id: string;
  roomType: string;
  photos: PhotoData[];
  confidence: number;
  isUserValidated: boolean;
  lastModified: Date;
}

export const ROOM_TYPES = [
  { value: 'bureau', label: 'Bureau', icon: '💻' },
  { value: 'cave', label: 'Cave', icon: '🏺' },
  { value: 'chambre', label: 'Chambre', icon: '🛏️' },
  { value: 'couloir', label: 'Couloir', icon: '🚪' },
  { value: 'cuisine', label: 'Cuisine', icon: '🍳' },
  { value: 'entree', label: 'Entrée', icon: '🚪' },
  { value: 'garage', label: 'Garage', icon: '🚗' },
  { value: 'grenier', label: 'Grenier', icon: '🏠' },
  { value: 'jardin', label: 'Jardin', icon: '🌱' },
  { value: 'salle_a_manger', label: 'Salle à manger', icon: '🍽️' },
  { value: 'salle_de_bain', label: 'Salle de bain', icon: '🛁' },
  { value: 'salon', label: 'Salon', icon: '🛋️' },
  { value: 'terrasse', label: 'Terrasse', icon: '🌿' },
  { value: 'autre', label: 'Autre', icon: '🏠' }
];
