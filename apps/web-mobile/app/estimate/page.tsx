'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import MobileLoader from '@/components/MobileLoader'
import { apiClient, Estimate } from '@/lib/apiClient'
import { formatVolume, formatPrice } from '@/lib/helpers'

export default function EstimatePage() {
  const router = useRouter()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEstimate()
  }, [])

  const loadEstimate = async () => {
    try {
      const data = await apiClient.getEstimate()
      setEstimate(data)
    } catch (error) {
      console.error('Failed to load estimate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Estimation" />
        <MobileLoader message="Calcul de votre devis..." />
        <MobileBottomNav />
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Estimation" />
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-6xl mb-4">🧮</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune estimation disponible
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Ajoutez des photos et générez votre inventaire
          </p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium"
          >
            Commencer
          </button>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MobileHeader
        title="Votre devis"
        subtitle="Estimation gratuite et sans engagement"
      />

      <div className="p-4 space-y-4">
        {/* Price card */}
        <div className="bg-gradient-to-br from-secondary to-green-600 rounded-2xl p-6 text-white shadow-2xl">
          <div className="text-center">
            <div className="text-sm text-green-100 mb-2">Prix estimé</div>
            <div className="text-5xl font-bold mb-2">
              {formatPrice(estimate.estimatedPrice)}
            </div>
            <div className="text-green-100 text-sm">
              Estimation basée sur {estimate.itemCount} objet{estimate.itemCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {estimate.itemCount}
            </div>
            <div className="text-sm text-gray-600">objets</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatVolume(estimate.totalVolume)}
            </div>
            <div className="text-sm text-gray-600">volume total</div>
          </div>
        </div>

        {/* Rooms breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Détail par pièce</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {estimate.rooms.map((room, idx) => {
              const roomVolume = room.items.reduce((sum, item) => sum + (item.volume * item.quantity), 0)
              
              return (
                <div key={idx} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{room.roomType}</div>
                    <div className="text-sm text-gray-600">{formatVolume(roomVolume)}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {room.items.length} objet{room.items.length > 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <div className="font-medium text-gray-900 mb-1">
                Cette estimation est indicative
              </div>
              <div className="text-sm text-gray-600">
                Le prix final sera déterminé après visite sur place et prise en compte de tous les paramètres (distance, étage, accès, etc.)
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Inclus dans le devis</h3>
          
          {[
            'Déménageurs professionnels',
            'Camion adapté au volume',
            'Protection des meubles',
            'Assurance tous risques',
            'Manutention complète',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 safe-bottom bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-8">
        <button
          onClick={() => router.push('/quote')}
          className="w-full bg-accent text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-xl active:scale-95 transition-transform"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Demander un devis personnalisé
          </span>
        </button>
      </div>

      <MobileBottomNav />
    </div>
  )
}

