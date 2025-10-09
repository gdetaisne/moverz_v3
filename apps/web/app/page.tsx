/**
 * 🏠 Home page
 */

'use client';

import Link from 'next/link';
import { isAuthenticated } from '../lib/helpers';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return null;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Authentification requise
            </h1>
            <p className="text-gray-600">
              Veuillez configurer <code className="bg-gray-100 px-2 py-1 rounded text-sm">NEXT_PUBLIC_ADMIN_BYPASS_TOKEN</code> dans vos variables d'environnement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero section */}
          <div className="text-center mb-16">
            <div className="w-24 h-24 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-5xl font-bold">M</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Bienvenue sur Moverz v4
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Estimez votre déménagement automatiquement grâce à l'IA
            </p>
            <Link
              href="/upload"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              Commencer maintenant →
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload de photos
              </h3>
              <p className="text-sm text-gray-600">
                Importez vos photos et laissez l'IA détecter automatiquement vos objets
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Inventaire intelligent
              </h3>
              <p className="text-sm text-gray-600">
                Visualisez et modifiez votre inventaire détecté automatiquement
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Devis instantané
              </h3>
              <p className="text-sm text-gray-600">
                Obtenez une estimation précise en quelques secondes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
