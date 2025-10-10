/**
 * 📦 Inventory hook
 */

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../lib/apiClient';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  fragile: boolean;
  dismountable: boolean;
  volume?: number;
  quantity?: number;
  // Détails supplémentaires
  dimensions_cm?: {
    length: number;
    width: number;
    height: number;
    source?: string;
  };
  volume_m3?: number;
  packaged_volume_m3?: number;
  packaging_display?: string;
  notes?: string;
  confidence?: number;
  stackable?: boolean;
  is_small_object?: boolean;
  packaging_calculation_details?: string;
}

export function useInventory(batchId?: string) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!batchId) return;

    setLoading(true);
    setError(null);

    try {
      // Adapt to your real API structure
      const data = await apiGet<{ items: InventoryItem[] }>(
        `/batches/${batchId}/inventory`
      );
      setItems(data.items || []);
    } catch (err) {
      const errorMsg = (err as Error).message || 'Erreur de chargement';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    items,
    loading,
    error,
    updateItem,
    removeItem,
    refresh: fetchInventory,
  };
}




