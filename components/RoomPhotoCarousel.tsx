"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoData } from '@/lib/roomValidation';

interface RoomPhotoCarouselProps {
  photos: PhotoData[];
  roomType: string;
  className?: string;
}

export function RoomPhotoCarousel({ photos, roomType, className = "" }: RoomPhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  if (photos.length === 0) {
    return (
      <div className={`room-photo-carousel ${className}`}>
        <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
          <p className="text-gray-500">Aucune photo</p>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className={`room-photo-carousel relative ${className}`}>
      {/* Photo principale */}
      <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <img
          src={currentPhoto.fileUrl || URL.createObjectURL(currentPhoto.file)}
          alt={`Photo ${currentIndex + 1} de ${roomType}`}
          className="w-full aspect-square object-cover"
        />
        
        {/* Indicateur de position */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Navigation */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Miniatures */}
      {photos.length > 1 && (
        <div className="mt-3 flex space-x-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => goToPhoto(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={photo.fileUrl || URL.createObjectURL(photo.file)}
                alt={`Miniature ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Indicateurs de navigation (points) */}
      {photos.length > 1 && (
        <div className="flex justify-center mt-3 space-x-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToPhoto(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
