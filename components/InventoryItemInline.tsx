"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DismountableToggle from './DismountableToggle';
import FragileToggle from './FragileToggle';
import { ItemDetailsModal } from './ItemDetailsModal';
import { TInventoryItem } from '@/lib/schemas';

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
    <motion.div
      className={`flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      } ${className}`}
      whileHover={{ backgroundColor: isSelected ? '#dbeafe' : '#f9fafb' }}
    >
      {/* Informations de l'objet */}
      <div className="flex-1 flex items-center space-x-4">
        {/* Checkbox de sélection */}
        <button
          onClick={handleToggle}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`}
          title={isSelected ? 'Désélectionner' : 'Sélectionner'}
        >
          {isSelected && <span className="text-white text-xs">✓</span>}
        </button>

        {/* Nom de l'objet */}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.label}</h4>
          {item.quantity && item.quantity > 1 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Quantité: {item.quantity}
            </span>
          )}
        </div>

        {/* Volume */}
        <div className="text-sm text-gray-600 min-w-[120px]">
          <div>Volume: {(item.volume_m3 || 0).toFixed(2)} m³</div>
          {item.packaged_volume_m3 && (
            <div className="text-blue-600">
              Emballé: {item.packaged_volume_m3.toFixed(2)} m³
            </div>
          )}
        </div>

        {/* Catégorie */}
        <div className="text-xs text-gray-500 min-w-[80px]">
          {item.category}
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex items-center space-x-2 ml-4">
        <DismountableToggle
          item={item}
          onToggle={handleDismountableToggle}
        />
        
        <FragileToggle
          item={item}
          onToggle={handleFragileToggle}
        />

        {/* Bouton Détails */}
        <button
          onClick={() => setIsDetailsModalOpen(true)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          title="Voir les détails complets"
        >
          Détails
        </button>
      </div>

      {/* Modal des détails */}
      <ItemDetailsModal
        item={item}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </motion.div>
  );
}

