"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomGroup, PhotoData, ROOM_TYPES } from '@/lib/roomValidation';
import { SmartRoomClassificationService } from '@/services/smartRoomClassificationService';

interface RoomValidationStepV2Props {
  photos: PhotoData[];
  onValidationComplete: (roomGroups: RoomGroup[]) => void;
  onPrevious: () => void;
  className?: string;
}

export function RoomValidationStepV2({ 
  photos, 
  onValidationComplete, 
  onPrevious,
  className = "" 
}: RoomValidationStepV2Props) {
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [draggedPhoto, setDraggedPhoto] = useState<PhotoData | null>(null);
  const [dragOverRoom, setDragOverRoom] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomType, setNewRoomType] = useState('autre');
  const [classificationService] = useState(() => new SmartRoomClassificationService());

  // Auto-classification au montage
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
      console.log('✅ Classification terminée:', groups.length, 'groupes');
    } catch (error) {
      console.error('❌ Erreur lors de la classification:', error);
      // Créer un groupe par défaut
      setRoomGroups([{
        id: 'group-other',
        roomType: 'autre',
        photos: photos,
        confidence: 0.5,
        isUserValidated: false,
        lastModified: new Date()
      }]);
    } finally {
      setIsValidating(false);
    }
  };

  // Créer une nouvelle pièce
  const createNewRoom = useCallback(() => {
    const newGroup: RoomGroup = {
      id: `group-${newRoomType}-${Date.now()}`,
      roomType: newRoomType,
      photos: [],
      confidence: 1.0, // Confiance maximale pour une pièce créée manuellement
      isUserValidated: true,
      lastModified: new Date()
    };
    
    setRoomGroups(prev => [...prev, newGroup]);
    setShowCreateRoom(false);
    setNewRoomType('autre');
  }, [newRoomType]);

  // Déplacer une photo vers une pièce
  const movePhotoToRoom = useCallback((photoId: string, targetRoomId: string) => {
    setRoomGroups(prev => {
      const newGroups = [...prev];
      
      // Retirer la photo de sa pièce actuelle
      newGroups.forEach(group => {
        group.photos = group.photos.filter(p => p.id !== photoId);
      });
      
      // Ajouter la photo à la pièce cible
      const targetGroup = newGroups.find(g => g.id === targetRoomId);
      if (targetGroup) {
        const photo = photos.find(p => p.id === photoId);
        if (photo) {
          targetGroup.photos.push(photo);
          targetGroup.lastModified = new Date();
        }
      }
      
      // Supprimer les pièces vides
      return newGroups.filter(g => g.photos.length > 0);
    });
  }, [photos]);

  // Changer le type de pièce
  const changeRoomType = useCallback((roomId: string, newType: string) => {
    setRoomGroups(prev => prev.map(group => 
      group.id === roomId 
        ? { ...group, roomType: newType, isUserValidated: true, lastModified: new Date() }
        : group
    ));
  }, []);

  // Supprimer une pièce
  const deleteRoom = useCallback((roomId: string) => {
    setRoomGroups(prev => {
      const groupToDelete = prev.find(g => g.id === roomId);
      if (!groupToDelete) return prev;
      
      // Redistribuer les photos dans "Autre"
      let otherGroup = prev.find(g => g.roomType === 'autre');
      if (!otherGroup) {
        otherGroup = {
          id: 'group-other',
          roomType: 'autre',
          photos: [],
          confidence: 0.5,
          isUserValidated: true,
          lastModified: new Date()
        };
        prev.push(otherGroup);
      }
      
      otherGroup.photos.push(...groupToDelete.photos);
      otherGroup.lastModified = new Date();
      
      return prev.filter(g => g.id !== roomId);
    });
  }, []);

  // Gestion du drag & drop
  const handleDragStart = (e: React.DragEvent, photo: PhotoData) => {
    setDraggedPhoto(photo);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, roomId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRoom(roomId);
  };

  const handleDragLeave = () => {
    setDragOverRoom(null);
  };

  const handleDrop = (e: React.DragEvent, roomId: string) => {
    e.preventDefault();
    if (draggedPhoto) {
      movePhotoToRoom(draggedPhoto.id, roomId);
    }
    setDraggedPhoto(null);
    setDragOverRoom(null);
  };

  // Validation finale
  const handleValidationComplete = async () => {
    const validatedGroups = roomGroups.filter(g => g.photos.length > 0);
    
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
            'x-user-id': 'dev-user'
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
      onValidationComplete(validatedGroups);
    } finally {
      setIsValidating(false);
    }
  };

  const canProceed = roomGroups.length > 0 && roomGroups.every(g => g.photos.length > 0);

  if (isValidating && roomGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Classification des photos en cours...</p>
      </div>
    );
  }

  return (
    <div className={`room-validation-step-v2 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🏠 Organisez vos photos par pièce
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          L'IA a classé vos photos automatiquement. Vous pouvez maintenant les réorganiser, 
          créer de nouvelles pièces ou modifier les types de pièces.
        </p>
      </div>

      {/* Bouton créer nouvelle pièce */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setShowCreateRoom(true)}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Créer une nouvelle pièce
        </button>
      </div>

      {/* Modal création pièce */}
      <AnimatePresence>
        {showCreateRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateRoom(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-96 max-w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Créer une nouvelle pièce</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de pièce
                  </label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROOM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateRoom(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={createNewRoom}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grille des pièces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {roomGroups.map((group) => (
          <RoomGroupCardV2
            key={group.id}
            group={group}
            onRoomTypeChange={(newType) => changeRoomType(group.id, newType)}
            onDelete={() => deleteRoom(group.id)}
            onDragOver={(e) => handleDragOver(e, group.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, group.id)}
            isDragOver={dragOverRoom === group.id}
            draggedPhoto={draggedPhoto}
            onPhotoDragStart={handleDragStart}
          />
        ))}
      </div>

      {/* Photos non classées */}
      {photos.filter(p => !roomGroups.some(g => g.photos.some(photo => photo.id === p.id))).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-yellow-800 mb-2">Photos non classées</h3>
          <p className="text-sm text-yellow-700">
            {photos.filter(p => !roomGroups.some(g => g.photos.some(photo => photo.id === p.id))).length} photo(s) 
            n'ont pas encore été assignées à une pièce.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Précédent
        </button>
        
        <button
          onClick={handleValidationComplete}
          disabled={!canProceed || isValidating}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Analyse en cours...
            </>
          ) : (
            <>
              Valider et continuer
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Composant carte de pièce amélioré
function RoomGroupCardV2({
  group,
  onRoomTypeChange,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  draggedPhoto,
  onPhotoDragStart
}: {
  group: RoomGroup;
  onRoomTypeChange: (newType: string) => void;
  onDelete: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  draggedPhoto: PhotoData | null;
  onPhotoDragStart: (e: React.DragEvent, photo: PhotoData) => void;
}) {
  const roomTypeInfo = ROOM_TYPES.find(t => t.value === group.roomType);

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
        isDragOver 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      layout
    >
      {/* En-tête de la pièce */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{roomTypeInfo?.icon || '🏠'}</span>
            <h3 className="font-semibold text-gray-800">
              {roomTypeInfo?.label || 'Pièce inconnue'}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={group.roomType}
              onChange={(e) => onRoomTypeChange(e.target.value)}
              className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ROOM_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Supprimer cette pièce"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          {group.photos.length} photo{group.photos.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Zone de drop */}
      <div className="p-4 min-h-[200px]">
        {group.photos.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm">Glissez des photos ici</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {group.photos.map((photo) => (
              <motion.div
                key={photo.id}
                className="relative group cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => onPhotoDragStart(e, photo)}
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={photo.fileUrl || URL.createObjectURL(photo.file)}
                  alt={`Photo ${photo.id}`}
                  className="w-full h-20 object-cover rounded-lg shadow-sm border border-gray-200"
                />
                
                {/* Overlay au survol */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-25 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
