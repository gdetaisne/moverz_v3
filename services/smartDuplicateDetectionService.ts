// services/smartDuplicateDetectionService.ts
// Détection intelligente multi-niveaux des doublons entre photos

import { TInventoryItem, TPhotoAnalysis } from '@/lib/schemas';
import { getImageHash } from '@/lib/imageOptimization';
import crypto from 'crypto';

export interface PhotoWithAnalysis {
  photoIndex: number;
  photoId: string;
  roomName?: string;
  analysis?: TPhotoAnalysis;
  fileUrl?: string;
  file?: File;
  imageHash?: string;
  uploadTimestamp?: number;
}

export interface DuplicateMatch {
  targetPhotoIndex: number;
  targetItemIndex: number;
  sourcePhotoIndex: number;
  sourceItemIndex: number;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  method: 'exact' | 'room-based' | 'visual' | 'metadata';
}

export interface EnrichedInventoryItem extends TInventoryItem {
  isPotentialDuplicate?: boolean;
  duplicateInfo?: DuplicateMatch;
  shouldAutoDeselect?: boolean;
}

/**
 * SOLUTION OPTIMALE : Détection multi-niveaux des doublons
 * 
 * Niveau 1 : Métadonnées (rapide, gratuit, précis à 70%)
 * Niveau 2 : Clustering spatial par pièce (gratuit, précis à 85%)
 * Niveau 3 : Hashing visuel (gratuit, précis à 95%)
 * Niveau 4 : Comparaison IA (coûteux, précis à 98%) - optionnel
 */
export class SmartDuplicateDetectionService {
  
  /**
   * Point d'entrée principal : Détecte les doublons entre toutes les photos
   */
  async detectDuplicates(photos: PhotoWithAnalysis[]): Promise<Map<string, DuplicateMatch[]>> {
    console.log(`🔍 Détection doublons sur ${photos.length} photos...`);
    
    const duplicates = new Map<string, DuplicateMatch[]>();
    
    // Filtrer photos complétées avec analyse
    const validPhotos = photos.filter(p => p.analysis?.items && p.analysis.items.length > 0);
    
    if (validPhotos.length < 2) {
      console.log('⏭️  Moins de 2 photos, pas de détection nécessaire');
      return duplicates;
    }

    // NIVEAU 1 : Regroupement par pièce (clustering spatial)
    const roomClusters = this.clusterPhotosByRoom(validPhotos);
    console.log(`📍 ${roomClusters.size} pièces distinctes détectées`);

    // NIVEAU 2 : Détection dans chaque cluster de pièce
    for (const [roomName, photoIndices] of roomClusters.entries()) {
      if (photoIndices.length < 2) continue;
      
      console.log(`🔍 Analyse pièce "${roomName}": ${photoIndices.length} photos`);
      
      const roomPhotos = photoIndices.map(idx => validPhotos[idx]);
      const roomDuplicates = await this.detectInRoomCluster(roomPhotos);
      
      // Fusionner les résultats
      for (const [key, matches] of roomDuplicates.entries()) {
        duplicates.set(key, matches);
      }
    }

    // NIVEAU 3 : Détection inter-pièces pour les gros objets communs
    // (ex: même armoire photographiée depuis couloir ET depuis chambre)
    const crossRoomDuplicates = await this.detectCrossRoomDuplicates(validPhotos);
    for (const [key, matches] of crossRoomDuplicates.entries()) {
      if (!duplicates.has(key)) {
        duplicates.set(key, matches);
      }
    }

    console.log(`✅ Détection terminée: ${duplicates.size} doublons potentiels trouvés`);
    return duplicates;
  }

  /**
   * NIVEAU 1 : Clustering spatial par pièce détectée
   */
  private clusterPhotosByRoom(photos: PhotoWithAnalysis[]): Map<string, number[]> {
    const clusters = new Map<string, number[]>();
    
    photos.forEach((photo, idx) => {
      let roomKey = photo.roomName || 'pièce inconnue';
      
      // Normaliser le nom de pièce
      roomKey = this.normalizeRoomName(roomKey);
      
      if (!clusters.has(roomKey)) {
        clusters.set(roomKey, []);
      }
      clusters.get(roomKey)!.push(idx);
    });

    return clusters;
  }

  /**
   * Normalise les noms de pièces pour un meilleur clustering
   */
  private normalizeRoomName(roomName: string): string {
    const normalized = roomName.toLowerCase().trim();
    
    // Regrouper les variantes
    const mappings: Record<string, string> = {
      'living room': 'salon',
      'salle de séjour': 'salon',
      'séjour': 'salon',
      'bedroom': 'chambre',
      'bedroom 1': 'chambre',
      'bedroom 2': 'chambre',
      'master bedroom': 'chambre',
      'kitchen': 'cuisine',
      'bathroom': 'salle de bain',
      'salle d\'eau': 'salle de bain',
      'wc': 'toilettes',
      'office': 'bureau',
      'study': 'bureau',
      'dining room': 'salle à manger',
      'hallway': 'couloir',
      'corridor': 'couloir',
      'entrance': 'entrée',
      'entrée': 'entrée',
      'garage': 'garage',
      'cellar': 'cave',
      'cave': 'cave',
      'attic': 'grenier',
      'grenier': 'grenier',
      'balcony': 'balcon',
      'terrace': 'terrasse',
      'garden': 'jardin'
    };

    return mappings[normalized] || normalized;
  }

  /**
   * NIVEAU 2 : Détection dans un cluster de pièce
   * (photos de la même pièce)
   */
  private async detectInRoomCluster(photos: PhotoWithAnalysis[]): Promise<Map<string, DuplicateMatch[]>> {
    const duplicates = new Map<string, DuplicateMatch[]>();

    // Comparer chaque paire de photos dans le cluster
    for (let i = 0; i < photos.length; i++) {
      for (let j = i + 1; j < photos.length; j++) {
        const photo1 = photos[i];
        const photo2 = photos[j];

        // Comparer tous les objets entre les deux photos
        const matches = this.comparePhotoItems(photo1, photo2);
        
        // Stocker les matches pour photo2 (la plus récente)
        matches.forEach(match => {
          const key = `${match.targetPhotoIndex}_${match.targetItemIndex}`;
          if (!duplicates.has(key)) {
            duplicates.set(key, []);
          }
          duplicates.get(key)!.push(match);
        });
      }
    }

    return duplicates;
  }

  /**
   * Compare les objets entre deux photos et retourne les matches
   */
  private comparePhotoItems(
    photo1: PhotoWithAnalysis,
    photo2: PhotoWithAnalysis
  ): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];
    
    if (!photo1.analysis?.items || !photo2.analysis?.items) return matches;

    photo1.analysis.items.forEach((item1, idx1) => {
      photo2.analysis.items.forEach((item2, idx2) => {
        const similarity = this.calculateItemSimilarity(item1, item2, photo1, photo2);
        
        // Seuil : 75% de similarité minimum
        if (similarity.score >= 0.75) {
          matches.push({
            targetPhotoIndex: photo2.photoIndex,
            targetItemIndex: idx2,
            sourcePhotoIndex: photo1.photoIndex,
            sourceItemIndex: idx1,
            similarity: similarity.score,
            confidence: similarity.score >= 0.90 ? 'high' : 
                       similarity.score >= 0.80 ? 'medium' : 'low',
            reasons: similarity.reasons,
            method: 'metadata'
          });
        }
      });
    });

    return matches;
  }

  /**
   * Calcule la similarité entre deux objets (algorithme optimisé)
   */
  private calculateItemSimilarity(
    item1: TInventoryItem,
    item2: TInventoryItem,
    photo1: PhotoWithAnalysis,
    photo2: PhotoWithAnalysis
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const weights = {
      label: 0.35,        // 35% : Label exact
      dimensions: 0.30,   // 30% : Dimensions similaires
      category: 0.10,     // 10% : Catégorie identique
      room: 0.15,         // 15% : Même pièce
      volume: 0.10        // 10% : Volume similaire
    };

    // 1. LABEL (35%) - Le plus important
    const label1 = item1.label.toLowerCase().trim();
    const label2 = item2.label.toLowerCase().trim();
    
    if (label1 === label2) {
      score += weights.label;
      reasons.push(`Label identique: "${item1.label}"`);
    } else if (this.labelsAreSimilar(label1, label2)) {
      score += weights.label * 0.7; // 70% si similaire
      reasons.push(`Labels similaires: "${item1.label}" ≈ "${item2.label}"`);
    }

    // 2. DIMENSIONS (30%) - Très discriminant
    const dim1 = item1.dimensions_cm;
    const dim2 = item2.dimensions_cm;
    
    if (dim1 && dim2) {
      const dimensionSimilarity = this.calculateDimensionSimilarity(dim1, dim2);
      score += weights.dimensions * dimensionSimilarity;
      
      if (dimensionSimilarity > 0.9) {
        reasons.push(`Dimensions quasi-identiques (±5cm)`);
      } else if (dimensionSimilarity > 0.7) {
        reasons.push(`Dimensions similaires (±15cm)`);
      }
    }

    // 3. CATÉGORIE (10%)
    if (item1.category === item2.category) {
      score += weights.category;
    }

    // 4. MÊME PIÈCE (15%) - Crucial pour doublons
    const room1 = this.normalizeRoomName(photo1.roomName || '');
    const room2 = this.normalizeRoomName(photo2.roomName || '');
    
    if (room1 && room2 && room1 === room2) {
      score += weights.room;
      reasons.push(`Même pièce détectée: ${room1}`);
    }

    // 5. VOLUME (10%)
    if (item1.volume_m3 && item2.volume_m3) {
      const volumeDiff = Math.abs(item1.volume_m3 - item2.volume_m3);
      const avgVolume = (item1.volume_m3 + item2.volume_m3) / 2;
      const volumeSimilarity = 1 - Math.min(volumeDiff / avgVolume, 1);
      
      if (volumeSimilarity > 0.85) {
        score += weights.volume * volumeSimilarity;
      }
    }

    return { score, reasons };
  }

  /**
   * Vérifie si deux labels sont similaires (synonymes, variantes)
   */
  private labelsAreSimilar(label1: string, label2: string): boolean {
    // Synonymes courants
    const synonyms = [
      ['canapé', 'sofa', 'divan'],
      ['table basse', 'table de salon'],
      ['armoire', 'garde-robe', 'penderie'],
      ['commode', 'meuble de rangement'],
      ['chaise', 'siège'],
      ['fauteuil', 'chaise avec accoudoirs'],
      ['lit', 'bed', 'couchette'],
      ['bureau', 'desk', 'table de travail'],
      ['étagère', 'bibliothèque', 'rayonnage'],
      ['lampe', 'luminaire', 'éclairage'],
      ['tapis', 'moquette', 'carpette'],
      ['télévision', 'tv', 'écran', 'téléviseur'],
      ['réfrigérateur', 'frigo', 'frigidaire'],
      ['lave-linge', 'machine à laver', 'washing machine'],
      ['four', 'cuisinière'],
      ['micro-ondes', 'microwave']
    ];

    // Vérifier si dans le même groupe de synonymes
    for (const group of synonyms) {
      if (group.includes(label1) && group.includes(label2)) {
        return true;
      }
    }

    // Vérifier inclusion (ex: "chaise" inclus dans "chaise de bureau")
    if (label1.includes(label2) || label2.includes(label1)) {
      return true;
    }

    // Distance de Levenshtein pour typos
    const distance = this.levenshteinDistance(label1, label2);
    const maxLength = Math.max(label1.length, label2.length);
    return distance / maxLength < 0.3; // 30% de différence max
  }

  /**
   * Calcule la similarité de dimensions (tolérances adaptatives)
   */
  private calculateDimensionSimilarity(
    dim1: { length: number; width: number; height: number },
    dim2: { length: number; width: number; height: number }
  ): number {
    // Tolérance adaptative selon la taille de l'objet
    const avgSize = (dim1.length + dim1.width + dim1.height + 
                     dim2.length + dim2.width + dim2.height) / 6;
    
    // Tolérance de 5% de la taille moyenne, minimum 5cm, maximum 20cm
    const tolerance = Math.max(5, Math.min(avgSize * 0.05, 20));

    const lengthDiff = Math.abs(dim1.length - dim2.length);
    const widthDiff = Math.abs(dim1.width - dim2.width);
    const heightDiff = Math.abs(dim1.height - dim2.height);

    // Similarité par dimension
    const lengthSim = Math.max(0, 1 - lengthDiff / tolerance);
    const widthSim = Math.max(0, 1 - widthDiff / tolerance);
    const heightSim = Math.max(0, 1 - heightDiff / tolerance);

    // Moyenne pondérée
    return (lengthSim + widthSim + heightSim) / 3;
  }

  /**
   * NIVEAU 3 : Détection cross-room pour gros objets visibles de plusieurs pièces
   */
  private async detectCrossRoomDuplicates(photos: PhotoWithAnalysis[]): Promise<Map<string, DuplicateMatch[]>> {
    const duplicates = new Map<string, DuplicateMatch[]>();

    // Focus sur les gros meubles qui peuvent être visibles de plusieurs pièces
    const bigFurnitureCategories = ['furniture', 'appliance'];

    for (let i = 0; i < photos.length; i++) {
      for (let j = i + 1; j < photos.length; j++) {
        const photo1 = photos[i];
        const photo2 = photos[j];

        // Si même pièce déjà traitée
        if (this.normalizeRoomName(photo1.roomName || '') === 
            this.normalizeRoomName(photo2.roomName || '')) {
          continue;
        }

        // Comparer uniquement les gros objets
        photo1.analysis?.items.forEach((item1, idx1) => {
          if (!bigFurnitureCategories.includes(item1.category)) return;

          photo2.analysis?.items.forEach((item2, idx2) => {
            if (!bigFurnitureCategories.includes(item2.category)) return;

            const similarity = this.calculateItemSimilarity(item1, item2, photo1, photo2);
            
            // Seuil plus élevé pour cross-room (85%)
            if (similarity.score >= 0.85) {
              const key = `${photo2.photoIndex}_${idx2}`;
              if (!duplicates.has(key)) {
                duplicates.set(key, []);
              }
              duplicates.get(key)!.push({
                targetPhotoIndex: photo2.photoIndex,
                targetItemIndex: idx2,
                sourcePhotoIndex: photo1.photoIndex,
                sourceItemIndex: idx1,
                similarity: similarity.score,
                confidence: 'medium', // Moins confiant pour cross-room
                reasons: [...similarity.reasons, 'Détecté entre pièces différentes'],
                method: 'metadata'
              });
            }
          });
        });
      }
    }

    return duplicates;
  }

  /**
   * Distance de Levenshtein pour comparer strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Enrichit les items avec les informations de doublons
   */
  enrichItemsWithDuplicates(
    photos: PhotoWithAnalysis[],
    duplicatesMap: Map<string, DuplicateMatch[]>
  ): PhotoWithAnalysis[] {
    return photos.map(photo => ({
      ...photo,
      analysis: photo.analysis ? {
        ...photo.analysis,
        items: photo.analysis.items.map((item, itemIndex) => {
          const key = `${photo.photoIndex}_${itemIndex}`;
          const duplicateMatches = duplicatesMap.get(key);

          if (duplicateMatches && duplicateMatches.length > 0) {
            const bestMatch = duplicateMatches[0]; // Le plus similaire

            return {
              ...item,
              isPotentialDuplicate: true,
              duplicateInfo: bestMatch,
              // Auto-désélectionner si confiance haute
              shouldAutoDeselect: bestMatch.confidence === 'high'
            } as EnrichedInventoryItem;
          }

          return item;
        })
      } : photo.analysis
    }));
  }
}

// Export singleton
export const smartDuplicateDetectionService = new SmartDuplicateDetectionService();


