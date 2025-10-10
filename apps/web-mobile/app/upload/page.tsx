'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import MobileBottomNav from '@/components/MobileBottomNav'
import MobileUploadZone from '@/components/MobileUploadZone'
import MobilePhotoCard from '@/components/MobilePhotoCard'
import MobileLoader from '@/components/MobileLoader'
import { apiClient, Photo } from '@/lib/apiClient'
import { compressImage } from '@/lib/helpers'

export default function UploadPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const data = await apiClient.getPhotos()
      setPhotos(data)
    } catch (error) {
      console.error('Failed to load photos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (files: File[]) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const totalFiles = files.length
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Compress image
        const compressed = await compressImage(file)
        
        // Upload
        const photo = await apiClient.uploadPhoto(compressed)
        setPhotos(prev => [...prev, photo])
        
        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 100)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Erreur lors de l\'envoi des photos')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deletePhoto(id)
      setPhotos(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      alert('Ajoutez au moins une photo')
      return
    }

    setIsAnalyzing(true)
    try {
      await apiClient.analyzePhotos()
      alert('✅ Analyse terminée !')
      await loadPhotos()
      router.push('/inventory')
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Erreur lors de l\'analyse')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title="Mes photos"
        subtitle={`${photos.length} photo${photos.length > 1 ? 's' : ''}`}
      />

      <div className="pb-4">
        {isLoading ? (
          <MobileLoader message="Chargement des photos..." />
        ) : (
          <>
            {/* Upload zone */}
            <MobileUploadZone
              onUpload={handleUpload}
              isUploading={isUploading}
            />

            {/* Upload progress */}
            {isUploading && (
              <div className="px-4 py-2">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Envoi en cours...
                    </span>
                    <span className="text-sm text-gray-600">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Photos grid */}
            {photos.length > 0 && (
              <div className="px-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Photos envoyées
                  </h2>
                </div>
                
                <div className="grid gap-4">
                  {photos.map(photo => (
                    <MobilePhotoCard
                      key={photo.id}
                      photo={photo}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Analyze button */}
            {photos.length > 0 && (
              <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 safe-bottom bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-8">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-secondary text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Analyse en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Analyser mes photos ({photos.length})
                    </span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <MobileBottomNav />
    </div>
  )
}

