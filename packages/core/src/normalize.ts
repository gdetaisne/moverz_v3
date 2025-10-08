// Normalization utilities
export function normalizeString(str: string): string {
  return str.trim().toLowerCase();
}

export function normalizeRoomType(roomType: string): string {
  return normalizeString(roomType).replace(/\s+/g, '_');
}
