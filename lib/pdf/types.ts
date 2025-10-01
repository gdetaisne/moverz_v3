// Types pour la génération PDF

export interface PDFFormData {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  
  departureCity: string;
  departurePostalCode: string;
  departureFloor?: string;
  departureElevator: boolean;
  departureArea?: string;
  departureTruckAccess?: boolean;
  departureMonteCharge?: boolean;
  
  arrivalCity: string;
  arrivalPostalCode: string;
  arrivalFloor?: string;
  arrivalElevator: boolean;
  arrivalArea?: string;
  arrivalTruckAccess?: boolean;
  arrivalMonteCharge?: boolean;
  
  movingDate: string;
  movingTime?: string;
  flexibleDate?: boolean;
  
  selectedOffer: 'economique' | 'standard' | 'premium';
}

export interface PDFInventoryItem {
  label: string;
  category: string;
  quantity: number;
  dimensions_cm?: {
    length: number | null;
    width: number | null;
    height: number | null;
  };
  volume_m3: number;
  fragile: boolean;
  dismountable?: boolean;
  notes?: string | null;
}

export interface PDFRoomData {
  id: string;
  name: string;
  photos: Array<{
    fileUrl?: string;
    photoData?: string; // Base64
    items: PDFInventoryItem[];
  }>;
}

export interface PDFGenerationData {
  formData: PDFFormData;
  rooms: PDFRoomData[];
  generatedDate: string;
  referenceNumber: string;
}

export interface PDFSummary {
  totalItems: number;
  totalVolume: number;
  roomCount: number;
  hasFragileItems: boolean;
  hasDismountableItems: boolean;
}

