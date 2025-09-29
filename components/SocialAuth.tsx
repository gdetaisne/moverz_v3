"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'google' | 'facebook';
}

interface SocialAuthProps {
  onAuthSuccess: (user: User) => void;
  onAuthError: (error: string) => void;
}

export default function SocialAuth({ onAuthSuccess, onAuthError }: SocialAuthProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Simulation de l'authentification Google
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // Simulation d'un délai d'authentification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données simulées d'un utilisateur Google
      const mockUser: User = {
        id: 'google_' + Date.now(),
        name: 'Jean Dupont',
        email: 'jean.dupont@gmail.com',
        picture: 'https://via.placeholder.com/40x40/4285f4/ffffff?text=JD',
        provider: 'google'
      };
      
      onAuthSuccess(mockUser);
    } catch (error) {
      onAuthError('Erreur lors de la connexion Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulation de l'authentification Facebook
  const handleFacebookAuth = async () => {
    setIsLoading(true);
    try {
      // Simulation d'un délai d'authentification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données simulées d'un utilisateur Facebook
      const mockUser: User = {
        id: 'facebook_' + Date.now(),
        name: 'Marie Martin',
        email: 'marie.martin@facebook.com',
        picture: 'https://via.placeholder.com/40x40/1877f2/ffffff?text=MM',
        provider: 'facebook'
      };
      
      onAuthSuccess(mockUser);
    } catch (error) {
      onAuthError('Erreur lors de la connexion Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connectez-vous pour continuer
        </h3>
        <p className="text-sm text-gray-600">
          Utilisez votre compte Google ou Facebook pour accélérer le processus
        </p>
      </div>

      <div className="space-y-3">
        {/* Bouton Google */}
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </>
          )}
        </button>

        {/* Bouton Facebook */}
        <button
          onClick={handleFacebookAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continuer avec Facebook
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">ou</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Vous pouvez aussi continuer sans compte
        </p>
        <button
          onClick={() => onAuthSuccess({
            id: 'guest_' + Date.now(),
            name: '',
            email: '',
            provider: 'google' // Pour la compatibilité
          })}
          className="mt-2 text-sm text-blue-600 hover:text-blue-500 underline"
        >
          Continuer en tant qu'invité
        </button>
      </div>
    </div>
  );
}
