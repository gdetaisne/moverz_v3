"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomGroup, PhotoData, RoomValidationResult } from '@/lib/roomValidation';
import { SmartRoomClassificationService } from '@/services/smartRoomClassificationService';
import { RoomGroupCard } from './RoomGroupCard';

interface RoomValidationStepProps {
  photos: PhotoData[];
  onValidationComplete: (roomGroups: RoomGroup[]) => void;
  onPrevious: () => void;
  className?: string;
}

export function RoomValidationStep({ 
  photos, 
  onValidationComplete, 
  onPrevious,
  className = "" 
}: RoomValidationStepProps) {
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<RoomValidationResult | null>(null);
  const [classificationService] = useState(() => new SmartRoomClassificationService());

  // Auto-classification au montage du composant
  useEffect(() => {
    if (photos.length > 0 && roomGroups.length === 0) {
      handleAutoClassify();
    }
  }, [photos]);

  const handleAutoClassify = async () => {
    setIsValidating(true);
    try {
      console.log('🏠 Début de la classification automatique...');
      const groups = await classificationService.classifyPhotos(photos);
      setRoomGroups(groups);
      
      const validation = await classificationService.validateRoomGroups(groups);
      setValidationResult(validation);
      
      console.log('✅ Classification terminée:', groups.length, 'groupes');
    } catch (error) {
      console.error('❌ Erreur lors de la classification:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRoomTypeChange = (groupId: string, newRoomType: string) => {
    setRoomGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            roomType: newRoomType, 
            isUserValidated: true,
            lastModified: new Date()
          }
        : group
    ));
  };

  const handlePhotoMove = (photoId: string, fromGroupId: string, toGroupId: string) => {
    setRoomGroups(prev => {
      const newGroups = [...prev];
      const fromGroup = newGroups.find(g => g.id === fromGroupId);
      const toGroup = newGroups.find(g => g.id === toGroupId);
      
      if (fromGroup && toGroup) {
        const photo = fromGroup.photos.find(p => p.id === photoId);
        if (photo) {
          // Retirer de l'ancien groupe
          fromGroup.photos = fromGroup.photos.filter(p => p.id !== photoId);
          fromGroup.isUserValidated = true;
          fromGroup.lastModified = new Date();
          
          // Ajouter au nouveau groupe
          toGroup.photos.push({ ...photo, roomType: toGroup.roomType });
          toGroup.isUserValidated = true;
          toGroup.lastModified = new Date();
        }
      }
      
      return newGroups;
    });
  };

  const handleValidationComplete = async () => {
    const validatedGroups = roomGroups.filter(g => g.photos.length > 0);
    
    // 🎯 NOUVELLE LOGIQUE : Lancer l'analyse d'objets par groupe de pièces
    console.log('🚀 Lancement des analyses d\'objets par pièce...');
    
    try {
      setIsValidating(true);
      
      // Analyser chaque groupe de pièces
      for (const group of validatedGroups) {
        console.log(`🏠 Analyse pièce "${group.roomType}" avec ${group.photos.length} photos`);
        
        const response = await fetch('/api/photos/analyze-by-room', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': 'dev-user' // TODO: Récupérer le vrai userId
          },
          body: JSON.stringify({
            roomType: group.roomType,
            photoIds: group.photos.map(p => p.photoId || p.id)
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur analyse pièce ${group.roomType}`);
        }
        
        const result = await response.json();
        console.log(`✅ Pièce "${group.roomType}" analysée: ${result.items?.length || 0} objets`);
      }
      
      console.log('✅ Toutes les analyses d\'objets terminées');
      onValidationComplete(validatedGroups);
      
    } catch (error) {
      console.error('❌ Erreur lors des analyses d\'objets:', error);
      // Continuer quand même pour ne pas bloquer l'utilisateur
      onValidationComplete(validatedGroups);
    } finally {
      setIsValidating(false);
    }
  };

  const canProceed = roomGroups.length > 0 && roomGroups.every(g => g.photos.length > 0);

  return (
    <div className={`room-validation-step ${className}`}>
      <div className="step-header">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🏠 Valider les pièces détectées
        </h2>
        <p className="text-gray-600 mb-6">
          Vérifiez et corrigez la classification automatique de vos photos
        </p>
      </div>

      {/* Statistiques de validation */}
      {validationResult && (
        <div className="validation-stats bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{validationResult.totalPhotos}</div>
              <div className="text-gray-600">Photos totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validationResult.validatedGroups}</div>
              <div className="text-gray-600">Groupes validés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{validationResult.uncertainGroups}</div>
              <div className="text-gray-600">Groupes incertains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{validationResult.suggestions.length}</div>
              <div className="text-gray-600">Suggestions</div>
            </div>
          </div>
        </div>
      )}

      {/* Groupes de pièces */}
      <div className="room-groups-container space-y-4 mb-6">
        <AnimatePresence>
          {roomGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <RoomGroupCard
                group={group}
                onRoomTypeChange={(newRoomType) => handleRoomTypeChange(group.id, newRoomType)}
                onPhotoMove={(photoId, toGroupId) => handlePhotoMove(photoId, group.id, toGroupId)}
                availableGroups={roomGroups}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="validation-actions flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={onPrevious}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Retour
          </button>
          
          <button
            onClick={handleAutoClassify}
            disabled={isValidating}
            className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? (
              <>
                <span className="animate-spin mr-2">🔄</span>
                Classification...
              </>
            ) : (
              <>
                🤖 Reclassifier automatiquement
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleValidationComplete}
          disabled={!canProceed}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          ✅ Valider et continuer
        </button>
      </div>

      {/* Message d'aide */}
      {!canProceed && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Conseil :</strong> Assurez-vous que toutes les photos sont correctement classées avant de continuer.
            Vous pouvez déplacer les photos entre les groupes ou modifier le type de pièce.
          </p>
        </div>
      )}
    </div>
  );
}
