/**
 * ⚙️ Admin page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SystemStatus {
  aiService?: {
    status: string;
    url: string;
  };
  database?: {
    status: string;
  };
  queue?: {
    status: string;
  };
}

export default function AdminPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-status');
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetSystem = () => {
    localStorage.clear();
    alert('Système réinitialisé (localStorage vidé)');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Administration
                </h1>
                <p className="text-gray-600">
                  Gestion et monitoring du système
                </p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">⚙️</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="mb-8">
              <Link
                href="/admin/metrics"
                className="inline-flex items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors"
              >
                📊 Voir les métriques détaillées
              </Link>
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={checkStatus}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                {loading ? 'Vérification...' : 'Vérifier le statut du système'}
              </button>
              <button
                onClick={resetSystem}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                Réinitialiser le système
              </button>
            </div>

            {/* Status display */}
            {loading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Vérification du statut...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-600 font-medium mb-2">Erreur</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            ) : status ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  État du système
                </h3>

                {status.aiService && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Service IA</p>
                        <p className="text-sm text-gray-600">{status.aiService.url}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          status.aiService.status === 'ok'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {status.aiService.status}
                      </span>
                    </div>
                  </div>
                )}

                {status.database && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">Base de données</p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          status.database.status === 'ok'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {status.database.status}
                      </span>
                    </div>
                  </div>
                )}

                {status.queue && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">File d'attente</p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          status.queue.status === 'ok'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {status.queue.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Cliquez sur "Vérifier le statut" pour voir l'état du système
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

