"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { RoomGroup, PhotoData, ROOM_TYPES } from '@/lib/roomValidation';
import { RoomPhotoGrid } from './RoomPhotoGrid';
import { InventoryItemInline } from './InventoryItemInline';

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
  const allItems = roomGroup.photos.flatMap(photo => {
    console.log(`🔍 Photo ${photo.id} analysis:`, {
      hasAnalysis: !!photo.analysis,
      hasItems: !!(photo.analysis?.items),
      itemsLength: photo.analysis?.items?.length || 0,
      analysisKeys: photo.analysis ? Object.keys(photo.analysis) : []
    });
    
    // Vérifier que l'analyse existe et a des items
    if (photo.analysis && photo.analysis.items && Array.isArray(photo.analysis.items)) {
      console.log(`✅ Photo ${photo.id} a ${photo.analysis.items.length} objets`);
      return photo.analysis.items;
    } else {
      console.log(`❌ Photo ${photo.id} n'a pas d'objets dans l'analyse`);
      return [];
    }
  });
  const totalVolume = allItems.reduce((sum, item) => sum + (item.volume_m3 || 0), 0);
  const totalPackagedVolume = allItems.reduce((sum, item) => sum + (item.packaged_volume_m3 || 0), 0);
  
  // Debug: vérifier les données
  console.log(`🔍 [RoomInventoryCard] ${roomGroup.roomType}:`, {
    photosCount: roomGroup.photos.length,
    itemsCount: allItems.length,
    totalVolume,
    totalPackagedVolume,
    photosWithAnalysis: roomGroup.photos.filter(p => p.analysis?.items?.length > 0).length
  });
  
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

      {/* Layout: Photos à gauche, Inventaire à droite */}
      <div className="flex flex-col lg:flex-row gap-6 p-6 h-full">
        {/* Colonne gauche: Photos - Prend toute la hauteur disponible */}
        <div className="lg:w-1/3 flex flex-col">
          <RoomPhotoGrid
            photos={roomGroup.photos}
            roomType={roomGroup.roomType}
            className="flex-1"
            maxHeight="100%"
          />
          
          {/* Résumé compact - Toujours en bas */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex-shrink-0">
            <div className="text-sm text-gray-600 space-y-1">
              <div><span className="font-medium">{allItems.length}</span> Objets détectés</div>
              <div><span className="font-medium">{totalVolume.toFixed(2)} m³</span> Volume brut</div>
              <div><span className="font-medium">{totalPackagedVolume.toFixed(2)} m³</span> Volume emballé</div>
            </div>
          </div>
        </div>

        {/* Colonne droite: Inventaire en lignes - Prend toute la hauteur */}
        <div className="lg:w-2/3 flex flex-col">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Inventaire détaillé</h4>

          {Object.keys(itemsByCategory).length > 0 ? (
            <div className="space-y-4 flex-1 overflow-y-auto">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h5 className="font-medium text-gray-700 capitalize">
                      {category === 'furniture' ? 'Mobilier' :
                       category === 'electronics' ? 'Électronique' :
                       category === 'decoration' ? 'Décoration' :
                       category === 'art' ? 'Art' :
                       category === 'box' ? 'Boîtes' :
                       category === 'appliance' ? 'Électroménager' :
                       category === 'misc' ? 'Divers' :
                       category === 'other' ? 'Autres' : category} 
                      ({items.length})
                    </h5>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map((item, index) => (
                      <InventoryItemInline
                        key={`${item.label}-${index}`}
                        item={{
                          ...item,
                          photoId: roomGroup.photos[0]?.id || '',
                          itemIndex: index
                        }}
                        isSelected={false}
                        onToggle={() => {}}
                        onDismountableToggle={() => {}}
                        onFragileToggle={() => {}}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📦</div>
              <p>Aucun objet détecté dans cette pièce</p>
              <p className="text-sm">Les objets seront analysés après validation des pièces</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

