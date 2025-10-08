"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PhotoData, RoomGroup } from '@core/roomValidation';

interface PhotoThumbnailProps {
  photo: PhotoData;
  onMove: (toGroupId: string) => void;
  availableGroups: RoomGroup[];
  className?: string;
}

export function PhotoThumbnail({ 
  photo, 
  onMove, 
  availableGroups,
  className = "" 
}: PhotoThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const handleMove = (toGroupId: string) => {
    onMove(toGroupId);
    setShowMoveMenu(false);
  };

  return (
    <div
      className={`photo-thumbnail relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <img
        src={photo.fileUrl || URL.createObjectURL(photo.file)}
        alt={photo.filename || 'Photo'}
        className="w-full h-full object-cover"
      />

      {/* Overlay au survol */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="px-3 py-1 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            📤 Déplacer
          </button>
          
          {photo.roomConfidence && (
            <div className={`text-xs px-2 py-1 rounded ${
              photo.roomConfidence > 0.8 ? 'bg-green-500' : 
              photo.roomConfidence > 0.6 ? 'bg-orange-500' : 'bg-red-500'
            } text-white`}>
              {Math.round(photo.roomConfidence * 100)}%
            </div>
          )}
        </div>
      </motion.div>

      {/* Menu de déplacement */}
      {showMoveMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">Déplacer vers :</div>
            {availableGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleMove(group.id)}
                className="w-full flex items-center space-x-2 px-2 py-2 text-left rounded hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm">
                  {group.roomType === 'salon' ? '🛋️' :
                   group.roomType === 'cuisine' ? '🍳' :
                   group.roomType === 'chambre' ? '🛏️' :
                   group.roomType === 'salle-de-bain' ? '🚿' :
                   group.roomType === 'bureau' ? '💻' :
                   group.roomType === 'garage' ? '🚗' :
                   group.roomType === 'jardin' ? '🌳' :
                   group.roomType === 'salle-a-manger' ? '🍽️' :
                   group.roomType === 'couloir' ? '🚪' :
                   group.roomType === 'dressing' ? '👗' : '🏠'}
                </span>
                <span className="text-sm font-medium capitalize">
                  {group.roomType.replace('-', ' ')}
                </span>
                <span className="text-xs text-gray-500">
                  ({group.photos.length})
                </span>
              </button>
            ))}
            <button
              onClick={() => setShowMoveMenu(false)}
              className="w-full px-2 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded transition-colors"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      )}

      {/* Indicateur de statut */}
      {photo.status === 'processing' && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {photo.status === 'error' && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      )}

      {/* Nom du fichier (optionnel) */}
      {photo.filename && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate">
          {photo.filename}
        </div>
      )}
    </div>
  );
}

