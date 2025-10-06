/**
 * 🏠 SERVICE DE CLASSIFICATION INTELLIGENTE DES PIÈCES
 * 
 * Classification par batch optimisée avec suggestions et validation
 */

import { RoomGroup, PhotoData, ValidationSuggestion, RoomValidationResult, RoomTypeOption, ROOM_TYPES, RoomClassificationSettings, DEFAULT_CLASSIFICATION_SETTINGS } from '@/lib/roomValidation';
import { detectRoomTypeParallel } from './parallelRoomDetection';

export class SmartRoomClassificationService {
  private settings: RoomClassificationSettings;

  constructor(settings: RoomClassificationSettings = DEFAULT_CLASSIFICATION_SETTINGS) {
    this.settings = settings;
  }

  /**
   * Classification principale des photos par batch
   * 🎯 FIX : Utilise la détection de pièces existante au lieu de refaire l'analyse
   */
  async classifyPhotos(photos: PhotoData[]): Promise<RoomGroup[]> {
    console.log(`🏠 Classification de ${photos.length} photos en utilisant les détections existantes`);
    
    const startTime = Date.now();
    
    // 1. Grouper les photos par roomType détecté
    const roomGroupsMap = new Map<string, RoomGroup>();
    
    for (const photo of photos) {
      // Utiliser le roomType déjà détecté lors de l'upload
      const roomType = photo.roomType || photo.roomName || 'autre';
      const confidence = photo.roomConfidence || photo.analysis?.roomDetection?.confidence || 0.5;
      
      if (!roomGroupsMap.has(roomType)) {
        roomGroupsMap.set(roomType, {
          id: `group-${roomType}-${Date.now()}`,
          roomType: roomType,
          photos: [],
          confidence: confidence,
          suggestions: [],
          isUserValidated: false,
          lastModified: new Date()
        });
      }
      
      const group = roomGroupsMap.get(roomType)!;
      group.photos.push(photo);
      
      // Mettre à jour la confiance moyenne
      group.confidence = (group.confidence + confidence) / 2;
    }
    
    // 2. Convertir en array et ajouter des suggestions
    const roomGroups = Array.from(roomGroupsMap.values());
    const groupsWithSuggestions = await this.addSuggestions(roomGroups);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Classification terminée: ${groupsWithSuggestions.length} groupes en ${processingTime}ms`);
    
    return groupsWithSuggestions;
  }

  /**
   * Reclassification des photos avec faible confiance
   */
  async reclassifyUncertainPhotos(roomGroups: RoomGroup[]): Promise<RoomGroup[]> {
    const uncertainPhotos = roomGroups
      .filter(group => group.confidence < this.settings.autoReclassifyThreshold)
      .flatMap(group => group.photos);

    if (uncertainPhotos.length === 0) {
      console.log('✅ Aucune photo incertaine à reclassifier');
      return roomGroups;
    }

    console.log(`🔄 Reclassification de ${uncertainPhotos.length} photos incertaines`);
    return this.classifyPhotos(uncertainPhotos);
  }

  /**
   * Validation des groupes avec suggestions
   */
  async validateRoomGroups(roomGroups: RoomGroup[]): Promise<RoomValidationResult> {
    const startTime = Date.now();
    
    const suggestions: ValidationSuggestion[] = [];
    
    // Analyser chaque groupe
    roomGroups.forEach(group => {
      // Faible confiance
      if (group.confidence < this.settings.minConfidence) {
        suggestions.push({
          type: 'low_confidence',
          groupId: group.id,
          message: `Classification "${group.roomType}" peu fiable (${Math.round(group.confidence * 100)}%)`,
          action: 'review_required',
          priority: group.confidence < 0.5 ? 'high' : 'medium'
        });
      }

      // Trop de photos
      if (group.photos.length > this.settings.maxPhotosPerGroup) {
        suggestions.push({
          type: 'too_many_photos',
          groupId: group.id,
          message: `Beaucoup de photos dans "${group.roomType}" (${group.photos.length})`,
          action: 'split_suggested',
          priority: 'medium'
        });
      }

      // Groupe trop petit (possible fusion)
      if (group.photos.length < 3 && group.confidence > 0.8) {
        suggestions.push({
          type: 'merge_suggested',
          groupId: group.id,
          message: `Groupe "${group.roomType}" très petit (${group.photos.length} photos)`,
          action: 'merge_suggested',
          priority: 'low'
        });
      }
    });

    const result: RoomValidationResult = {
      totalPhotos: roomGroups.reduce((sum, group) => sum + group.photos.length, 0),
      validatedGroups: roomGroups.filter(g => g.isUserValidated).length,
      uncertainGroups: roomGroups.filter(g => g.confidence < this.settings.minConfidence).length,
      suggestions,
      processingTime: Date.now() - startTime
    };

    console.log(`📊 Validation: ${result.validatedGroups}/${roomGroups.length} groupes validés, ${result.uncertainGroups} incertains, ${suggestions.length} suggestions`);
    
    return result;
  }

  /**
   * Créer des batches de photos pour optimiser les appels API
   */
  private createBatches(photos: PhotoData[], batchSize: number): PhotoData[][] {
    const batches: PhotoData[][] = [];
    for (let i = 0; i < photos.length; i += batchSize) {
      batches.push(photos.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Classifier un batch de photos
   */
  private async classifyBatch(photos: PhotoData[], batchIndex: number): Promise<RoomGroup[]> {
    console.log(`🔄 Classification batch ${batchIndex + 1}: ${photos.length} photos`);
    
    const classifications = await Promise.all(
      photos.map(photo => this.classifySinglePhoto(photo))
    );

    // Grouper par type de pièce
    const groupsMap = new Map<string, PhotoData[]>();
    
    classifications.forEach((classification, index) => {
      const photo = photos[index];
      const roomType = classification.roomType;
      
      if (!groupsMap.has(roomType)) {
        groupsMap.set(roomType, []);
      }
      
      groupsMap.get(roomType)!.push({
        ...photo,
        roomType,
        roomConfidence: classification.confidence
      });
    });

    // Créer les groupes
    const groups: RoomGroup[] = [];
    groupsMap.forEach((groupPhotos, roomType) => {
      const avgConfidence = groupPhotos.reduce((sum, p) => sum + (p.roomConfidence || 0), 0) / groupPhotos.length;
      
      groups.push({
        id: `group-${roomType}-${batchIndex}`,
        roomType,
        confidence: avgConfidence,
        photos: groupPhotos,
        isUserValidated: false,
        lastModified: new Date()
      });
    });

    return groups;
  }

  /**
   * Classifier une photo individuelle
   */
  private async classifySinglePhoto(photo: PhotoData): Promise<{ roomType: string; confidence: number }> {
    try {
      if (!photo.fileUrl) {
        throw new Error('Photo URL manquante');
      }

      const result = await detectRoomTypeParallel(photo.fileUrl);
      return {
        roomType: result.roomType,
        confidence: result.confidence
      };
    } catch (error) {
      console.warn(`⚠️ Erreur classification photo ${photo.id}:`, error);
      return {
        roomType: 'autre',
        confidence: 0.1
      };
    }
  }

  /**
   * Fusionner les classifications de tous les batches
   */
  private mergeClassifications(batchClassifications: RoomGroup[][]): RoomGroup[] {
    const mergedGroups = new Map<string, RoomGroup>();
    
    batchClassifications.flat().forEach(group => {
      const existing = mergedGroups.get(group.roomType);
      
      if (existing) {
        // Fusionner les photos et recalculer la confiance
        const allPhotos = [...existing.photos, ...group.photos];
        const avgConfidence = allPhotos.reduce((sum, p) => sum + (p.roomConfidence || 0), 0) / allPhotos.length;
        
        mergedGroups.set(group.roomType, {
          ...existing,
          photos: allPhotos,
          confidence: avgConfidence,
          lastModified: new Date()
        });
      } else {
        mergedGroups.set(group.roomType, group);
      }
    });

    return Array.from(mergedGroups.values());
  }

  /**
   * Ajouter des suggestions aux groupes
   */
  private async addSuggestions(roomGroups: RoomGroup[]): Promise<RoomGroup[]> {
    if (!this.settings.enableSuggestions) {
      return roomGroups;
    }

    const validation = await this.validateRoomGroups(roomGroups);
    
    return roomGroups.map(group => ({
      ...group,
      suggestions: validation.suggestions.filter(s => s.groupId === group.id)
    }));
  }

  /**
   * Mettre à jour les paramètres
   */
  updateSettings(newSettings: Partial<RoomClassificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('⚙️ Paramètres de classification mis à jour:', this.settings);
  }
}
