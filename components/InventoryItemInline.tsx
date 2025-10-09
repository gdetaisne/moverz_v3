"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ItemDetailsModal } from './ItemDetailsModal';
import { TInventoryItem } from '@core/schemas';

interface InventoryItemInlineProps {
  item: TInventoryItem & { photoId: string; itemIndex: number };
  isSelected: boolean;
  onToggle: (photoId: string, itemIndex: number) => void;
  onDismountableToggle: (photoId: string, itemIndex: number, isDismountable: boolean) => void;
  onFragileToggle: (photoId: string, itemIndex: number, isFragile: boolean) => void;
  className?: string;
}

export function InventoryItemInline({ 
  item, 
  isSelected, 
  onToggle, 
  onDismountableToggle, 
  onFragileToggle,
  className = ""
}: InventoryItemInlineProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleToggle = () => {
    onToggle(item.photoId, item.itemIndex);
  };

  const handleDismountableToggle = (isDismountable: boolean) => {
    onDismountableToggle(item.photoId, item.itemIndex, isDismountable);
  };

  const handleFragileToggle = (isFragile: boolean) => {
    onFragileToggle(item.photoId, item.itemIndex, isFragile);
  };

  return (
    <>
      <motion.div
        className={`grid grid-cols-[2fr_1fr_120px_120px_120px] items-center gap-3 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${className}`}
        whileHover={{ backgroundColor: '#f9fafb' }}
      >
        {/* Article + Volume */}
        <div>
          <h4 className="font-medium text-gray-900">{item.label}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-600">
              {(item.volume_m3 || 0).toFixed(2)} m³
            </span>
            {item.quantity && item.quantity > 1 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Qté: {item.quantity}
              </span>
            )}
          </div>
        </div>

        {/* Volume - colonne séparée */}
        <div className="text-right">
          <div className="text-base font-semibold text-gray-900">
            {(item.volume_m3 || 0).toFixed(2)} m³
          </div>
          {item.packaged_volume_m3 && (
            <div className="text-xs text-blue-600">
              Emb: {item.packaged_volume_m3.toFixed(2)} m³
            </div>
          )}
        </div>

        {/* Démontable - Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              console.log('🖱️ Bouton Démontable cliqué, valeur actuelle:', item.dismountable);
              handleDismountableToggle(!item.dismountable);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm ${
              item.dismountable
                ? 'bg-green-400 text-white hover:bg-green-500' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {item.dismountable ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                OUI
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                NON
              </>
            )}
          </button>
        </div>

        {/* Fragile - Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              console.log('🖱️ Bouton Fragile cliqué, valeur actuelle:', item.fragile);
              handleFragileToggle(!item.fragile);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm ${
              item.fragile
                ? 'bg-green-400 text-white hover:bg-green-500' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {item.fragile ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                OUI
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                NON
              </>
            )}
          </button>
        </div>

        {/* À déménager - Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              console.log('🖱️ Bouton À déménager cliqué, valeur actuelle:', isSelected);
              handleToggle();
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm ${
              isSelected 
                ? 'bg-green-400 text-white hover:bg-green-500' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {isSelected ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                OUI
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                NON
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Modal des détails */}
      <ItemDetailsModal
        item={item}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </>
  );
}

