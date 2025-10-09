/**
 * 💰 Estimate page
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Stepper } from '../../components/Stepper';
import { EstimateCard } from '../../components/EstimateCard';
import { Loader } from '../../components/Loader';
import { useInventory } from '../../hooks/useInventory';
import { useEstimate } from '../../hooks/useEstimate';

export default function EstimatePage() {
  const router = useRouter();
  const [batchId, setBatchId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('currentBatchId');
    setBatchId(id);
  }, []);

  const { items, loading, error } = useInventory(batchId || undefined);
  const { estimate } = useEstimate(items);

  const handlePrepareQuote = () => {
    router.push('/quote');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Stepper />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Estimation de votre déménagement
            </h1>
            <p className="text-gray-600 mb-8">
              Voici le récapitulatif de votre estimation
            </p>

            {loading ? (
              <div className="py-12">
                <Loader size="lg" text="Calcul de l'estimation..." />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-700">
                  Aucun objet dans l'inventaire. Veuillez retourner à l'étape précédente.
                </p>
              </div>
            ) : (
              <>
                <EstimateCard estimate={estimate} />

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handlePrepareQuote}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors"
                  >
                    Préparer la demande de devis →
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



