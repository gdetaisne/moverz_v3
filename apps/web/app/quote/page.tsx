/**
 * 📄 Quote page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stepper } from '../../components/Stepper';
import { QuoteSummary } from '../../components/QuoteSummary';
import { Loader } from '../../components/Loader';
import { useInventory } from '../../hooks/useInventory';
import { useEstimate } from '../../hooks/useEstimate';

export default function QuotePage() {
  const router = useRouter();
  const [batchId, setBatchId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('currentBatchId');
    setBatchId(id);
  }, []);

  const { items, loading, error } = useInventory(batchId || undefined);
  const { estimate, generateQuote } = useEstimate(items);

  const handleSubmit = async () => {
    try {
      await generateQuote();
      setSubmitted(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err) {
      alert('Erreur lors de l\'envoi du devis');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-green-600 text-4xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Devis envoyé avec succès !
          </h1>
          <p className="text-gray-600 mb-6">
            Nous reviendrons vers vous dans les plus brefs délais.
          </p>
          <div className="text-sm text-gray-500">
            Redirection vers l'accueil...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Stepper />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <Loader size="lg" text="Chargement..." />
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
            <QuoteSummary
              estimate={estimate}
              items={items}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}



