"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface InventorySummaryCardProps {
  totalItems: number;
  totalVolume: number;
  totalPackagedVolume: number;
  fragileItems: number;
  dismountableItems: number;
  categoriesCount: number;
  onDownloadPDF: () => void;
  className?: string;
}

export function InventorySummaryCard({ 
  totalItems,
  totalVolume,
  totalPackagedVolume,
  fragileItems,
  dismountableItems,
  categoriesCount,
  onDownloadPDF,
  className = ""
}: InventorySummaryCardProps) {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-4">Résumé de l&apos;inventaire</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
          <div className="text-sm text-gray-600">Objets sélectionnés</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {totalVolume.toFixed(2)} m³
          </div>
          <div className="text-sm text-gray-600">Volume brut</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {totalPackagedVolume.toFixed(2)} m³
          </div>
          <div className="text-sm text-gray-600">Volume emballé</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{categoriesCount}</div>
          <div className="text-sm text-gray-600">Catégories</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{fragileItems}</div>
          <div className="text-sm text-gray-600">Objets fragiles</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-600">{dismountableItems}</div>
          <div className="text-sm text-gray-600">Démontables</div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={onDownloadPDF}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          📄 Télécharger le PDF
        </button>
      </div>
    </motion.div>
  );
}
