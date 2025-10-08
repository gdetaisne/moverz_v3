// Types publics pour l'API IA

export interface InventoryItem {
  name: string;
  category: string;
  dismountable?: boolean;
  fragile?: boolean;
  selected?: boolean;
  confidence?: number;
}

export interface PhotoAnalysis {
  items: InventoryItem[];
  roomType?: string;
  confidence?: number;
}

export interface RoomAnalysis {
  roomType: string;
  items: InventoryItem[];
  confidence: number;
}

export interface AnalyzePhotoOptions {
  provider?: 'claude' | 'openai';
  roomType?: string;
  userId?: string;
}

export type RoomType = 
  | 'salon'
  | 'cuisine'
  | 'chambre'
  | 'salle_de_bain'
  | 'bureau'
  | 'garage'
  | 'cave'
  | 'grenier'
  | 'autre';
