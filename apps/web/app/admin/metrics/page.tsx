/**
 * Page Admin - Monitoring Lite
 * /admin/metrics
 * LOT 18.1 - Monitoring Lite
 */

'use client';

import { useEffect, useState } from 'react';

// Types
interface AbSummary {
  variant: 'A' | 'B';
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

interface BatchSummary {
  totalBatches: number;
  completed: number;
  partial: number;
  failed: number;
  completionRate: number;
  partialRate: number;
  failedRate: number;
}

interface QueueSnapshot {
  name: string;
  waiting: number;
  active: number;
  completedLastHour: number;
  failedLastHour: number;
}

interface QueuesData {
  available: boolean;
  timestamp: string;
  queues: QueueSnapshot[];
}

export default function AdminMetricsPage() {
  const [abData, setAbData] = useState<AbSummary[]>([]);
  const [batchData, setBatchData] = useState<BatchSummary | null>(null);
  const [queuesData, setQueuesData] = useState<QueuesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le token depuis localStorage ou prompt
  const [adminToken, setAdminToken] = useState<string>('');
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    // Vérifier si token en localStorage
    const stored = localStorage.getItem('admin_token');
    if (stored) {
      setAdminToken(stored);
      setTokenChecked(true);
    } else {
      // Demander le token
      const token = prompt('Token admin requis (ADMIN_BYPASS_TOKEN):');
      if (token) {
        localStorage.setItem('admin_token', token);
        setAdminToken(token);
        setTokenChecked(true);
      } else {
        setError('Token admin requis');
      }
    }
  }, []);

  useEffect(() => {
    if (!tokenChecked || !adminToken) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = { 'x-admin-token': adminToken };

        // Fetch en parallèle
        const [abRes, batchRes, queueRes] = await Promise.all([
          fetch('/api/admin/metrics/ab-daily?summary=true', { headers }),
          fetch('/api/admin/metrics/batches?summary=true', { headers }),
          fetch('/api/admin/metrics/queues', { headers }),
        ]);

        if (!abRes.ok || !batchRes.ok || !queueRes.ok) {
          throw new Error('Erreur API: vérifiez le token admin');
        }

        const [abJson, batchJson, queueJson] = await Promise.all([
          abRes.json(),
          batchRes.json(),
          queueRes.json(),
        ]);

        setAbData(abJson.data || []);
        setBatchData(batchJson.data || null);
        setQueuesData(queueJson);
      } catch (err) {
        console.error('Erreur fetch metrics:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        
        // Si 401, effacer le token
        if (err instanceof Error && err.message.includes('401')) {
          localStorage.removeItem('admin_token');
          setAdminToken('');
          setTokenChecked(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh toutes les 30s
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [tokenChecked, adminToken]);

  if (!tokenChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🔒 Authentification requise</h1>
          <p className="text-gray-600">Token admin non fourni</p>
        </div>
      </div>
    );
  }

  if (error && !adminToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Monitoring Lite</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble des métriques système</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            🔄 Rafraîchir
          </button>
        </div>

        {loading && !abData.length && !batchData && !queuesData && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des métriques...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Widget 1: A/B Room Classifier */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🧪 A/B Room Classifier (7 derniers jours)
            </h2>
            {abData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {abData.map((variant) => (
                  <div key={variant.variant} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-700">
                        Variante {variant.variant}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        variant.variant === 'A' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {variant.variant === 'A' ? 'Baseline' : 'Candidate'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calls totaux:</span>
                        <span className="font-medium">{variant.totalCalls.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success rate:</span>
                        <span className={`font-medium ${
                          variant.successRate >= 0.95 ? 'text-green-600' : 
                          variant.successRate >= 0.85 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(variant.successRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latence moyenne:</span>
                        <span className="font-medium">{variant.avgLatencyMs}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">P95 Latence:</span>
                        <span className="font-medium">{variant.p95LatencyMs}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune donnée A/B disponible</p>
            )}
          </div>

          {/* Widget 2: Batches */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📦 Batches (7 derniers jours)
            </h2>
            {batchData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">
                    {batchData.totalBatches}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total créés</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {batchData.completed}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Complétés</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(batchData.completionRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {batchData.partial}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Partiels</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(batchData.partialRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {batchData.failed}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Échoués</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(batchData.failedRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune donnée batch disponible</p>
            )}
          </div>

          {/* Widget 3: Queues */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ⚡ Queues BullMQ (temps réel)
            </h2>
            {queuesData?.available ? (
              <div className="space-y-4">
                {queuesData.queues.map((queue) => (
                  <div key={queue.name} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">{queue.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600">En attente</div>
                        <div className="text-2xl font-bold text-blue-600">{queue.waiting}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Actifs</div>
                        <div className="text-2xl font-bold text-green-600">{queue.active}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Complétés (1h)</div>
                        <div className="text-2xl font-bold text-gray-600">{queue.completedLastHour}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Échoués (1h)</div>
                        <div className="text-2xl font-bold text-red-600">{queue.failedLastHour}</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-gray-500 text-right">
                  Dernière màj: {new Date(queuesData.timestamp).toLocaleTimeString('fr-FR')}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-gray-600">BullMQ non disponible</p>
                <p className="text-xs text-gray-500 mt-1">
                  Vérifiez que Redis est démarré et que les queues sont configurées
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Rafraîchissement automatique toutes les 30 secondes</p>
          <p className="mt-1">LOT 18.1 - Monitoring Lite</p>
        </div>
      </div>
    </div>
  );
}


