/**
 * 📦 Inventory page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Stepper } from '../../components/Stepper';
import { InventoryTable } from '../../components/InventoryTable';
import { Loader } from '../../components/Loader';
import { useInventory } from '../../hooks/useInventory';

export default function InventoryPage() {
  const router = useRouter();
  const [batchId, setBatchId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('currentBatchId');
    setBatchId(id);
  }, []);

  const { items, loading, error, updateItem, removeItem } = useInventory(batchId || undefined);

  const handleContinue = () => {
    router.push('/estimate');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Stepper />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Votre inventaire
            </h1>
            <p className="text-gray-600 mb-8">
              Vérifiez et modifiez les objets détectés
            </p>

            {loading ? (
              <div className="py-12">
                <Loader size="lg" text="Chargement de l'inventaire..." />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                <InventoryTable
                  items={items}
                  onUpdateItem={updateItem}
                  onRemoveItem={removeItem}
                />

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleContinue}
                    disabled={items.length === 0}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-colors"
                  >
                    Continuer vers l'estimation →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



