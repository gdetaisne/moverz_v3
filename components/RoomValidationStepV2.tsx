"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomGroup, PhotoData, ROOM_TYPES } from '@core/roomValidation';
import { classifyRoom } from '@ai/adapters/smartRoomClassificationService';
import { resolvePhotoSrc } from '@/lib/imageUrl';

// Composant image unifié basé sur le système qui fonctionnait
function UnifiedImage({ photo, className }: { photo: PhotoData; className: string }) {
  // Logique simple et directe comme PhotoCard et PhotoThumbnail
  const getImageSrc = () => {
    // 1. Si nouveau upload (file object), utiliser blob URL
    if (photo.file) {
      return URL.createObjectURL(photo.file);
    }
    
    // 2. Sinon, résoudre via resolvePhotoSrc (gère url, filePath, photoId)
    const src = resolvePhotoSrc(photo);
    if (src) return src;
    
    // 3. Dernier recours : placeholder
    return '/placeholder-image.svg';
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    // console.log('❌ UnifiedImage: Erreur de chargement pour:', target.src);
    
    // Si l'URL était avec .jpeg, essayer .jpg
    if (target.src.includes('.jpeg')) {
      const newSrc = target.src.replace('.jpeg', '.jpg');
      // console.log('🔄 UnifiedImage: Tentative avec .jpg:', newSrc);
      target.src = newSrc;
    } else {
      // Sinon, utiliser le placeholder
      // console.log('🔄 UnifiedImage: Utilisation placeholder après erreur');
      target.src = '/placeholder-image.svg';
    }
  };

  const imageSrc = getImageSrc();
  
  return (
    <img
      src={imageSrc}
      alt={`Photo ${photo.id}`}
      className={className}
      onError={handleError}
      onLoad={() => {
        // console.log('✅ UnifiedImage: Image chargée avec succès:', imageSrc);
      }}
    />
  );
}

interface RoomValidationStepV2Props {
  photos: PhotoData[];
  userId: string; // Ajout du userId pour les appels API
  onValidationComplete: (roomGroups: RoomGroup[]) => void;
  onPrevious: () => void;
  onPhotosUpdated?: (updatedPhotos: PhotoData[]) => void; // Nouvelle prop pour recharger les photos
  className?: string;
}

export function RoomValidationStepV2({ 
  photos, 
  userId,
  onValidationComplete, 
  onPrevious,
  onPhotosUpdated,
  className = ""
}: RoomValidationStepV2Props) {
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [draggedPhoto, setDraggedPhoto] = useState<PhotoData | null>(null);
  const [dragOverRoom, setDragOverRoom] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomType, setNewRoomType] = useState('autre');
  const [classificationService] = useState(() => ({ classifyRoom }));
  const [analyzingRooms, setAnalyzingRooms] = useState<Set<string>>(new Set());
  const [completedRooms, setCompletedRooms] = useState<Set<string>>(new Set());

  // Auto-classification au montage - seulement une fois
  useEffect(() => {
    if (photos.length > 0 && roomGroups.length === 0) {
      handleAutoClassify();
    }
  }, [photos.length]); // Seulement dépendre de la longueur, pas des objets photos

  const handleAutoClassify = async () => {
    setIsValidating(true);
    try {
      console.log('🏠 Début de la classification automatique...');
      
      // Utiliser les roomType déjà détectés par l'IA au lieu de reclassifier
      const roomTypeMap = new Map<string, PhotoData[]>();
      
      photos.forEach(photo => {
        const roomType = photo.roomType || 'autre';
        if (!roomTypeMap.has(roomType)) {
          roomTypeMap.set(roomType, []);
        }
        // Transformer la photo pour le composant - GARDER le photoId original
        const transformedPhoto = {
          id: photo.photoId || photo.id || `photo-${Date.now()}-${Math.random()}`,
          file: photo.file,
          fileUrl: photo.fileUrl || (photo.photoId ? `/api/uploads/${photo.photoId}.jpeg` : undefined),
          analysis: photo.analysis,
          status: photo.status,
          error: photo.error,
          selectedItems: photo.selectedItems,
          photoId: photo.photoId || photo.id, // GARDER l'ID original de la DB
          progress: photo.progress,
          roomName: photo.roomName,
          roomConfidence: photo.roomConfidence,
          roomType: photo.roomType
        };
        
        // Debug temporaire
        console.log('🔍 Photo transformée:', {
          id: transformedPhoto.id,
          photoId: transformedPhoto.photoId,
          fileUrl: transformedPhoto.fileUrl,
          hasFile: !!photo.file
        });
        roomTypeMap.get(roomType)!.push(transformedPhoto);
      });
      
      const groups: RoomGroup[] = Array.from(roomTypeMap.entries()).map(([roomType, groupPhotos]) => ({
        id: `group-${roomType}-${Date.now()}`,
        roomType,
        photos: groupPhotos,
        confidence: 0.9, // Confiance élevée car basée sur l'IA
        isUserValidated: false,
        lastModified: new Date()
      }));
      
      setRoomGroups(groups);
      console.log('✅ Classification terminée basée sur l\'IA:', groups.length, 'groupes');
      console.log('Groupes créés:', groups.map(g => `${g.roomType} (${g.photos.length} photos)`));
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
    console.log(`🔍 movePhotoToRoom: photoId=${photoId}, targetRoomId=${targetRoomId}`);
    
    setRoomGroups(prev => {
      const newGroups = [...prev];
      
      // 1️⃣ CHERCHER la photo AVANT de la retirer
      let photoToMove: PhotoData | null = null;
      let sourceGroupId: string | null = null;
      
      for (const group of newGroups) {
        const found = group.photos.find(p => p.id === photoId);
        if (found) {
          photoToMove = found;
          sourceGroupId = group.id;
          console.log(`🔍 Photo trouvée dans ${group.roomType}`);
          break;
        }
      }
      
      // Si pas trouvée, chercher dans le tableau photos original (fallback)
      if (!photoToMove) {
        const originalPhoto = photos.find(p => p.photoId === photoId || p.id === photoId);
        if (originalPhoto) {
          console.log(`⚠️ Photo non trouvée dans roomGroups, utilisation fallback depuis props`);
          photoToMove = {
            id: originalPhoto.photoId || originalPhoto.id || `photo-${Date.now()}-${Math.random()}`,
            file: originalPhoto.file,
            fileUrl: originalPhoto.fileUrl || (originalPhoto.photoId ? `/api/uploads/${originalPhoto.photoId}.jpeg` : undefined),
            analysis: originalPhoto.analysis,
            status: originalPhoto.status,
            error: originalPhoto.error,
            selectedItems: originalPhoto.selectedItems,
            photoId: originalPhoto.photoId || originalPhoto.id,
            progress: originalPhoto.progress,
            roomName: originalPhoto.roomName,
            roomConfidence: originalPhoto.roomConfidence,
            roomType: originalPhoto.roomType
          };
        }
      }
      
      if (!photoToMove) {
        console.error(`❌ Photo ${photoId} introuvable !`);
        return prev;
      }
      
      // 2️⃣ Vérifier que la pièce cible existe
      const targetGroup = newGroups.find(g => g.id === targetRoomId);
      if (!targetGroup) {
        console.error(`❌ Pièce cible ${targetRoomId} non trouvée !`);
        return prev;
      }
      
      // 3️⃣ Si la photo est déjà dans la pièce cible, ne rien faire
      if (sourceGroupId === targetRoomId) {
        console.log(`ℹ️ Photo déjà dans la pièce ${targetGroup.roomType}, aucune action`);
        return prev;
      }
      
      // 4️⃣ RETIRER la photo de sa pièce source
      newGroups.forEach(group => {
        const beforeCount = group.photos.length;
        group.photos = group.photos.filter(p => p.id !== photoId);
        const afterCount = group.photos.length;
        if (beforeCount !== afterCount) {
          console.log(`🗑️ Photo ${photoId} retirée de ${group.roomType} (${beforeCount} → ${afterCount})`);
        }
      });
      
      // 5️⃣ AJOUTER à la pièce cible
      targetGroup.photos.push(photoToMove);
      targetGroup.lastModified = new Date();
      console.log(`✅ Photo ${photoId} déplacée vers ${targetGroup.roomType} (${targetGroup.photos.length} photos)`);
      
      // 6️⃣ Supprimer les pièces vides après le drag & drop
      return newGroups.filter(group => group.photos.length > 0);
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
    
    // Créer une image de drag personnalisée
    const dragImage = (e.target as HTMLElement).cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 50);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, roomId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRoom(roomId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Ne réinitialiser que si on quitte vraiment le conteneur parent
    // (pas juste un élément enfant)
    if (e.currentTarget === e.target) {
      setDragOverRoom(null);
    }
  };

  const handleDrop = (e: React.DragEvent, roomId: string) => {
    e.preventDefault();
    if (draggedPhoto) {
      console.log(`🔄 Drop: Photo ${draggedPhoto.id} vers pièce ${roomId}`);
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
      setCompletedRooms(new Set());
      
      // Analyser tous les groupes de pièces EN PARALLÈLE
      console.log(`🚀 Lancement de ${validatedGroups.length} analyses en parallèle...`);
      
      // Marquer toutes les pièces comme en cours d'analyse
      setAnalyzingRooms(new Set(validatedGroups.map(g => g.id)));
      
      const analysisPromises = validatedGroups.map(async (group) => {
        console.log(`🏠 Analyse pièce "${group.roomType}" avec ${group.photos.length} photos`);
        
        const response = await fetch('/api/photos/analyze-by-room', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({
            roomType: group.roomType,
            photoIds: group.photos.map(p => p.photoId).filter(id => id) // Utiliser seulement les vrais photoIds de la DB
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur analyse pièce ${group.roomType}`);
        }
        
        const result = await response.json();
        console.log(`✅ Pièce "${group.roomType}" analysée: ${result.items?.length || 0} objets`);
        
        // Marquer cette pièce comme complétée
        setCompletedRooms(prev => new Set([...prev, group.id]));
        
        return result;
      });
      
      // Attendre que toutes les analyses se terminent
      const results = await Promise.all(analysisPromises);
      console.log(`🎉 Toutes les analyses terminées: ${results.length} pièces analysées`);
      
      console.log('✅ Toutes les analyses d\'objets terminées');
      
      // Recharger les photos depuis la base de données AVANT de passer à l'étape suivante
      if (onPhotosUpdated) {
        try {
          const response = await fetch('/api/photos', {
            headers: { 'x-user-id': userId }
          });
          if (response.ok) {
            const updatedPhotos = await response.json();
            console.log('🔄 Photos rechargées depuis la DB:', updatedPhotos.length);
            
            // Transformer les photos de la DB vers le format attendu par l'interface
            const transformedPhotos = updatedPhotos.map((photo: any) => ({
              id: photo.id,
              photoId: photo.id,
              file: null, // Pas de file object pour les photos de la DB
              fileUrl: photo.url.startsWith('http') ? photo.url : `http://localhost:3001${photo.url}`,
              analysis: photo.analysis,
              status: 'completed' as const,
              error: undefined,
              selectedItems: new Set(),
              progress: 100,
              roomName: photo.roomType,
              roomConfidence: 0.9,
              roomType: photo.roomType,
              userId: userId
            }));
            
            // Debug: vérifier les analyses
            const photosWithAnalysis = transformedPhotos.filter(p => p.analysis && p.analysis.items && p.analysis.items.length > 0);
            console.log(`🔄 Photos transformées: ${transformedPhotos.length}, avec analyse: ${photosWithAnalysis.length}`);
            console.log('🔄 Première photo avec analyse:', photosWithAnalysis[0] ? {
              id: photosWithAnalysis[0].id,
              roomType: photosWithAnalysis[0].roomType,
              itemsCount: photosWithAnalysis[0].analysis?.items?.length
            } : 'Aucune');
            
            console.log('🔄 Appel onPhotosUpdated avec', transformedPhotos.length, 'photos');
            onPhotosUpdated(transformedPhotos);
            
            // Attendre un peu pour que l'interface se mette à jour
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error('❌ Erreur rechargement photos:', error);
        }
      }
      
      // Mettre à jour les roomGroups avec les résultats des analyses
      const updatedGroups = validatedGroups.map((group, index) => {
        const analysisResult = results[index];
        return {
          ...group,
          photos: group.photos.map(photo => ({
            ...photo,
            analysis: analysisResult
          }))
        };
      });
      
      setRoomGroups(updatedGroups);
      
      // Maintenant passer à l'étape suivante avec les groupes mis à jour
      onValidationComplete(updatedGroups);
      
    } catch (error) {
      console.error('❌ Erreur lors des analyses d\'objets:', error);
      // En cas d'erreur, passer quand même les groupes validés (sans analyses)
      onValidationComplete(validatedGroups);
    } finally {
      setIsValidating(false);
      setAnalyzingRooms(new Set());
      setCompletedRooms(new Set());
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
          className="inline-flex items-center px-6 py-3 bg-brand-accent text-white font-medium rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg"
          style={{ backgroundColor: '#2b7a78' }}
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
                    className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:brightness-110 transition-all duration-200"
                    style={{ backgroundColor: '#2b7a78' }}
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
            isAnalyzing={analyzingRooms.has(group.id)}
            isCompleted={completedRooms.has(group.id)}
          />
        ))}
      </div>


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
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          style={{ backgroundColor: '#2b7a78' }}
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
  onPhotoDragStart,
  isAnalyzing,
  isCompleted
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
  isAnalyzing?: boolean;
  isCompleted?: boolean;
}) {
  const roomTypeInfo = ROOM_TYPES.find(t => t.value === group.roomType);

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 relative ${
        isDragOver 
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      layout
      animate={{
        scale: isDragOver ? 1.02 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Indicateur de zone de drop */}
      {isDragOver && (
        <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-xl pointer-events-none z-10 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
              📥 Déposer ici
            </div>
          </div>
        </div>
      )}
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

      {/* Barre de progression */}
      {(isAnalyzing || isCompleted) && (
        <div className="px-4 pb-3">
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                initial={{ width: '0%' }}
                animate={{ 
                  width: isCompleted ? '100%' : '80%',
                }}
                transition={{ 
                  duration: isCompleted ? 0.3 : 2,
                  ease: isCompleted ? 'easeOut' : 'linear'
                }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1 text-center">
              {isCompleted ? '✅ Analyse terminée' : '🔄 Analyse des objets en cours...'}
            </p>
          </div>
        </div>
      )}

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
            {group.photos.map((photo) => {
              const isBeingDragged = draggedPhoto?.id === photo.id;
              return (
                <motion.div
                  key={photo.id}
                  className={`relative group transition-opacity duration-200 select-none ${
                    isBeingDragged ? 'opacity-30' : 'opacity-100'
                  }`}
                  layout
                >
                  <div 
                    className="relative cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => onPhotoDragStart(e, photo)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <UnifiedImage
                      photo={photo}
                      className="w-full h-20 object-cover rounded-lg shadow-sm border border-gray-200 pointer-events-none"
                    />
                  
                  {/* Overlay au survol */}
                  {!isBeingDragged && (
                    <div className="absolute inset-0 group-hover:bg-black group-hover:bg-opacity-25 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-lg">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Badge "En déplacement" */}
                  {isBeingDragged && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-700 bg-white px-2 py-1 rounded-full shadow">
                        📦 Déplacement...
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Texte avec degré de confiance */}
                <p className="text-xs text-gray-600 mt-1 text-center">
                  {(() => {
                    const displayedRoomName = photo.roomName ? photo.roomName.charAt(0).toUpperCase() + photo.roomName.slice(1) :
                                                  (group.roomType === 'autre' ? 'Pièce inconnue' : group.roomType.charAt(0).toUpperCase() + group.roomType.slice(1));
                    let confidenceText = '';
                    if (photo.roomConfidence !== undefined && photo.roomConfidence !== null) {
                      const percentage = Math.round(photo.roomConfidence * 100);
                      confidenceText = ` (${percentage}%)`;
                    }
                    return `${displayedRoomName}${confidenceText}`;
                  })()}
                </p>
              </motion.div>
            );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

