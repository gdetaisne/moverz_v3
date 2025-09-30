import React, { useState } from 'react';

interface DismountableToggleProps {
  item: any;
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
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          transition-all duration-200 cursor-pointer
          ${displayInfo.bgColor} ${displayInfo.borderColor} border
          ${displayInfo.textColor} hover:shadow-sm
          hover:scale-105 active:scale-95
        `}
        title={`
          ${displayInfo.label}
          ${source === 'ai' ? ' (IA)' : source === 'database' ? ' (Base de données)' : source === 'hybrid' ? ' (Hybride)' : ''}
          ${confidence > 0 ? ` - Confiance: ${Math.round(confidence * 100)}%` : ''}
          Cliquez pour modifier
        `}
      >
        <span className="mr-1">{displayInfo.icon}</span>
        <span className="text-xs">
          {isDismountable ? 'Démontable' : 'Non démontable'}
        </span>
        {confidence < 0.8 && (
          <span className="ml-1 opacity-60">?</span>
        )}
      </button>
    </div>
  );
}
