"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TInventoryItem } from '@/lib/schemas';

interface ItemDetailsModalProps {
  item: TInventoryItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailsModal({ item, isOpen, onClose }: ItemDetailsModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{item.label}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Catégorie</h3>
              <p className="text-sm text-gray-900 capitalize">{item.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quantité</h3>
              <p className="text-sm text-gray-900">{item.quantity}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Confiance IA</h3>
              <p className="text-sm text-gray-900">{(item.confidence * 100).toFixed(0)}%</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Source des dimensions</h3>
              <p className="text-sm text-gray-900 capitalize">{item.dimensions_cm.source}</p>
            </div>
          </div>

          {/* Dimensions détaillées */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Dimensions (cm)</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {item.dimensions_cm.length || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Longueur</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {item.dimensions_cm.width || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Largeur</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {item.dimensions_cm.height || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Hauteur</div>
                </div>
              </div>
            </div>
          </div>

          {/* Volumes */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Volumes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-lg font-bold text-blue-600">
                  {(item.volume_m3 || 0).toFixed(3)} m³
                </div>
                <div className="text-xs text-blue-700">Volume brut</div>
              </div>
              {item.packaged_volume_m3 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-lg font-bold text-green-600">
                    {item.packaged_volume_m3.toFixed(3)} m³
                  </div>
                  <div className="text-xs text-green-700">Volume emballé</div>
                </div>
              )}
            </div>
          </div>

          {/* Propriétés */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Propriétés</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${item.fragile ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-900">Fragile</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${item.stackable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-900">Empilable</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${item.dismountable ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-900">Démontable</span>
                {item.dismountable && item.dismountable_confidence && (
                  <span className="text-xs text-gray-500">
                    ({(item.dismountable_confidence * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
              {item.dismountable && item.dismountable_source && (
                <div className="text-xs text-gray-500">
                  Source: {item.dismountable_source}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                {item.notes}
              </p>
            </div>
          )}

          {/* Raisonnement IA */}
          {item.reasoning && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Raisonnement IA</h3>
              <p className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3">
                {item.reasoning}
              </p>
            </div>
          )}

          {/* Détails d'emballage */}
          {item.packaging_calculation_details && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Calcul d'emballage</h3>
              <p className="text-sm text-gray-900 bg-green-50 rounded-lg p-3">
                {item.packaging_calculation_details}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
