/**
 * 📄 Quote summary component
 */

'use client';

import { Estimate } from '../hooks/useEstimate';
import { InventoryItem } from '../hooks/useInventory';
import { formatVolume, formatPrice } from '../lib/helpers';

interface QuoteSummaryProps {
  estimate: Estimate;
  items: InventoryItem[];
  onSubmit?: () => void;
}

export function QuoteSummary({ estimate, items, onSubmit }: QuoteSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-500 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Récapitulatif de votre devis</h2>
        <p className="text-blue-100">Vérifiez les informations avant l'envoi</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Résumé de l'estimation
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Volume total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatVolume(estimate.totalVolume)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Nombre d'objets</p>
            <p className="text-2xl font-bold text-gray-900">{estimate.itemCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Prix estimé</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(estimate.totalPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Items breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Détails des objets ({items.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">
                  {item.name}
                </span>
                <span className="text-xs text-gray-500">×{item.quantity || 1}</span>
              </div>
              <div className="flex items-center space-x-2">
                {item.fragile && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                    Fragile
                  </span>
                )}
                {item.dismountable && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    Démontable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action button */}
      {onSubmit && (
        <button
          onClick={onSubmit}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl"
        >
          Envoyer le devis
        </button>
      )}
    </div>
  );
}



