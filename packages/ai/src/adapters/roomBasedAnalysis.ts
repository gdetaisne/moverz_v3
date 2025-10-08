// Room-based analysis adapter (simplified)
export async function analyzeRoomPhotos(roomType: string, photos: any[]): Promise<any> {
  // Mock implementation
  return {
    roomType,
    items: [
      { name: 'Meuble', category: 'mobilier', dismountable: true, fragile: false }
    ],
    confidence: 0.9
  };
}