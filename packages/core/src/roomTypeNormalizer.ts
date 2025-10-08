// Room type normalization
export function normalizeRoomType(roomType: string): string {
  const roomTypeMap: Record<string, string> = {
    'salon': 'salon',
    'living': 'salon',
    'living room': 'salon',
    'cuisine': 'cuisine',
    'kitchen': 'cuisine',
    'chambre': 'chambre',
    'bedroom': 'chambre',
    'salle de bain': 'salle_de_bain',
    'bathroom': 'salle_de_bain',
    'bureau': 'bureau',
    'office': 'bureau',
    'garage': 'garage',
    'cave': 'cave',
    'basement': 'cave',
    'grenier': 'grenier',
    'attic': 'grenier'
  };
  
  const normalized = roomType.toLowerCase().trim();
  return roomTypeMap[normalized] || 'autre';
}
