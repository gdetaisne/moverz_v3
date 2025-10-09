'use client';

import { useState, useEffect } from 'react';

interface AIService {
  name: string;
  status: 'active' | 'inactive' | 'error';
  configured: boolean;
  model?: string;
}

interface AIStatusData {
  summary: {
    active: number;
    total: number;
    allActive: boolean;
  };
  services: AIService[];
  timestamp: string;
}

export default function AIStatusHeader() {
  const [statusData, setStatusData] = useState<AIStatusData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Timeout de 5 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/ai-status', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStatusData(data);
        setLastChecked(new Date());
        setError(null);
      } else {
        setError(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification du statut des IA:', err);
      setError(err instanceof Error ? err.message : 'Services IA indisponibles ⛔');
      // En cas d'erreur, on garde les données précédentes si elles existent
    } finally {
      setIsLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'inactive':
        return 'text-gray-400';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '●';
      case 'inactive':
        return '○';
      case 'error':
        return '✕';
      default:
        return '○';
    }
  };

  const getStatusBadgeColor = () => {
    if (error) return 'bg-red-500';
    if (!statusData) return 'bg-gray-500';
    const { active, total } = statusData.summary;
    if (active === total) return 'bg-green-500';
    if (active === 0) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="relative inline-block">
      {/* Bouton principal discret */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
        title={error ? `Erreur: ${error}` : "Statut des services IA"}
      >
        <span className="text-gray-400">IA</span>
        {error ? (
          <>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-400">⛔</span>
          </>
        ) : statusData ? (
          <>
            <span className={`w-2 h-2 rounded-full ${getStatusBadgeColor()}`} />
            <span className="text-gray-300">
              {statusData.summary.active}/{statusData.summary.total}
            </span>
          </>
        ) : null}
        {isLoading && (
          <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {/* Panel déroulant */}
      {isExpanded && (statusData || error) && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">
                Services IA
              </h3>
              <button
                onClick={checkStatus}
                disabled={isLoading}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                title="Actualiser"
              >
                {isLoading ? '...' : '↻'}
              </button>
            </div>
            {lastChecked && (
              <p className="text-xs text-gray-500 mt-1">
                Vérifié il y a {Math.round((Date.now() - lastChecked.getTime()) / 1000)}s
              </p>
            )}
          </div>

          {/* Affichage erreur */}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border-l-4 border-red-500">
              <p className="text-sm text-red-400">⛔ {error}</p>
              <p className="text-xs text-gray-500 mt-1">
                Les services IA sont temporairement indisponibles.
              </p>
            </div>
          )}

          {/* Liste des services */}
          {statusData && (
            <div className="py-2">
              {statusData.services.map((service) => (
              <div
                key={service.name}
                className="px-4 py-2.5 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {service.name}
                      </p>
                      {service.model && (
                        <p className="text-xs text-gray-500">
                          {service.model}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      service.status === 'active'
                        ? 'bg-green-500/10 text-green-400'
                        : service.status === 'error'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {service.status === 'active'
                      ? 'Actif'
                      : service.status === 'error'
                      ? 'Erreur'
                      : 'Inactif'}
                  </span>
                </div>
              </div>
              ))}
            </div>
          )}

          {/* Footer avec résumé */}
          <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {error
                  ? '⚠️ Erreur de connexion'
                  : statusData?.summary.allActive
                  ? '✓ Tous les services actifs'
                  : `${statusData?.summary.active || 0} service(s) actif(s)`}
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-400"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour fermer au clic extérieur */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

