'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useBatchProgress } from '@/hooks/useBatchProgress';
import { BatchProgressBar } from '@/components/BatchProgressBar';
import { motion } from 'framer-motion';

interface BatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Page de suivi d'un batch en temps réel
 * Utilise SSE pour recevoir les mises à jour sans polling
 */
export default function BatchPage({ params }: BatchPageProps) {
  const { id: batchId } = use(params);
  const router = useRouter();
  
  const { data, isLoading, error, isConnected, lastUpdate } = useBatchProgress(batchId);

  // État de connexion
  const ConnectionStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">Connexion en cours...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      );
    }

    if (isConnected) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Temps réel actif</span>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              · Mis à jour {new Date(lastUpdate).toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Retour</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Traitement du lot
              </h1>
              <p className="text-gray-600">
                ID: <code className="text-sm bg-gray-100 px-2 py-1 rounded">{batchId}</code>
              </p>
            </div>
            
            <ConnectionStatus />
          </div>
        </motion.div>

        {/* Contenu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isLoading && !data && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Connexion au flux temps réel...
              </h3>
              <p className="text-gray-500">
                Veuillez patienter pendant que nous établissons la connexion.
              </p>
            </div>
          )}

          {error && !data && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Erreur de connexion
              </h3>
              <p className="text-gray-500 mb-4">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {data && (
            <>
              <BatchProgressBar progress={data} showPhotos={true} />

              {/* Actions */}
              {['COMPLETED', 'PARTIAL', 'FAILED'].includes(data.status) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 flex justify-center space-x-4"
                >
                  <button
                    onClick={() => router.push(`/projects`)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Retour aux projets
                  </button>
                  
                  {data.status === 'PARTIAL' && (
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-md"
                    >
                      Réessayer les échecs
                    </button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* Info SSE */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gray-800 text-gray-100 rounded-lg p-4 text-xs font-mono"
          >
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Debug Info</span>
            </div>
            <div className="space-y-1 text-gray-300">
              <div>Batch ID: {batchId}</div>
              <div>Connected: {isConnected ? '✓' : '✗'}</div>
              <div>Last Update: {lastUpdate?.toISOString() || 'N/A'}</div>
              <div>Status: {data?.status || 'N/A'}</div>
              <div>Progress: {data?.progress || 0}%</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}



