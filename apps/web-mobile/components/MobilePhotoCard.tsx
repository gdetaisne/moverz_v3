'use client'

import { Photo } from '@/lib/apiClient'
import { useState } from 'react'
import { vibrate } from '@/lib/helpers'

interface MobilePhotoCardProps {
  photo: Photo
  onDelete: (id: string) => void
}

export default function MobilePhotoCard({ photo, onDelete }: MobilePhotoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Supprimer cette photo ?')) return
    
    vibrate(20)
    setIsDeleting(true)
    try {
      await onDelete(photo.id)
    } catch (error) {
      console.error('Delete failed:', error)
      setIsDeleting(false)
    }
  }

  const itemCount = photo.items?.length || 0

  return (
    <div className="relative bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        <img
          src={photo.url}
          alt={photo.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Room type badge */}
        {photo.roomType && (
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-900 shadow-sm">
            {photo.roomType}
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform disabled:opacity-50"
        >
          {isDeleting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {itemCount} {itemCount > 1 ? 'objets détectés' : 'objet détecté'}
          </span>
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-xs text-primary font-medium"
          >
            {showActions ? 'Masquer' : 'Voir détails'}
          </button>
        </div>

        {/* Items list */}
        {showActions && photo.items && photo.items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            {photo.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-500 text-xs">
                  {item.volume.toFixed(2)} m³
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

