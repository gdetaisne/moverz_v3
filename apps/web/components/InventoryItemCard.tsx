"use client";
import React from 'react';
import { motion } from 'framer-motion';
import DismountableToggle from './DismountableToggle';
import FragileToggle from './FragileToggle';
import { TInventoryItem } from '@/lib/schemas';

interface InventoryItemCardProps {
  item: TInventoryItem & { photoId: string; itemIndex: number };
  isSelected: boolean;
  onToggle: (photoId: string, itemIndex: number) => void;
  onDismountableToggle: (photoId: string, itemIndex: number, isDismountable: boolean) => void;
  onFragileToggle: (photoId: string, itemIndex: number, isFragile: boolean) => void;
  className?: string;
}

export function InventoryItemCard({ 
  item, 
  isSelected, 
  onToggle, 
  onDismountableToggle, 
  onFragileToggle,
  className = ""
}: InventoryItemCardProps) {
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
      className={`p-3 rounded-lg border-2 transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      } ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{item.label}</h4>
          <p className="text-sm text-gray-600">
            Volume: {(item.volume_m3 || 0).toFixed(2)} m³
            {item.packaged_volume_m3 && (
              <span className="ml-2 text-blue-600">
                (Emballé: {item.packaged_volume_m3.toFixed(2)} m³)
              </span>
            )}
          </p>
          {item.quantity && item.quantity > 1 && (
            <p className="text-xs text-gray-500">
              Quantité: {item.quantity}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <DismountableToggle
            item={item}
            onToggle={handleDismountableToggle}
          />
          
          <FragileToggle
            item={item}
            onToggle={handleFragileToggle}
          />
          
          <button
            onClick={handleToggle}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}
            title={isSelected ? 'Désélectionner' : 'Sélectionner'}
          >
            {isSelected && <span className="text-white text-sm">✓</span>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
