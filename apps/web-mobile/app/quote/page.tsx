'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import { vibrate } from '@/lib/helpers'

export default function QuotePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    fromAddress: '',
    toAddress: '',
    moveDate: '',
    comments: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    vibrate(20)
    setIsSubmitting(true)

    try {
      // TODO: Call API to submit quote request
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setIsSubmitted(true)
      vibrate(50)
    } catch (error) {
      console.error('Submit failed:', error)
      alert('Erreur lors de l\'envoi')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Demande envoyée" />
        
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Demande envoyée !
          </h2>
          
          <p className="text-gray-600 text-center mb-8 max-w-md">
            Nous avons bien reçu votre demande de devis. Un conseiller vous contactera dans les plus brefs délais.
          </p>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 w-full max-w-md mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Confirmation par email</div>
                  <div className="text-sm text-gray-600">Vous recevrez un récapitulatif sous quelques minutes</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Appel de notre équipe</div>
                  <div className="text-sm text-gray-600">Un conseiller vous contactera sous 24h</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Devis personnalisé</div>
                  <div className="text-sm text-gray-600">Vous recevrez votre devis détaillé</div>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/upload')}
            className="w-full max-w-md bg-primary text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg active:scale-95 transition-transform"
          >
            Retour à l'accueil
          </button>
        </div>
        
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MobileHeader
        title="Demande de devis"
        subtitle="Gratuit et sans engagement"
        showBack
        onBack={() => router.back()}
      />

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Personal info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Vos coordonnées</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Jean Dupont"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="jean.dupont@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="06 12 34 56 78"
              required
            />
          </div>
        </div>

        {/* Move details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Détails du déménagement</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse de départ
            </label>
            <input
              type="text"
              value={formData.fromAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, fromAddress: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="123 Rue de la Paix, Paris"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse d'arrivée
            </label>
            <input
              type="text"
              value={formData.toAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, toAddress: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="456 Avenue de la République, Lyon"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date souhaitée
            </label>
            <input
              type="date"
              value={formData.moveDate}
              onChange={(e) => setFormData(prev => ({ ...prev, moveDate: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaires
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Informations complémentaires (étage, ascenseur, parking, etc.)"
            />
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="text-xl">💡</div>
            <div className="text-sm text-gray-700">
              Un conseiller vous contactera rapidement pour affiner votre devis et organiser une visite si nécessaire.
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 safe-bottom bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-secondary text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Envoi en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Envoyer ma demande
              </span>
            )}
          </button>
        </div>
      </form>

      <MobileBottomNav />
    </div>
  )
}

