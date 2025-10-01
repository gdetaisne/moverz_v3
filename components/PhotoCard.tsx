"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface PhotoData {
  file: File;
  fileUrl?: string;
  analysis?: unknown;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  error?: string;
  selectedItems: Set<number>;
  photoId?: string;
  progress?: number;
  roomName?: string;
}

interface PhotoCardProps {
  photo: PhotoData;
  index: number;
  onRoomNameChange: (photoId: string, name: string) => void;
  className?: string;
}

export function PhotoCard({ photo, index, onRoomNameChange, className = "" }: PhotoCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'processing': return 'En cours...';
      case 'error': return 'Erreur';
      default: return 'Chargé';
    }
  };

  return (
    <motion.div
      className={`relative bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {photo.fileUrl ? (
          <img 
            src={photo.fileUrl} 
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-4xl">🖼️</div>
        )}
      </div>
      
      <div className="p-4">
        <input
          type="text"
          value={photo.roomName || ''}
          onChange={(e) => onRoomNameChange(photo.photoId || '', e.target.value)}
          placeholder="Nom de la pièce"
          className="w-full text-sm font-medium border-none outline-none bg-transparent"
        />
        
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(photo.status)}`}>
            {getStatusText(photo.status)}
          </span>
          
          {photo.progress !== undefined && (
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${photo.progress}%` }}
              />
            </div>
          )}
        </div>

        {photo.error && (
          <div className="mt-2 text-xs text-red-600">
            {photo.error}
          </div>
        )}
      </div>
    </motion.div>
  );
}
