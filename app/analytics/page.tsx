"use client";

import { useState, useEffect } from 'react';

interface DashboardData {
  period: string;
  metrics: {
    activeUsers: number;
    photosUploaded: number;
    quotesSubmitted: number;
    conversionRate: string;
  };
  funnel: Array<{
    step: number;
    users: number;
  }>;
  events: Array<{
    type: string;
    count: number;
  }>;
  ai: {
    avgLatencyMs: number;
    totalCalls: number;
    totalCostUsd: string;
    errorRate: string;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/dashboard');
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
    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center">🔄 Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-500">❌ {error}</div>;
  if (!data) return <div className="p-8 text-center">❌ Aucune donnée</div>;

  const getStepName = (step: number) => {
    const steps = ['App Ouverte', 'Photos Uploadées', 'Pièces Validées', 'Inventaire Validé', 'Formulaire Devis', 'Devis Envoyé'];
    return steps[step] || `Étape ${step}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Analytics</h1>
          <p className="text-gray-600 mt-2">Période : {data.period.replace('_', ' ')}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Actualiser
          </button>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">👥 Utilisateurs Actifs</h3>
            <p className="text-3xl font-bold text-blue-600">{data.metrics.activeUsers}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">📸 Photos Uploadées</h3>
            <p className="text-3xl font-bold text-green-600">{data.metrics.photosUploaded}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">📋 Devis Envoyés</h3>
            <p className="text-3xl font-bold text-purple-600">{data.metrics.quotesSubmitted}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">📈 Taux de Conversion</h3>
            <p className="text-3xl font-bold text-orange-600">{data.metrics.conversionRate}</p>
          </div>
        </div>

        {/* Funnel de conversion */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🎯 Funnel de Conversion</h3>
          <div className="space-y-4">
            {data.funnel.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className="w-32 text-sm font-medium text-gray-600">
                  {getStepName(step.step)}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 mx-4">
                <div 
                  className="bg-blue-500 h-6 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${step.users > 0 ? Math.max(2, (step.users / Math.max(1, data.funnel[0]?.users || 1)) * 100) : 0}%` 
                  }}
                />
                </div>
                <div className="w-16 text-right font-semibold">
                  {step.users}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Événements récents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Top Événements</h3>
            {data.events.length > 0 ? (
              <div className="space-y-2">
                {data.events.map((event, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700">{event.type}</span>
                    <span className="font-semibold text-blue-600">{event.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun événement encore</p>
            )}
          </div>

          {/* Métriques IA */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🤖 Métriques IA</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Appels totaux</span>
                <span className="font-semibold">{data.ai.totalCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Latence moyenne</span>
                <span className="font-semibold">{data.ai.avgLatencyMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coût total</span>
                <span className="font-semibold">${data.ai.totalCostUsd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux d'erreur</span>
                <span className={`font-semibold ${data.ai.errorRate === '0%' ? 'text-green-600' : 'text-red-600'}`}>
                  {data.ai.errorRate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Comment tester ?</h3>
          <ol className="text-blue-700 space-y-1">
            <li>1. Va sur <a href="http://localhost:3001" className="underline">l'app principale</a></li>
            <li>2. Upload quelques photos</li>
            <li>3. Navigue entre les étapes</li>
            <li>4. Reviens ici voir les métriques se remplir !</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
