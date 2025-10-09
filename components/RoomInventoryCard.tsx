'use client';
import React, { useMemo } from 'react';
import { RoomGroup, ROOM_TYPES } from '@core/roomValidation';
import RoomPhotoGrid from './RoomPhotoGrid';
import { InventoryItemInline } from './InventoryItemInline';

interface RoomInventoryCardProps {
  roomGroup: RoomGroup;
  onRoomTypeChange?: (newRoomType: string) => void;
  onItemUpdate?: (itemIndex: number, updates: any) => void;
  className?: string;
}

type Item = {
  name?: string;
  label?: string;
  category?: string;
  volume_m3?: number;
  volume?: number;
  fragile?: boolean;
  dismountable?: boolean;
  selected?: boolean;
};

function getItems(analysis: any): Item[] {
  if (!analysis) return [];
  // Accept both shapes: analysis.items (array) or raw array
  if (Array.isArray(analysis)) return analysis as Item[];
  if (Array.isArray(analysis?.items)) return analysis.items as Item[];
  return [];
}

function getItemName(it: Item) {
  return it.name || it.label || 'Objet';
}

function getItemVolume(it: Item) {
  const v = typeof it.volume_m3 === 'number' ? it.volume_m3 : (typeof it.volume === 'number' ? it.volume : 0);
  return Number.isFinite(v) ? v : 0;
}

export function RoomInventoryCard({ 
  roomGroup, 
  onRoomTypeChange,
  onItemUpdate,
  className = "" 
}: RoomInventoryCardProps) {
  const roomTypeInfo = ROOM_TYPES.find(t => t.value === roomGroup.roomType);
  
  // Calculer l'inventaire total de la pièce
  const { items, totalVolume } = useMemo(() => {
    // ✅ NOUVEAU : Lire uniquement la photo avec _isGroupAnalysis pour éviter les doublons
    // L'API /api/photos/analyze-by-room stocke l'analyse groupée sur la première photo seulement
    const groupAnalysisPhoto = roomGroup.photos?.find(p => p?.analysis?._isGroupAnalysis === true);
    const photoWithAnalysis = groupAnalysisPhoto || roomGroup.photos?.[0]; // Fallback sur première photo si pas de flag
    
    const all: Item[] = photoWithAnalysis ? getItems(photoWithAnalysis.analysis) : [];
    const vol = all.reduce((acc, it) => acc + getItemVolume(it), 0);
    return { items: all, totalVolume: vol };
  }, [roomGroup.photos]);

  return (
    <div className={`room-inventory-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
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
                {items.length} objet{items.length > 1 ? 's' : ''}
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
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Colonne gauche: Photos */}
        <div className="lg:w-1/3">
          <RoomPhotoGrid photos={roomGroup.photos} />
          
          {/* Résumé compact */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 space-y-1">
              <div><span className="font-medium">{items.length}</span> Objets détectés</div>
              <div><span className="font-medium">{totalVolume.toFixed(2)} m³</span> Volume total</div>
            </div>
          </div>
        </div>

        {/* Colonne droite: Inventaire */}
        <div className="lg:w-2/3">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Inventaire détaillé</h4>

          {items.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* En-tête du tableau */}
              <div className="grid grid-cols-[2fr_1fr_120px_120px_120px] gap-3 px-4 py-3 bg-gray-100 border-b border-gray-300 font-semibold text-sm text-gray-700">
                <div>Article</div>
                <div className="text-right">Volume</div>
                <div className="text-center">Démontable</div>
                <div className="text-center">Fragile</div>
                <div className="text-center">À déménager</div>
              </div>
              
              {/* Lignes des articles */}
              <div className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <InventoryItemInline
                    key={`${getItemName(item)}-${index}`}
                    item={{
                      ...item,
                      label: getItemName(item),
                      photoId: roomGroup.photos[0]?.id || '',
                      itemIndex: index
                    }}
                    isSelected={item.selected !== false}
                    onToggle={(photoId, itemIndex) => {
                      console.log('🖱️ Toggle cliqué:', { photoId, itemIndex });
                      if (onItemUpdate) {
                        onItemUpdate(index, { selected: !(item.selected !== false) });
                      } else {
                        console.log('❌ onItemUpdate non défini');
                      }
                    }}
                    onDismountableToggle={(photoId, itemIndex, isDismountable) => {
                      console.log('🖱️ Démontable cliqué:', { photoId, itemIndex, isDismountable });
                      if (onItemUpdate) {
                        onItemUpdate(index, { dismountable: isDismountable });
                      } else {
                        console.log('❌ onItemUpdate non défini');
                      }
                    }}
                    onFragileToggle={(photoId, itemIndex, isFragile) => {
                      console.log('🖱️ Fragile cliqué:', { photoId, itemIndex, isFragile });
                      if (onItemUpdate) {
                        onItemUpdate(index, { fragile: isFragile });
                      } else {
                        console.log('❌ onItemUpdate non défini');
                      }
                    }}
                  />
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
      </div>
    </div>
  );
}
