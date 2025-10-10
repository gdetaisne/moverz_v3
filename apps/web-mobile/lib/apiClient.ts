import { API_BASE_URL, DEV_USER_ID } from './constants'

// Types
export interface Photo {
  id: string
  filename: string
  url: string
  roomType?: string
  userId: string
  createdAt: string
  items?: InventoryItem[]
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  volume: number
  quantity: number
  fragile: boolean
  dismountable: boolean
}

export interface Estimate {
  totalVolume: number
  estimatedPrice: number
  itemCount: number
  rooms: Array<{
    roomType: string
    items: InventoryItem[]
  }>
}

// API Client
class ApiClient {
  private baseUrl: string
  private userId: string

  constructor() {
    this.baseUrl = API_BASE_URL
    this.userId = DEV_USER_ID
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Upload photo
  async uploadPhoto(file: File, roomType?: string): Promise<Photo> {
    const formData = new FormData()
    formData.append('file', file)
    if (roomType) formData.append('roomType', roomType)

    const response = await fetch(`${this.baseUrl}/api/photos`, {
      method: 'POST',
      headers: {
        'x-user-id': this.userId,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  }

  // Get photos
  async getPhotos(): Promise<Photo[]> {
    return this.request<Photo[]>('/api/photos')
  }

  // Analyze photos
  async analyzePhotos(): Promise<void> {
    return this.request('/api/photos/analyze', {
      method: 'POST',
    })
  }

  // Get estimate
  async getEstimate(): Promise<Estimate> {
    return this.request<Estimate>('/api/estimate')
  }

  // Update item
  async updateItem(photoId: string, itemId: string, updates: Partial<InventoryItem>): Promise<Photo> {
    return this.request<Photo>(`/api/photos/${photoId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  // Delete photo
  async deletePhoto(photoId: string): Promise<void> {
    return this.request(`/api/photos/${photoId}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient()

