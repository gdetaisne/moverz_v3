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

interface Alert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  steps?: string[];
}

interface DashboardData {
  period: string;
  timestamp: string;
  funnel: FunnelStep[];
  frictionPoints: FrictionPoint[];
  performance: PerformanceMetrics;
  technical: TechnicalMetrics;
  events: Array<{ type: string; count: number }>;
  alerts: Alert[];
}

export default function AnalyticsDashboardV2() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const fetchData = async (period: string = selectedPeriod) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard-v2?period=${period}`);
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

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Analytics PM</h1>
              <p className="text-gray-600 mt-2">
                Dernière mise à jour: {new Date(data.timestamp).toLocaleString('fr-FR')}
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

        {/* Alertes */}
        {data.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🚨 Alertes</h2>
            <div className="space-y-3">
              {data.alerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-center">
                    <span className="text-lg mr-2">
                      {alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵'}
                    </span>
                    <div>
                      <h3 className="font-semibold">{alert.title}</h3>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                      {alert.steps && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">Étapes concernées: </span>
                          <span className="text-sm text-gray-600">{alert.steps.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">👥 Utilisateurs Actifs</h3>
            <p className="text-3xl font-bold text-blue-600">{data.performance.activeUsers}</p>
            <p className="text-sm text-gray-500 mt-1">Période sélectionnée</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">📈 Conversion Globale</h3>
            <p className="text-3xl font-bold text-green-600">{data.performance.globalConversionRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Visiteurs → Devis</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">⏱️ Durée Moyenne</h3>
            <p className="text-3xl font-bold text-purple-600">{data.performance.avgSessionDuration}min</p>
            <p className="text-sm text-gray-500 mt-1">Par session</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">🚨 Taux d'Abandon</h3>
            <p className="text-3xl font-bold text-red-600">{data.performance.globalDropOffRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Global</p>
          </div>
        </div>

        {/* Funnel détaillé */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">🎯 Funnel de Conversion Détaillé</h3>
          <div className="space-y-4">
            {data.funnel.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                      {step.id}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{step.name}</h4>
                      <p className="text-sm text-gray-500">{step.uniqueUsers} utilisateurs uniques</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Conversion</p>
                      <p className={`font-semibold ${step.conversionRate >= 80 ? 'text-green-600' : step.conversionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {step.conversionRate}%
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Abandon</p>
                      <p className={`font-semibold ${step.dropOffRate <= 20 ? 'text-green-600' : step.dropOffRate <= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {step.dropOffRate}%
                      </p>
                    </div>
                    
                    {step.isProblematic && (
                      <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                        ⚠️ Problématique
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Barre de progression */}
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.max(2, (step.uniqueUsers / Math.max(1, data.funnel[0]?.uniqueUsers || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Points de friction */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">🔍 Points de Friction Identifiés</h3>
          {data.frictionPoints.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.frictionPoints.map((point, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(point.severity)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{point.step}</h4>
                    <span className="text-sm font-bold">{point.dropOffRate}%</span>
                  </div>
                  <p className="text-sm">{point.impact}</p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(point.severity)}`}>
                      {point.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-500">Aucun point de friction critique détecté !</p>
            </div>
          )}
        </div>

        {/* Métriques techniques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🤖 Performance IA</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Appels totaux</span>
                <span className="font-semibold">{data.technical.ai.totalCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Latence moyenne</span>
                <span className="font-semibold">{data.technical.ai.avgLatencyMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coût total</span>
                <span className="font-semibold">${data.technical.ai.totalCostUsd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux d'erreur</span>
                <span className={`font-semibold ${parseFloat(data.technical.ai.errorRate) <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.technical.ai.errorRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Événements Récents</h3>
            {data.events.length > 0 ? (
              <div className="space-y-2">
                {data.events.slice(0, 8).map((event, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-700 text-sm">{event.type.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-blue-600">{event.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun événement récent</p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Comment utiliser ce dashboard ?</h3>
          <div className="text-blue-700 space-y-2">
            <p><strong>1. Surveillez les alertes :</strong> Les alertes en haut vous indiquent les problèmes critiques</p>
            <p><strong>2. Analysez le funnel :</strong> Identifiez où les utilisateurs abandonnent le plus</p>
            <p><strong>3. Priorisez les corrections :</strong> Concentrez-vous sur les points de friction critiques</p>
            <p><strong>4. Testez les améliorations :</strong> Mesurez l'impact de vos corrections</p>
          </div>
        </div>
      </div>
    </div>
  );
}
