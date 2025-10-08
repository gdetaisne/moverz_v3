"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROOM_TYPES } from '@/lib/roomValidation';

interface RoomTypeSelectorProps {
  value: string;
  onChange: (newRoomType: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  className?: string;
}

export function RoomTypeSelector({ 
  value, 
  onChange, 
  isEditing, 
  onToggleEdit,
  className = "" 
}: RoomTypeSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedType = ROOM_TYPES.find(t => t.value === value);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeSelect = (roomType: string) => {
    onChange(roomType);
    setIsDropdownOpen(false);
    onToggleEdit(); // Sortir du mode édition
  };

  if (isEditing) {
    return (
      <div className={`room-type-editor relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <span className="text-lg">{selectedType?.icon || '🏠'}</span>
          <span className="font-medium">{selectedType?.label || 'Sélectionner...'}</span>
          <span className="text-gray-400">▼</span>
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
            >
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2 px-2">Choisir un type de pièce :</div>
                {ROOM_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeSelect(type.value)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors ${
                      type.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                    {type.value === value && (
                      <span className="text-blue-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      className={`room-type-display flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors ${className}`}
      onClick={onToggleEdit}
    >
      <span className="text-lg">{selectedType?.icon || '🏠'}</span>
      <span className="font-medium text-gray-800">{selectedType?.label || 'Type inconnu'}</span>
      <button className="text-gray-400 hover:text-gray-600 ml-1">
        ✏️
      </button>
    </div>
  );
}

