import React, { useState } from 'react';

interface DismountableToggleProps {
  item: {
    dismountable?: boolean;
    dismountable_confidence?: number;
    dismountable_source?: string;
    category?: string;
    label?: string;
  };
  onToggle: (dismountable: boolean) => void;
  className?: string;
}

export default function DismountableToggle({ item, onToggle, className = "" }: DismountableToggleProps) {
  const [isDismountable, setIsDismountable] = useState(item.dismountable ?? false);
  const confidence = item.dismountable_confidence ?? 0;
  const source = item.dismountable_source ?? 'database';

  // Ne pas afficher pour les objets qui ne sont clairement pas démontables
  if (item.category === 'misc' && !item.label.toLowerCase().includes('lampe')) {
    return null;
  }

  // Ne pas afficher si la confiance est inférieure à 70%
  if (confidence < 0.7) {
    return null;
  }

  const handleToggle = () => {
    const newValue = !isDismountable;
    setIsDismountable(newValue);
    onToggle(newValue);
  };

  // Couleurs et icônes selon le niveau de confiance et la source
  const getDisplayInfo = () => {
    if (confidence >= 0.8) {
      return {
        color: isDismountable ? 'emerald' : 'gray',
        icon: isDismountable ? '🔧' : '🔒',
        bgColor: isDismountable ? 'bg-emerald-50' : 'bg-gray-50',
        borderColor: isDismountable ? 'border-emerald-200' : 'border-gray-200',
        textColor: isDismountable ? 'text-emerald-700' : 'text-gray-600',
        label: isDismountable ? 'Démontable' : 'Non démontable'
      };
    } else if (confidence >= 0.6) {
      return {
        color: isDismountable ? 'amber' : 'gray',
        icon: isDismountable ? '🔧' : '🔒',
        bgColor: isDismountable ? 'bg-amber-50' : 'bg-gray-50',
        borderColor: isDismountable ? 'border-amber-200' : 'border-gray-200',
        textColor: isDismountable ? 'text-amber-700' : 'text-gray-600',
        label: isDismountable ? 'Prob. démontable' : 'Prob. non démontable'
      };
    } else {
      return {
        color: 'gray',
        icon: '❓',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        label: isDismountable ? 'Démontable ?' : 'Non démontable ?'
      };
    }
  };

  const displayInfo = getDisplayInfo();

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        onClick={handleToggle}
        className={`
          inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200 cursor-pointer group relative
          ${displayInfo.bgColor} ${displayInfo.borderColor} border-2
          ${displayInfo.textColor} hover:shadow-md hover:border-opacity-60
          hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300
          ${isDismountable ? 'hover:bg-opacity-80' : 'hover:bg-opacity-80'}
        `}
        title={`
          ${displayInfo.label}
          ${source === 'ai' ? ' (IA)' : source === 'database' ? ' (Base de données)' : source === 'hybrid' ? ' (Hybride)' : ''}
          ${confidence > 0 ? ` - Confiance: ${Math.round(confidence * 100)}%` : ''}
          Cliquez pour modifier
        `}
      >
        {/* Indicateur de modification */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        
        <span className="mr-1.5 text-sm">{displayInfo.icon}</span>
        <span className="text-xs font-medium">
          {isDismountable ? 'Démontable' : 'Non démontable'}
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
      </button>
    </div>
  );
}
