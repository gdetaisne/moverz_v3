/**
 * 💰 Estimate card component
 */

'use client';

import { Estimate } from '../hooks/useEstimate';
import { formatVolume, formatPrice } from '../lib/helpers';

interface EstimateCardProps {
  estimate: Estimate;
}

export function EstimateCard({ estimate }: EstimateCardProps) {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Estimation de votre déménagement</h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="text-blue-100 text-sm mb-1">Volume total</p>
          <p className="text-3xl font-bold">{formatVolume(estimate.totalVolume)}</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="text-blue-100 text-sm mb-1">Prix estimé</p>
          <p className="text-3xl font-bold">{formatPrice(estimate.totalPrice)}</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-blue-400/30 pt-6">
        <div className="flex justify-between items-center">
          <span className="text-blue-100">Nombre d'objets</span>
          <span className="font-semibold">{estimate.itemCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-blue-100">Objets fragiles</span>
          <span className="font-semibold">{estimate.breakdown.fragileItems}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-blue-100">Objets démontables</span>
          <span className="font-semibold">{estimate.breakdown.dismountableItems}</span>
        </div>
      </div>

      <div className="mt-6 bg-blue-400/20 rounded-lg p-4">
        <p className="text-xs text-blue-100">
          💡 Cette estimation est indicative. Le prix final sera confirmé après validation.
        </p>
      </div>
    </div>
  );
}



