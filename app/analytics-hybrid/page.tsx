"use client";

import { useState, useEffect } from 'react';

interface FunnelStep {
  id: number;
  name: string;
  event: string;
  uniqueUsers: number;
  totalEvents: number;
  conversionRate: number;
  dropOffRate: number;
  isProblematic: boolean;
}

interface FrictionPoint {
  step: string;
  dropOffRate: number;
  severity: 'critical' | 'high' | 'medium';
  impact: string;
}

interface PerformanceMetrics {
  globalConversionRate: string;
  avgSessionDuration: number;
  globalDropOffRate: string;
  activeUsers: number;
  photosUploaded: number;
  quotesSubmitted: number;
}

interface TechnicalMetrics {
  ai: {
    avgLatencyMs: number;
    totalCalls: number;
    totalCostUsd: string;
    errorRate: string;
  };
  errors: {
    totalErrors: number;
    errorRate: string;
  };
}

interface EnvironmentData {
  name: string;
  icon: string;
  color: string;
  status: 'connected' | 'error';
  funnel: FunnelStep[];
  performance: PerformanceMetrics;
  technical: TechnicalMetrics;
  events: Array<{ type: string; count: number }>;
  frictionPoints: FrictionPoint[];
  lastUpdated: string;
  error?: string;
}

interface GlobalMetrics {
  status: 'complete' | 'partial';
  totalActiveUsers?: number;
  totalPhotosUploaded?: number;
  totalQuotesSubmitted?: number;
  avgConversionRate?: number;
  combinedAICost?: string;
  message?: string;
}

interface DashboardData {
  period: string;
  timestamp: string;
  environments: {
    local: EnvironmentData;
    production: EnvironmentData;
  };
  global: GlobalMetrics;
}

export default function AnalyticsHybridDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedEnv, setSelectedEnv] = useState<'all' | 'local' | 'production'>('all');

  const fetchData = async (period: string = selectedPeriod) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard-hybrid?period=${period}`);
      if (!response.ok) throw new Error('Erreur API');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  if (loading) return <div className="p-8 text-center">🔄 Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-500">❌ {error}</div>;
  if (!data) return <div className="p-8 text-center">❌ Aucune donnée</div>;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEnvColor = (color: string) => {
    switch (color) {
      case 'blue': return 'border-blue-500 bg-blue-50';
      case 'green': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getTextColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-900';
      case 'green': return 'text-green-900';
      default: return 'text-gray-900';
    }
  };

  const renderEnvironmentCard = (envData: EnvironmentData, title: string) => (
    <div className={`p-6 rounded-lg border-2 ${getEnvColor(envData.color)}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xl font-semibold flex items-center ${getTextColor(envData.color)}`}>
          <span className="text-2xl mr-2">{envData.icon}</span>
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            envData.status === 'connected' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {envData.status === 'connected' ? '✅ Connecté' : '❌ Erreur'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(envData.lastUpdated).toLocaleTimeString('fr-FR')}
          </span>
        </div>
      </div>

      {envData.status === 'connected' ? (
        <>
          {/* Métriques principales */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{envData.performance.activeUsers}</p>
              <p className="text-sm text-gray-700">Utilisateurs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{envData.performance.globalConversionRate}%</p>
              <p className="text-sm text-gray-700">Conversion</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{envData.performance.avgSessionDuration}min</p>
              <p className="text-sm text-gray-700">Durée</p>
            </div>
          </div>

          {/* Funnel simplifié */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-800">🎯 Funnel</h4>
            <div className="space-y-2">
              {envData.funnel.slice(0, 4).map((step) => (
                <div key={step.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-800">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mr-2">
                      {step.id}
                    </span>
                    {step.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">{step.uniqueUsers}</span>
                    <span className={`text-xs font-medium ${
                      step.conversionRate >= 80 ? 'text-green-600' : step.conversionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {step.conversionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points de friction */}
          {envData.frictionPoints.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-gray-800">🚨 Frictions</h4>
              <div className="space-y-1">
                {envData.frictionPoints.slice(0, 2).map((point, index) => (
                  <div key={index} className={`text-xs px-2 py-1 rounded ${getSeverityColor(point.severity)}`}>
                    {point.step}: {point.dropOffRate}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-red-600 font-medium">Erreur de connexion</p>
          <p className="text-sm text-gray-700 mt-1">{envData.error}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔄 Dashboard Hybride</h1>
              <p className="text-gray-700 mt-2">
                Local + Production • Dernière mise à jour: {new Date(data.timestamp).toLocaleString('fr-FR')}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  fetchData(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1d">Dernière 24h</option>
                <option value="7d">Dernière semaine</option>
                <option value="30d">Dernier mois</option>
              </select>
              
              <button 
                onClick={() => fetchData()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                🔄 Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Métriques globales */}
        {data.global.status === 'complete' && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🌍 Vue Globale</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{data.global.totalActiveUsers}</p>
                <p className="text-sm text-gray-700">Utilisateurs Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{data.global.totalPhotosUploaded}</p>
                <p className="text-sm text-gray-700">Photos Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{data.global.totalQuotesSubmitted}</p>
                <p className="text-sm text-gray-700">Devis Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{data.global.avgConversionRate?.toFixed(1)}%</p>
                <p className="text-sm text-gray-700">Conversion Moyenne</p>
              </div>
            </div>
          </div>
        )}

        {data.global.status === 'partial' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8">
            <div className="flex items-center">
              <span className="text-yellow-600 text-lg mr-2">⚠️</span>
              <p className="text-yellow-800">{data.global.message}</p>
            </div>
          </div>
        )}

        {/* Sélecteur d'environnement */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedEnv('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedEnv === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🌍 Tous
            </button>
            <button
              onClick={() => setSelectedEnv('local')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedEnv === 'local' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🛠️ Local
            </button>
            <button
              onClick={() => setSelectedEnv('production')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedEnv === 'production' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🚀 Production
            </button>
          </div>
        </div>

        {/* Cartes d'environnements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(selectedEnv === 'all' || selectedEnv === 'local') && 
            renderEnvironmentCard(data.environments.local, 'Environnement Local')
          }
          
          {(selectedEnv === 'all' || selectedEnv === 'production') && 
            renderEnvironmentCard(data.environments.production, 'Environnement Production')
          }
        </div>

        {/* Comparaison détaillée */}
        {selectedEnv === 'all' && data.global.status === 'complete' && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">📊 Comparaison Détaillée</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Funnel comparatif */}
              <div>
                <h4 className="font-medium mb-4">🎯 Funnel Comparatif</h4>
                <div className="space-y-3">
                  {data.environments.local.funnel.slice(0, 4).map((step, index) => (
                    <div key={step.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mr-2">
                          {step.id}
                        </span>
                        {step.name}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-blue-600 font-medium">
                          {data.environments.local.funnel[index]?.uniqueUsers || 0}
                        </span>
                        <span className="text-green-600 font-medium">
                          {data.environments.production.funnel[index]?.uniqueUsers || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              <div className="flex justify-between text-xs text-gray-700 mt-2">
                <span>🛠️ Local</span>
                <span>🚀 Production</span>
              </div>
              </div>

              {/* Métriques techniques */}
              <div>
                <h4 className="font-medium mb-4 text-gray-800">🤖 Performance IA</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-800">
                    <span>Latence moyenne</span>
                    <div className="flex space-x-4">
                      <span className="text-blue-600">{data.environments.local.technical.ai.avgLatencyMs}ms</span>
                      <span className="text-green-600">{data.environments.production.technical.ai.avgLatencyMs}ms</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800">
                    <span>Taux d'erreur</span>
                    <div className="flex space-x-4">
                      <span className="text-blue-600">{data.environments.local.technical.ai.errorRate}%</span>
                      <span className="text-green-600">{data.environments.production.technical.ai.errorRate}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800">
                    <span>Coût total</span>
                    <div className="flex space-x-4">
                      <span className="text-blue-600">${data.environments.local.technical.ai.totalCostUsd}</span>
                      <span className="text-green-600">${data.environments.production.technical.ai.totalCostUsd}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Dashboard Hybride</h3>
          <div className="text-blue-700 space-y-2">
            <p><strong>🛠️ Local :</strong> Données de votre environnement de développement</p>
            <p><strong>🚀 Production :</strong> Données du site en ligne (si configuré)</p>
            <p><strong>🌍 Vue Globale :</strong> Métriques combinées des deux environnements</p>
            <p><strong>📊 Comparaison :</strong> Analyse côte à côte pour identifier les différences</p>
          </div>
        </div>
      </div>
    </div>
  );
}
