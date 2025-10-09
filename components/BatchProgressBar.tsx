'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BatchProgress } from '@/hooks/useBatchProgress';

interface BatchProgressBarProps {
  progress: BatchProgress;
  showPhotos?: boolean;
  className?: string;
}

/**
 * Composant pour afficher la progression d'un batch en temps réel
 */
export function BatchProgressBar({ 
  progress, 
  showPhotos = true, 
  className = '' 
}: BatchProgressBarProps) {
  // Couleur selon statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          bg: 'bg-green-500',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-800',
          border: 'border-green-200',
        };
      case 'PROCESSING':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800',
          border: 'border-blue-200',
        };
      case 'PARTIAL':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-800',
          badge: 'bg-orange-100 text-orange-800',
          border: 'border-orange-200',
        };
      case 'FAILED':
        return {
          bg: 'bg-red-500',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800',
          border: 'border-red-200',
        };
      case 'QUEUED':
      default:
        return {
          bg: 'bg-gray-400',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800',
          border: 'border-gray-200',
        };
    }
  };

  // Texte du statut en français
  const getStatusText = (status: string) => {
    switch (status) {
      case 'QUEUED': return 'En attente';
      case 'PROCESSING': return 'En cours';
      case 'PARTIAL': return 'Partiel';
      case 'COMPLETED': return 'Terminé';
      case 'FAILED': return 'Échoué';
      default: return status;
    }
  };

  // Icône pour les photos
  const getPhotoIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'PROCESSING':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'ERROR':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'PENDING':
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const colors = getStatusColor(progress.status);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header avec statut */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Traitement du lot
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.badge}`}>
            {getStatusText(progress.status)}
          </span>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {progress.progress}%
          </div>
          <div className="text-sm text-gray-500">
            {progress.counts.completed + progress.counts.failed}/{progress.counts.total} photos
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
        <motion.div
          className={`absolute top-0 left-0 h-full ${colors.bg}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">{progress.counts.queued}</div>
          <div className="text-xs text-gray-500 uppercase">En attente</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{progress.counts.processing}</div>
          <div className="text-xs text-gray-500 uppercase">En cours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{progress.counts.completed}</div>
          <div className="text-xs text-gray-500 uppercase">Réussis</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">{progress.counts.failed}</div>
          <div className="text-xs text-gray-500 uppercase">Échoués</div>
        </div>
      </div>

      {/* Liste des photos */}
      {showPhotos && progress.photos.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Photos</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {progress.photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  photo.status === 'ERROR' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getPhotoIcon(photo.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {photo.filename}
                    </p>
                    {photo.roomType && (
                      <p className="text-xs text-gray-500">
                        {photo.roomType.replace('_', ' ')}
                      </p>
                    )}
                    {photo.errorCode && (
                      <p className="text-xs text-red-600 mt-1">
                        {photo.errorMessage || photo.errorCode}
                      </p>
                    )}
                  </div>
                </div>
                
                <span className={`ml-3 text-xs font-medium px-2 py-1 rounded ${
                  photo.status === 'DONE' ? 'bg-green-100 text-green-800' :
                  photo.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                  photo.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {photo.status === 'PENDING' ? 'En attente' :
                   photo.status === 'PROCESSING' ? 'Traitement...' :
                   photo.status === 'DONE' ? 'OK' :
                   'Erreur'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Résumé inventaire (si disponible) */}
      {progress.inventorySummary && (
        <div className="border-t mt-4 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Inventaire</h4>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {progress.inventorySummary.totalItems}
                </div>
                <div className="text-xs text-gray-600">Objets détectés</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {progress.inventorySummary.totalVolume} m³
                </div>
                <div className="text-xs text-gray-600">Volume total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {progress.inventorySummary.rooms.length}
                </div>
                <div className="text-xs text-gray-600">Pièces</div>
              </div>
            </div>
            
            {progress.inventorySummary.rooms.length > 0 && (
              <div className="space-y-2">
                {progress.inventorySummary.rooms.map((room, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700 capitalize">
                      {room.roomType.replace('_', ' ')}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {room.itemsCount} objets · {room.volume_m3} m³
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



