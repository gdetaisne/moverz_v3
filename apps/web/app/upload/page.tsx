/**
 * 📤 Upload page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UploadZone } from '../../components/UploadZone';
import { Stepper } from '../../components/Stepper';
import { Loader } from '../../components/Loader';
import { useUpload } from '../../hooks/useUpload';

export default function UploadPage() {
  const router = useRouter();
  const { photos, analyzing, error, addPhotos, removePhoto, analyzePhotos } = useUpload();
  const [showPreview, setShowPreview] = useState(true);

  const handleAnalyze = async () => {
    try {
      const batchId = await analyzePhotos();
      // Store batchId in localStorage for next pages
      if (batchId) {
        localStorage.setItem('currentBatchId', batchId);
      }
      router.push('/inventory');
    } catch (err) {
      // Error already handled by useUpload
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Stepper />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Importez vos photos
            </h1>
            <p className="text-gray-600 mb-8">
              Ajoutez des photos de vos pièces et objets à déménager
            </p>

            {/* Upload zone */}
            {photos.length === 0 ? (
              <UploadZone onFilesSelected={addPhotos} />
            ) : (
              <div className="space-y-6">
                {/* Thumbnails */}
                {showPreview && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={photo.url}
                          alt="Preview"
                          className="w-full h-32 object-cover"
                        />
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {photo.status === 'completed' && (
                          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {showPreview ? 'Masquer' : 'Afficher'} les aperçus
                  </button>
                  <span className="text-sm text-gray-500">
                    {photos.length} photo{photos.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Analyze button */}
                {analyzing ? (
                  <div className="py-8">
                    <Loader size="lg" text="Analyse en cours..." />
                  </div>
                ) : (
                  <button
                    onClick={handleAnalyze}
                    disabled={photos.length === 0}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors"
                  >
                    Analyser avec l'IA →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



