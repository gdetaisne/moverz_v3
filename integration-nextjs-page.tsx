// Page Next.js pour intégration dans moverz.fr
// À copier dans votre projet Next.js (app/inventaire-ia/page.tsx)

import React from 'react';

export default function InventaireIAPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inventaire IA
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Analyse automatique de vos objets pour un déménagement optimisé
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Powered by</span>
                <span className="text-lg font-semibold text-blue-600">Moverz AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <a href="/" className="text-gray-400 hover:text-gray-500">
                  Accueil
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">Inventaire IA</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            src="https://moverz-v3.vercel.app/"
            allow="camera; microphone; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            title="Inventaire IA - Analyse automatique des objets"
            className="w-full h-screen min-h-[600px] border-0"
          />
        </div>
      </div>

      {/* Features section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Une solution simple et efficace pour votre inventaire de déménagement
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                1. Prenez des photos
              </h3>
              <p className="text-gray-600">
                Photographiez vos pièces et objets depuis votre smartphone
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                2. Analyse IA
              </h3>
              <p className="text-gray-600">
                Notre IA détecte et analyse automatiquement tous vos objets
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                3. Inventaire complet
              </h3>
              <p className="text-gray-600">
                Obtenez un inventaire détaillé avec dimensions et volumes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
