"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { RoomGroup, PhotoData, ROOM_TYPES } from '@/lib/roomValidation';
import { RoomPhotoCarousel } from './RoomPhotoCarousel';
import { InventoryItemCard } from './InventoryItemCard';

interface RoomInventoryCardProps {
  roomGroup: RoomGroup;
  onRoomTypeChange?: (newRoomType: string) => void;
  className?: string;
}

export function RoomInventoryCard({ 
  roomGroup, 
  onRoomTypeChange,
  className = "" 
}: RoomInventoryCardProps) {
  const roomTypeInfo = ROOM_TYPES.find(t => t.value === roomGroup.roomType);
  
  // Calculer l'inventaire total de la pièce
  const allItems = roomGroup.photos.flatMap(photo => photo.analysis?.items || []);
  const totalVolume = allItems.reduce((sum, item) => sum + (item.volume_m3 || 0), 0);
  const totalPackagedVolume = allItems.reduce((sum, item) => sum + (item.packaged_volume_m3 || 0), 0);
  
  // Grouper les objets par catégorie
  const itemsByCategory = allItems.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <motion.div
      className={`room-inventory-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* En-tête de la pièce */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {roomTypeInfo?.icon || '🏠'}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {roomTypeInfo?.label || 'Pièce inconnue'}
              </h3>
              <p className="text-sm text-gray-600">
                {roomGroup.photos.length} photo{roomGroup.photos.length > 1 ? 's' : ''} • 
                {allItems.length} objet{allItems.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {onRoomTypeChange && (
            <select
              value={roomGroup.roomType}
              onChange={(e) => onRoomTypeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROOM_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Carrousel de photos */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-3">Photos de la pièce</h4>
          <RoomPhotoCarousel
            photos={roomGroup.photos}
            roomType={roomGroup.roomType}
            className="max-w-md mx-auto"
          />
        </div>

        {/* Résumé de l'inventaire */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-medium text-gray-800 mb-3">Résumé de l'inventaire</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allItems.length}</div>
              <div className="text-sm text-gray-600">Objets détectés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalVolume.toFixed(2)} m³</div>
              <div className="text-sm text-gray-600">Volume brut</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalPackagedVolume.toFixed(2)} m³</div>
              <div className="text-sm text-gray-600">Volume emballé</div>
            </div>
          </div>
        </div>

        {/* Inventaire détaillé par catégorie */}
        {Object.keys(itemsByCategory).length > 0 ? (
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-4">Inventaire détaillé</h4>
            <div className="space-y-4">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-700 mb-3 capitalize">
                    {category === 'furniture' ? 'Mobilier' :
                     category === 'electronics' ? 'Électronique' :
                     category === 'decoration' ? 'Décoration' :
                     category === 'other' ? 'Autres' : category} 
                    ({items.length})
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item, index) => (
                      <InventoryItemCard
                        key={`${item.label}-${index}`}
                        item={item}
                        isSelected={false}
                        onToggleSelection={() => {}}
                        showSelection={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <p>Aucun objet détecté dans cette pièce</p>
            <p className="text-sm">Les objets seront analysés après validation des pièces</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
