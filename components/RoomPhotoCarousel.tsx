"use client";
import React, { useState } from 'react';
import { PhotoData } from '@core/roomValidation';

interface RoomPhotoCarouselProps {
  photos: PhotoData[];
  roomType: string;
  className?: string;
}

export function RoomPhotoCarousel({ 
  photos, 
  roomType, 
  className = "" 
}: RoomPhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="text-4xl mb-2">📷</div>
        <p>Aucune photo dans cette pièce</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
        <img
          src={currentPhoto.fileUrl || (currentPhoto.file ? URL.createObjectURL(currentPhoto.file) : '/placeholder-image.svg')}
          alt={`Photo ${currentIndex + 1} de ${roomType}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('❌ Erreur chargement image:', currentPhoto.fileUrl);
            e.currentTarget.src = '/placeholder-image.svg';
          }}
        />
        
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {photos.length > 1 && (
        <div className="flex justify-center mt-3 space-x-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
      
      <div className="text-center mt-2 text-sm text-gray-600">
        Photo {currentIndex + 1} sur {photos.length}
      </div>
    </div>
  );
}
