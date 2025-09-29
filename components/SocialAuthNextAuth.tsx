"use client";

import { useState } from "react";
import { signIn, getSession } from 'next-auth/react';

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

export default function SocialAuthNextAuth({ onAuthSuccess, onAuthError }: SocialAuthProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Authentification réelle avec NextAuth
  const handleAuth = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    onAuthError(null); // Clear previous errors
    
    try {
      const result = await signIn(provider, { 
        redirect: false,
        callbackUrl: '/'
      });
      
      if (result?.error) {
        onAuthError(`Échec de la connexion avec ${provider}. Veuillez réessayer.`);
        setIsLoading(false);
        return;
      }
      
      // Récupérer la session après connexion
      const session = await getSession();
      if (session?.user) {
        onAuthSuccess({
          id: session.user.id || `user-${provider}-${Date.now()}`,
          name: session.user.name || 'Utilisateur',
          email: session.user.email || '',
          picture: session.user.image,
          provider: provider,
        });
      }
    } catch (error) {
      onAuthError(`Erreur de connexion avec ${provider}. Veuillez réessayer.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback pour la simulation si NextAuth n'est pas configuré
  const simulateAuth = (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    onAuthError(null);
    setTimeout(() => {
      setIsLoading(false);
      if (Math.random() > 0.1) { // 90% success rate
        onAuthSuccess({
          id: `user-${provider}-123`,
          name: provider === 'google' ? 'Jean Dupont' : 'Marie Curie',
          email: provider === 'google' ? 'jean.dupont@example.com' : 'marie.curie@example.com',
          picture: provider === 'google' ? 'https://via.placeholder.com/40/FF0000/FFFFFF?text=JD' : 'https://via.placeholder.com/40/0000FF/FFFFFF?text=MC',
          provider: provider,
        });
      } else {
        onAuthError(`Échec de la connexion avec ${provider}. Veuillez réessayer.`);
      }
    }, 1500);
  };

  return (
    <div className="text-center">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Connectez-vous pour continuer</h3>
      <p className="text-gray-600 mb-8">
        Simplifiez votre demande de devis en vous connectant avec votre compte Google ou Facebook.
      </p>

      <div className="space-y-4">
        <button
          onClick={() => {
            // Essayer NextAuth d'abord, sinon simulation
            if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLIENT_ID) {
              handleAuth('google');
            } else {
              simulateAuth('google');
            }
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="animate-spin mr-3">🔄</span>
          ) : (
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="h-5 w-5 mr-3" />
          )}
          Continuer avec Google
        </button>

        <button
          onClick={() => {
            // Essayer NextAuth d'abord, sinon simulation
            if (process.env.NODE_ENV === 'production' && process.env.FACEBOOK_CLIENT_ID) {
              handleAuth('facebook');
            } else {
              simulateAuth('facebook');
            }
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="animate-spin mr-3">🔄</span>
          ) : (
            <img src="https://www.svgrepo.com/show/355013/facebook.svg" alt="Facebook" className="h-5 w-5 mr-3" />
          )}
          Continuer avec Facebook
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <button
          onClick={() => onAuthSuccess({ id: 'guest-user', name: 'Invité', email: 'guest@example.com', provider: 'google' })}
          disabled={isLoading}
          className="text-blue-600 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuer en tant qu'invité
        </button>
      </div>
    </div>
  );
}
