"use client";
import React, { useState, useEffect } from 'react';
import { userSession } from '@/lib/auth-client';
import { StorageCleanup } from '@/lib/user-storage';

interface UserTestPanelProps {
  className?: string;
}

export function UserTestPanel({ className = "" }: UserTestPanelProps) {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [email, setEmail] = useState('');

  // Charger les informations de session
  useEffect(() => {
    const sessionInfo = userSession.getSessionInfo();
    setCurrentUserId(sessionInfo.userId);
    setIsTemporary(sessionInfo.isTemporary);
    
    // Charger les statistiques de stockage
    setStorageStats(StorageCleanup.getStorageStats());
  }, []);

  // Fonction pour basculer vers un utilisateur de test
  const switchToTestUser = (userId: string) => {
    userSession.loginWithEmail(userId + '@test.com');
    const newSessionInfo = userSession.getSessionInfo();
    setCurrentUserId(newSessionInfo.userId);
    setIsTemporary(newSessionInfo.isTemporary);
    setStorageStats(StorageCleanup.getStorageStats());
    
    // Recharger la page pour appliquer les changements
    window.location.reload();
  };

  // Fonction pour migrer vers un utilisateur permanent
  const migrateToPermanent = async () => {
    if (!email) {
      alert('Veuillez saisir un email');
      return;
    }

    try {
      const response = await fetch('/api/user/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Migration réussie ! Nouvel ID: ${data.permanentUserId}`);
        window.location.reload();
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  // Fonction pour nettoyer le stockage
  const clearStorage = () => {
    StorageCleanup.clearAllUserData();
    setStorageStats(StorageCleanup.getStorageStats());
    alert('Stockage nettoyé !');
  };

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🧪 Panneau de Test Utilisateurs</h3>
      
      <div className="space-y-4">
        {/* Informations actuelles */}
        <div className="bg-white rounded-lg p-3 border">
          <h4 className="font-medium text-gray-700 mb-2">Session actuelle</h4>
          <div className="text-sm space-y-1">
            <p><strong>User ID:</strong> <code className="bg-gray-100 px-1 rounded">{currentUserId}</code></p>
            <p><strong>Type:</strong> <span className={isTemporary ? 'text-orange-600' : 'text-green-600'}>
              {isTemporary ? '🕐 Temporaire' : '✅ Permanent'}
            </span></p>
          </div>
        </div>

        {/* Statistiques de stockage */}
        {storageStats && (
          <div className="bg-white rounded-lg p-3 border">
            <h4 className="font-medium text-gray-700 mb-2">Stockage localStorage</h4>
            <div className="text-sm space-y-1">
              <p><strong>Utilisateurs:</strong> {storageStats.users.length}</p>
              <p><strong>Clés totales:</strong> {storageStats.userKeys}</p>
              <p><strong>Taille:</strong> {(storageStats.totalSize / 1024).toFixed(2)} KB</p>
              {storageStats.users.length > 0 && (
                <p><strong>Users:</strong> {storageStats.users.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Boutons de test */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Basculer vers un utilisateur de test</h4>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => switchToTestUser('claude-user')}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              👤 Claude
            </button>
            <button
              onClick={() => switchToTestUser('guillaume-user')}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              👤 Guillaume
            </button>
            <button
              onClick={() => {
                userSession.logout();
                window.location.reload();
              }}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              🆕 Nouveau temporaire
            </button>
          </div>
        </div>

        {/* Migration vers permanent */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Migrer vers utilisateur permanent</h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={migrateToPermanent}
              disabled={!email}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Migrer
            </button>
          </div>
        </div>

        {/* Actions de maintenance */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Actions de maintenance</h4>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                // Revenir à l'étape 1 en rechargeant la page
                window.location.href = '/';
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔄 Retour Étape 1
            </button>
            <button
              onClick={clearStorage}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              🗑️ Nettoyer stockage
            </button>
            <button
              onClick={() => {
                StorageCleanup.clearLegacyData();
                alert('Données legacy nettoyées !');
              }}
              className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              🧹 Nettoyer legacy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
