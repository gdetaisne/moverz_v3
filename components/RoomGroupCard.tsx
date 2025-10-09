"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RoomGroup, PhotoData, ROOM_TYPES } from '@core/roomValidation';
import { PhotoThumbnail } from './PhotoThumbnail';
import { RoomTypeSelector } from './RoomTypeSelector';

interface RoomGroupCardProps {
  group: RoomGroup;
  onRoomTypeChange: (newRoomType: string) => void;
  onPhotoMove: (photoId: string, toGroupId: string) => void;
  availableGroups: RoomGroup[];
  className?: string;
}

export function RoomGroupCard({ 
  group, 
  onRoomTypeChange, 
  onPhotoMove,
  availableGroups,
  className = "" 
}: RoomGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const roomTypeInfo = ROOM_TYPES.find(t => t.value === group.roomType);
  const hasSuggestions = group.suggestions && group.suggestions.length > 0;
  const isUncertain = group.confidence < 0.7;

  return (
    <motion.div
      className={`room-group-card bg-white border rounded-lg shadow-sm overflow-hidden ${
        isUncertain ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
      } ${className}`}
      whileHover={{ shadow: '0 4px 12px rgba(0,0,0,0.1)' }}
    >
      {/* En-tête du groupe */}
      <div className="room-group-header p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {roomTypeInfo?.icon || '🏠'}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <RoomTypeSelector
                  value={group.roomType}
                  onChange={onRoomTypeChange}
                  isEditing={isEditing}
                  onToggleEdit={() => setIsEditing(!isEditing)}
                />
                
                {group.isUserValidated && (
                  <span className="text-green-600 text-sm">✓ Validé</span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center">
                  📸 {group.photos.length} photo{group.photos.length > 1 ? 's' : ''}
                </span>
                <span className={`flex items-center ${
                  group.confidence > 0.8 ? 'text-green-600' : 
                  group.confidence > 0.6 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  🎯 Confiance: {Math.round(group.confidence * 100)}%
                </span>
                <span className="text-gray-500">
                  Modifié: {group.lastModified.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasSuggestions && (
              <div className="relative">
                <button className="text-yellow-600 hover:text-yellow-700">
                  ⚠️ {group.suggestions!.length}
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                  <div className="p-3">
                    <h4 className="font-medium text-gray-800 mb-2">Suggestions :</h4>
                    {group.suggestions!.map((suggestion, index) => (
                      <p key={index} className="text-sm text-gray-600 mb-1">
                        • {suggestion.message}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenu du groupe */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="p-4"
        >
          {/* Description de la pièce */}
          {roomTypeInfo && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{roomTypeInfo.label} :</strong> {roomTypeInfo.description}
              </p>
              {roomTypeInfo.keywords.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Mots-clés : {roomTypeInfo.keywords.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Grille des photos */}
          <div className="photos-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {group.photos.map((photo, index) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onMove={(toGroupId) => onPhotoMove(photo.id, toGroupId)}
                availableGroups={availableGroups.filter(g => g.id !== group.id)}
              />
            ))}
          </div>

          {/* Actions rapides */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onRoomTypeChange('autre')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              🏠 Marquer comme "Autre"
            </button>
            
            {group.photos.length > 1 && (
              <button
                onClick={() => {
                  // Logique pour diviser le groupe
                  console.log('Diviser le groupe:', group.id);
                }}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              >
                ✂️ Diviser le groupe
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

