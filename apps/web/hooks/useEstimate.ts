/**
 * 💰 Estimate hook
 */

import { useState, useCallback, useMemo } from 'react';
import { InventoryItem } from './useInventory';

export interface Estimate {
  totalVolume: number;
  totalPrice: number;
  itemCount: number;
  breakdown: {
    fragileItems: number;
    dismountableItems: number;
  };
}

export function useEstimate(items: InventoryItem[]) {
  const [pricePerM3] = useState(150); // Base price per m³

  const estimate = useMemo((): Estimate => {
    const totalVolume = items.reduce(
      (sum, item) => sum + (item.volume || 0) * (item.quantity || 1),
      0
    );

    const fragileItems = items.filter((item) => item.fragile).length;
    const dismountableItems = items.filter((item) => item.dismountable).length;

    // Simple pricing logic
    const basePrice = totalVolume * pricePerM3;
    const fragileCharge = fragileItems * 20;
    const dismountableCharge = dismountableItems * 30;
    const totalPrice = basePrice + fragileCharge + dismountableCharge;

    return {
      totalVolume,
      totalPrice,
      itemCount: items.length,
      breakdown: {
        fragileItems,
        dismountableItems,
      },
    };
  }, [items, pricePerM3]);

  const generateQuote = useCallback(async () => {
    // Mock quote generation
    return {
      id: `quote-${Date.now()}`,
      estimate,
      createdAt: new Date().toISOString(),
    };
  }, [estimate]);

  return {
    estimate,
    generateQuote,
  };
}



