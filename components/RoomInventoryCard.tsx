'use client';
import React, { useMemo, useState } from 'react';
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
  // Détails supplémentaires
  dimensions_cm?: {
    length: number;
    width: number;
    height: number;
    source?: string;
  };
  packaged_volume_m3?: number;
  packaging_display?: string;
  notes?: string;
  confidence?: number;
  stackable?: boolean;
  is_small_object?: boolean;
  packaging_calculation_details?: string;
  quantity?: number;
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
  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);
  const roomTypeInfo = ROOM_TYPES.find(t => t.value === roomGroup.roomType);
  
  const toggleDetails = (index: number) => {
    setExpandedItemIndex(expandedItemIndex === index ? null : index);
  };
  
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
      <div className="bg-gradient-to-r from-brand-soft/10 to-brand-accent/10 px-6 py-4 border-b border-gray-200">
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
              <div className="grid grid-cols-[3fr_1.5fr_70px_70px_90px_80px] gap-2 px-4 py-3 bg-gray-100 border-b border-gray-300 font-semibold text-xs text-gray-700">
                <div>Article</div>
                <div className="text-right">Volume</div>
                <div className="text-center">Dém.</div>
                <div className="text-center">Frag.</div>
                <div className="text-center">Déménager</div>
                <div className="text-center">+</div>
              </div>
              
              {/* Lignes des articles */}
              <div className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <React.Fragment key={`${getItemName(item)}-${index}`}>
                    <div className="grid grid-cols-[3fr_1.5fr_70px_70px_90px_80px] gap-2 px-4 py-2.5 items-center hover:bg-gray-50 transition-colors">
                      {/* Article */}
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-900 truncate">{getItemName(item)}</span>
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-xs text-gray-500">Qté: {item.quantity}</span>
                        )}
                      </div>
                      
                      {/* Volume */}
                      <div className="text-right">
                        <div className="text-sm text-gray-900 font-medium">
                          {getItemVolume(item).toFixed(3)} m³
                        </div>
                        {item.packaged_volume_m3 && (
                          <div className="text-xs text-brand-accent">Emb: {item.packaged_volume_m3.toFixed(3)}</div>
                        )}
                      </div>
                      
                      {/* Démontable */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            if (onItemUpdate) {
                              onItemUpdate(index, { dismountable: !item.dismountable });
                            }
                          }}
                          className={`w-8 h-8 rounded-full text-sm font-bold transition-all flex items-center justify-center ${
                            item.dismountable
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={item.dismountable ? 'Démontable' : 'Non démontable'}
                        >
                          {item.dismountable ? '✓' : '✗'}
                        </button>
                      </div>
                      
                      {/* Fragile */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            if (onItemUpdate) {
                              onItemUpdate(index, { fragile: !item.fragile });
                            }
                          }}
                          className={`w-8 h-8 rounded-full text-sm font-bold transition-all flex items-center justify-center ${
                            item.fragile
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={item.fragile ? 'Fragile' : 'Non fragile'}
                        >
                          {item.fragile ? '✓' : '✗'}
                        </button>
                      </div>
                      
                      {/* À déménager */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            if (onItemUpdate) {
                              onItemUpdate(index, { selected: !(item.selected !== false) });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                            item.selected !== false
                              ? 'bg-brand-accent text-white hover:brightness-110'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={item.selected !== false ? 'À déménager' : 'Ne pas déménager'}
                        >
                          {item.selected !== false ? '✓ OUI' : '✗ NON'}
                        </button>
                      </div>
                      
                      {/* Détails */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleDetails(index)}
                          className="w-8 h-8 rounded-full text-sm font-medium text-brand-accent hover:text-brand-primary hover:bg-brand-soft/20 transition-all flex items-center justify-center"
                          title={expandedItemIndex === index ? 'Masquer les détails' : 'Voir les détails'}
                        >
                          {expandedItemIndex === index ? '−' : 'ℹ️'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Ligne étendue avec détails */}
                    {expandedItemIndex === index && (
                      <div className="px-4 py-4 bg-brand-soft/10 border-t border-brand-soft/30">
                        <div className="text-sm space-y-3">
                          <h5 className="font-semibold text-gray-900 mb-3">
                            📏 Détails complets - {getItemName(item)}
                          </h5>
                          
                          {item.dimensions_cm && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium text-gray-700">Dimensions :</span>
                                <div className="text-gray-600 mt-1">
                                  {item.dimensions_cm.length} × {item.dimensions_cm.width} × {item.dimensions_cm.height} cm
                                  {item.dimensions_cm.source && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      (source: {item.dimensions_cm.source})
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <span className="font-medium text-gray-700">Volume :</span>
                                <div className="text-gray-600 mt-1">
                                  {item.volume_m3 !== undefined && (
                                    <div>Original : {item.volume_m3.toFixed(3)} m³</div>
                                  )}
                                  {item.packaged_volume_m3 !== undefined && (
                                    <div>Emballé : {item.packaged_volume_m3.toFixed(3)} m³</div>
                                  )}
                                  {item.packaging_display && (
                                    <div className="text-brand-accent font-medium">{item.packaging_display}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            {item.confidence !== undefined && (
                              <div>
                                <span className="font-medium text-gray-700">Confiance IA :</span>
                                <span className="text-gray-600 ml-2">{(item.confidence * 100).toFixed(0)}%</span>
                              </div>
                            )}
                            
                            {item.stackable !== undefined && (
                              <div>
                                <span className="font-medium text-gray-700">Empilable :</span>
                                <span className="text-gray-600 ml-2">{item.stackable ? 'Oui ✓' : 'Non ✗'}</span>
                              </div>
                            )}
                            
                            {item.quantity !== undefined && item.quantity > 1 && (
                              <div>
                                <span className="font-medium text-gray-700">Quantité :</span>
                                <span className="text-gray-600 ml-2">{item.quantity}</span>
                              </div>
                            )}
                          </div>
                          
                          {item.notes && (
                            <div className="mt-3">
                              <span className="font-medium text-gray-700">Notes :</span>
                              <div className="text-gray-600 mt-1 italic">{item.notes}</div>
                            </div>
                          )}
                          
                          {item.packaging_calculation_details && (
                            <div className="mt-3">
                              <details className="cursor-pointer">
                                <summary className="font-medium text-gray-700 hover:text-gray-900">
                                  📦 Détails du calcul d'emballage
                                </summary>
                                <pre className="mt-2 text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                                  {item.packaging_calculation_details}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
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
