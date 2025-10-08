import { PhotoData, RoomGroup } from '@/lib/roomValidation';

export class SmartRoomClassificationService {
  async classifyPhotos(photos: PhotoData[]): Promise<RoomGroup[]> {
    // Classification simplifiée pour le développement
    // Dans un vrai système, cela ferait appel à une IA de classification
    
    const groups: RoomGroup[] = [];
    const photosPerGroup = Math.ceil(photos.length / 3); // Divise en ~3 groupes
    
    for (let i = 0; i < photos.length; i += photosPerGroup) {
      const groupPhotos = photos.slice(i, i + photosPerGroup);
      const roomTypes = ['salon', 'chambre', 'cuisine', 'autre'];
      const roomType = roomTypes[Math.floor(i / photosPerGroup) % roomTypes.length];
      
      groups.push({
        id: `group-${roomType}-${i}`,
        roomType,
        photos: groupPhotos,
        confidence: 0.8,
        isUserValidated: false,
        lastModified: new Date()
      });
    }
    
    return groups;
  }
}


