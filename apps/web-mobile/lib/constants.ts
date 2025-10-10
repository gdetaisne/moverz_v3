// API Base URL - pointe vers le backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// User ID pour dev (sera remplacé par auth réelle)
export const DEV_USER_ID = 'mobile-user-' + Date.now()

// Max file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Accepted image types
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

// Room types
export const ROOM_TYPES = [
  'Salon',
  'Chambre',
  'Cuisine',
  'Salle de bain',
  'Bureau',
  'Garage',
  'Cave',
  'Grenier',
  'Autre',
] as const

export type RoomType = typeof ROOM_TYPES[number]

