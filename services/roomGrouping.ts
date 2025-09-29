import { TPhotoAnalysis } from "@/lib/schemas";

export interface RoomInfo {
  roomId: string;
  roomType: 'salon' | 'cuisine' | 'chambre' | 'bureau' | 'salle_de_bain' | 'garage' | 'cave' | 'autre';
  confidence: number;
  characteristics: string[];
  photos: string[];
  createdAt: number;
}

export interface RoomGroupingResult {
  rooms: RoomInfo[];
  ungroupedPhotos: string[];
  suggestions: string[];
}

// Cache des informations de pièces
const roomCache = new Map<string, RoomInfo>();

// Mots-clés pour identifier les types de pièces
const ROOM_KEYWORDS = {
  salon: ['canapé', 'tv', 'télévision', 'table basse', 'fauteuil', 'divan', 'séjour', 'living'],
  cuisine: ['frigo', 'réfrigérateur', 'évier', 'four', 'micro-ondes', 'plaque', 'cuisinière', 'table de cuisine'],
  chambre: ['lit', 'matelas', 'commode', 'armoire', 'chevet', 'dressing', 'chambre à coucher'],
  bureau: ['bureau', 'chaise de bureau', 'ordinateur', 'étagère', 'bibliothèque', 'fauteuil de bureau'],
  salle_de_bain: ['douche', 'baignoire', 'lavabo', 'toilettes', 'salle de bain', 'salle d\'eau'],
  garage: ['voiture', 'outils', 'établi', 'garage', 'parking'],
  cave: ['cave', 'sous-sol', 'stockage', 'réserve']
};

export async function groupPhotosByRoom(
  photos: Array<{ photoId: string; analysis: TPhotoAnalysis; imageUrl: string }>
): Promise<RoomGroupingResult> {
  try {
    const rooms: RoomInfo[] = [];
    const ungroupedPhotos: string[] = [];
    const suggestions: string[] = [];

    // Analyser chaque photo pour déterminer la pièce
    for (const photo of photos) {
      const roomInfo = await analyzePhotoForRoom(photo.analysis, photo.imageUrl);
      
      if (roomInfo) {
        // Chercher une pièce existante similaire
        const existingRoom = findSimilarRoom(roomInfo, rooms);
        
        if (existingRoom) {
          // Ajouter la photo à la pièce existante
          existingRoom.photos.push(photo.photoId);
          existingRoom.confidence = Math.max(existingRoom.confidence, roomInfo.confidence);
        } else {
          // Créer une nouvelle pièce
          const newRoom: RoomInfo = {
            roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            roomType: roomInfo.roomType,
            confidence: roomInfo.confidence,
            characteristics: roomInfo.characteristics,
            photos: [photo.photoId],
            createdAt: Date.now()
          };
          rooms.push(newRoom);
        }
      } else {
        ungroupedPhotos.push(photo.photoId);
      }
    }

    // Générer des suggestions d'amélioration
    suggestions.push(...generateRoomSuggestions(rooms, ungroupedPhotos));

    return {
      rooms,
      ungroupedPhotos,
      suggestions
    };

  } catch (error) {
    console.error('Erreur lors du regroupement par pièce:', error);
    return {
      rooms: [],
      ungroupedPhotos: photos.map(p => p.photoId),
      suggestions: ['Erreur lors de l\'analyse des pièces']
    };
  }
}

async function analyzePhotoForRoom(
  analysis: TPhotoAnalysis,
  imageUrl: string
): Promise<{ roomType: RoomInfo['roomType']; confidence: number; characteristics: string[] } | null> {
  const characteristics: string[] = [];
  let maxConfidence = 0;
  let detectedRoomType: RoomInfo['roomType'] = 'autre';

  // Analyser les objets détectés
  for (const item of analysis.items) {
    const itemLabel = item.label.toLowerCase();
    
    // Chercher des correspondances avec les mots-clés des pièces
    for (const [roomType, keywords] of Object.entries(ROOM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (itemLabel.includes(keyword.toLowerCase())) {
          characteristics.push(`${item.label} (${item.quantity}x)`);
          
          // Calculer la confiance basée sur la confiance de l'objet
          const confidence = item.confidence || 0.8;
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            detectedRoomType = roomType as RoomInfo['roomType'];
          }
        }
      }
    }
  }

  // Analyser les règles spéciales
  if (analysis.special_rules?.autres_objets?.present) {
    characteristics.push('Objets divers');
  }

  // Seuil de confiance minimum
  if (maxConfidence < 0.3) {
    return null;
  }

  return {
    roomType: detectedRoomType,
    confidence: maxConfidence,
    characteristics
  };
}

function findSimilarRoom(
  roomInfo: { roomType: RoomInfo['roomType']; confidence: number; characteristics: string[] },
  existingRooms: RoomInfo[]
): RoomInfo | null {
  for (const room of existingRooms) {
    // Même type de pièce
    if (room.roomType === roomInfo.roomType) {
      // Vérifier la similarité des caractéristiques
      const similarity = calculateCharacteristicsSimilarity(room.characteristics, roomInfo.characteristics);
      if (similarity > 0.5) {
        return room;
      }
    }
  }
  
  return null;
}

function calculateCharacteristicsSimilarity(
  characteristics1: string[],
  characteristics2: string[]
): number {
  if (characteristics1.length === 0 || characteristics2.length === 0) return 0;
  
  const set1 = new Set(characteristics1);
  const set2 = new Set(characteristics2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function generateRoomSuggestions(rooms: RoomInfo[], ungroupedPhotos: string[]): string[] {
  const suggestions: string[] = [];
  
  // Suggestions pour les photos non groupées
  if (ungroupedPhotos.length > 0) {
    suggestions.push(`${ungroupedPhotos.length} photo(s) n'ont pas pu être groupées par pièce. Vérifiez manuellement.`);
  }
  
  // Suggestions pour les pièces avec peu de photos
  const roomsWithFewPhotos = rooms.filter(room => room.photos.length < 2);
  if (roomsWithFewPhotos.length > 0) {
    suggestions.push(`${roomsWithFewPhotos.length} pièce(s) n'ont qu'une seule photo. Ajoutez plus de photos pour une meilleure identification.`);
  }
  
  // Suggestions pour les pièces avec faible confiance
  const lowConfidenceRooms = rooms.filter(room => room.confidence < 0.7);
  if (lowConfidenceRooms.length > 0) {
    suggestions.push(`${lowConfidenceRooms.length} pièce(s) ont une confiance faible. Vérifiez l'identification manuellement.`);
  }
  
  // Suggestions d'amélioration
  if (rooms.length === 0) {
    suggestions.push('Aucune pièce identifiée. Assurez-vous que les photos contiennent des objets reconnaissables.');
  } else if (rooms.length === 1) {
    suggestions.push('Une seule pièce identifiée. Vérifiez que les photos proviennent bien de différentes pièces.');
  }
  
  return suggestions;
}

// Fonction utilitaire pour obtenir les statistiques des pièces
export function getRoomStats(): { totalRooms: number; totalPhotos: number; roomTypes: Record<string, number> } {
  const roomTypes: Record<string, number> = {};
  let totalPhotos = 0;
  
  for (const room of roomCache.values()) {
    roomTypes[room.roomType] = (roomTypes[room.roomType] || 0) + 1;
    totalPhotos += room.photos.length;
  }
  
  return {
    totalRooms: roomCache.size,
    totalPhotos,
    roomTypes
  };
}

// Fonction utilitaire pour nettoyer le cache des pièces
export function clearRoomCache(): void {
  roomCache.clear();
}
