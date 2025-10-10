'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import MobileLoader from '@/components/MobileLoader'
import { apiClient, Photo, InventoryItem } from '@/lib/apiClient'
import { formatVolume } from '@/lib/helpers'
import { vibrate } from '@/lib/helpers'

export default function InventoryPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const data = await apiClient.getPhotos()
      setPhotos(data.filter(p => p.items && p.items.length > 0))
    } catch (error) {
      console.error('Failed to load photos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (photoId: string, itemId: string, field: 'fragile' | 'dismountable', value: boolean) => {
    vibrate(10)
    try {
      await apiClient.updateItem(photoId, itemId, { [field]: value })
      await loadPhotos()
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  const totalItems = photos.reduce((sum, p) => sum + (p.items?.length || 0), 0)
  const totalVolume = photos.reduce((sum, p) => {
    const items = p.items || []
    return sum + items.reduce((itemSum, item) => itemSum + (item.volume * item.quantity), 0)
  }, 0)

  // Group by room
  const roomGroups = photos.reduce((acc, photo) => {
    const room = photo.roomType || 'Autre'
    if (!acc[room]) acc[room] = []
    acc[room].push(photo)
    return acc
  }, {} as Record<string, Photo[]>)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MobileHeader
        title="Inventaire"
        subtitle={`${totalItems} objets • ${formatVolume(totalVolume)}`}
      />

      {isLoading ? (
        <MobileLoader message="Chargement de l'inventaire..." />
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun objet détecté
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Ajoutez des photos pour générer votre inventaire
          </p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium"
          >
            Ajouter des photos
          </button>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="p-4">
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold">{totalItems}</div>
                  <div className="text-blue-100 text-sm">objets au total</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{formatVolume(totalVolume)}</div>
                  <div className="text-blue-100 text-sm">volume estimé</div>
                </div>
              </div>
              <div className="text-blue-100 text-sm">
                {Object.keys(roomGroups).length} pièce{Object.keys(roomGroups).length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Rooms list */}
          <div className="px-4 space-y-4">
            {Object.entries(roomGroups).map(([roomType, roomPhotos]) => {
              const roomItems = roomPhotos.flatMap(p => p.items || [])
              const roomVolume = roomItems.reduce((sum, item) => sum + (item.volume * item.quantity), 0)
              const isExpanded = selectedRoom === roomType

              return (
                <div key={roomType} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                  {/* Room header */}
                  <button
                    onClick={() => {
                      vibrate(10)
                      setSelectedRoom(isExpanded ? null : roomType)
                    }}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xl">🏠</span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{roomType}</div>
                        <div className="text-sm text-gray-500">
                          {roomItems.length} objet{roomItems.length > 1 ? 's' : ''} • {formatVolume(roomVolume)}
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Items list */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {roomPhotos.map(photo => (
                        <div key={photo.id} className="p-4 space-y-3">
                          {photo.items?.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.quantity}x {item.name}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {item.category} • {formatVolume(item.volume * item.quantity)}
                                </div>
                                
                                {/* Toggles */}
                                <div className="flex gap-3 mt-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.fragile}
                                      onChange={(e) => handleToggle(photo.id, item.id, 'fragile', e.target.checked)}
                                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-700">Fragile</span>
                                  </label>
                                  
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.dismountable}
                                      onChange={(e) => handleToggle(photo.id, item.id, 'dismountable', e.target.checked)}
                                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-700">Démontable</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA button */}
          <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 safe-bottom bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-8">
            <button
              onClick={() => router.push('/estimate')}
              className="w-full bg-secondary text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-xl active:scale-95 transition-transform"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Obtenir mon devis
              </span>
            </button>
          </div>
        </>
      )}

      <MobileBottomNav />
    </div>
  )
}

