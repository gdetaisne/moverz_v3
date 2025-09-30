'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FragileToggleProps {
  item: any;
  onToggle: (isFragile: boolean) => void;
  className?: string;
}

export default function FragileToggle({ item, onToggle, className = "" }: FragileToggleProps) {
  const [isFragile, setIsFragile] = useState(item.fragile ?? false);
  const confidence = item.confidence ?? 0.5;
  
  // Ne pas afficher si l'objet n'est pas fragile ou si la confiance est faible
  if (!isFragile || confidence < 0.6) {
    return null;
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation vers le parent
    const newValue = !isFragile;
    setIsFragile(newValue);
    onToggle(newValue);
  };

  const displayInfo = {
    icon: isFragile ? '💥' : '🛡️',
    label: isFragile ? 'Fragile' : 'Non fragile',
    bgColor: isFragile ? 'bg-red-50' : 'bg-green-50',
    borderColor: isFragile ? 'border-red-200' : 'border-green-200',
    textColor: isFragile ? 'text-red-700' : 'text-green-700'
  };

  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-200 cursor-pointer group relative
        ${displayInfo.bgColor} ${displayInfo.borderColor} border-2
        ${displayInfo.textColor} hover:shadow-md hover:border-opacity-60
        hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300
        ${isFragile ? 'hover:bg-opacity-80' : 'hover:bg-opacity-80'}
      `}
      title={`
        ${displayInfo.label}
        ${confidence > 0 ? ` - Confiance: ${Math.round(confidence * 100)}%` : ''}
        Cliquez pour modifier
      `}
    >
      {/* Indicateur de modification */}
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      
      <span className="mr-1.5 text-sm">{displayInfo.icon}</span>
      <span className="text-xs font-medium">
        {isFragile ? 'Fragile' : 'Non fragile'}
      </span>
      {confidence < 0.8 && (
        <span className="ml-1 opacity-60">?</span>
      )}
      
      {/* Flèche indicateur de modification */}
      <svg 
        className="ml-1 w-3 h-3 opacity-40 group-hover:opacity-70 transition-opacity duration-200" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </motion.button>
  );
}
