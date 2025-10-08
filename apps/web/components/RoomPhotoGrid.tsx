"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoData } from '@/lib/roomValidation';

interface RoomPhotoGridProps {
  photos: PhotoData[];
  roomType: string;
  className?: string;
  maxHeight?: string;
}

export function RoomPhotoGrid({ 
  photos, 
  roomType, 
  className = "",
  maxHeight = "100%"
}: RoomPhotoGridProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📷</div>
          <p>Aucune photo disponible</p>
        </div>
      </div>
    );
  }

  // Calculer le nombre de colonnes optimal selon le nombre de photos
  const getGridColumns = (photoCount: number) => {
    if (photoCount <= 2) return 'grid-cols-1';
    if (photoCount <= 4) return 'grid-cols-2';
    if (photoCount <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const gridCols = getGridColumns(photos.length);

  return (
    <div className={`${className}`} style={{ maxHeight }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-medium text-gray-800">Photos de la pièce</h4>
        <span className="text-sm text-gray-500">
          {photos.length} photo{photos.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grille de photos avec scroll vertical */}
      <div 
        className="overflow-y-auto pr-2"
        style={{ maxHeight: maxHeight === "100%" ? "calc(100vh - 300px)" : maxHeight }}
      >
        <div className={`grid ${gridCols} gap-3`}>
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              className="relative group cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                setCurrentPhotoIndex(index);
                setIsFullscreen(true);
              }}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1} - ${roomType}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              {/* Overlay avec numéro de photo */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
              </div>

              {/* Indicateur si la photo a été analysée */}
              {photo.analysis?.items?.length > 0 && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Analysée
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal plein écran */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFullscreen(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh] p-4">
              {/* Photo principale */}
              <motion.img
                key={currentPhotoIndex}
                src={photos[currentPhotoIndex].url}
                alt={`Photo ${currentPhotoIndex + 1} - ${roomType}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              />

              {/* Navigation */}
              {photos.length > 1 && (
                <>
                  {/* Bouton précédent */}
                  {currentPhotoIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(currentPhotoIndex - 1);
                      }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Bouton suivant */}
                  {currentPhotoIndex < photos.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(currentPhotoIndex + 1);
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Indicateurs */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPhotoIndex(index);
                        }}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === currentPhotoIndex 
                            ? 'bg-white' 
                            : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Compteur */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    Photo {currentPhotoIndex + 1} sur {photos.length}
                  </div>
                </>
              )}

              {/* Bouton fermer */}
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
