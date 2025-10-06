/**
 * 🏠 SERVICE D'ANALYSE PAR GROUPE DE PIÈCES
 * 
 * Question aux IA : "Que vois-tu sur CES photos de cette pièce ?"
 * Analyse contextuelle et cohérente par groupe de photos
 */

import { analyzePhotoWithOptimizedVision } from './optimizedAnalysis';

interface RoomPhoto {
  id: string;
  url: string;
  filename: string;
}

interface RoomAnalysisRequest {
  roomType: string;
  photos: RoomPhoto[];
  userId: string;
}

export async function analyzeRoomPhotos(request: RoomAnalysisRequest) {
  const { roomType, photos, userId } = request;
  
  console.log(`🏠 Début analyse pièce "${roomType}" avec ${photos.length} photos`);
  
  const startTime = Date.now();
  
  try {
    // 🎯 NOUVELLE APPROCHE : Analyse contextuelle par groupe
    const roomContext = await buildRoomContext(roomType, photos);
    
    // Analyser chaque photo avec le contexte de la pièce
    const photoAnalyses = await Promise.all(
      photos.map(async (photo, index) => {
        console.log(`📸 Analyse photo ${index + 1}/${photos.length}: ${photo.filename}`);
        
        // Construire l'URL complète si elle est relative
        const fullImageUrl = photo.url.startsWith('http') 
          ? photo.url 
          : `http://localhost:4000${photo.url}`;
        
        console.log(`📸 URL image: ${fullImageUrl}`);
        
        const analysis = await analyzePhotoWithOptimizedVision({
          photoId: photo.id,
          imageUrl: fullImageUrl
        });
        
        console.log(`📸 Photo ${photo.id} analysée: ${analysis.items?.length || 0} objets`);
        
        return {
          photoId: photo.id,
          analysis
        };
      })
    );

    // 🎯 NOUVELLE LOGIQUE SIMPLIFIÉE : Plus de déduplication nécessaire
    // L'IA voit déjà l'ensemble des photos d'une pièce, donc pas de doublons possibles
    const mergedAnalysis = await mergeRoomAnalysesSimple(photoAnalyses, roomType);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Analyse pièce "${roomType}" terminée: ${mergedAnalysis.items?.length || 0} objets en ${processingTime}ms`);
    
    return {
      ...mergedAnalysis,
      roomType,
      photoCount: photos.length,
      processingTime,
      aiProvider: "room-contextual-analysis",
      analysisType: "room-based"
    };
    
  } catch (error) {
    console.error(`❌ Erreur analyse pièce "${roomType}":`, error);
    throw error;
  }
}

/**
 * Construit le contexte de la pièce pour améliorer l'analyse
 */
async function buildRoomContext(roomType: string, photos: RoomPhoto[]) {
  const roomContexts = {
    'salon': {
      expectedObjects: ['canapé', 'fauteuil', 'table basse', 'télévision', 'lampadaire', 'tableau', 'vase'],
      roomDescription: 'Espace de détente avec mobilier de salon, éclairage d\'ambiance, éléments décoratifs',
      analysisFocus: 'mobilier de détente, éclairage, décoration'
    },
    'cuisine': {
      expectedObjects: ['réfrigérateur', 'four', 'plan de travail', 'évier', 'gazinière', 'micro-ondes', 'vaisselier'],
      roomDescription: 'Espace de préparation culinaire avec électroménagers et rangement',
      analysisFocus: 'électroménagers, rangement, plan de travail'
    },
    'chambre': {
      expectedObjects: ['lit', 'armoire', 'commode', 'table de chevet', 'dressing', 'miroir', 'lampes'],
      roomDescription: 'Espace de repos avec mobilier de chambre et rangement vêtements',
      analysisFocus: 'mobilier de chambre, rangement, éclairage'
    },
    'salle-de-bain': {
      expectedObjects: ['douche', 'baignoire', 'lavabo', 'miroir', 'toilettes', 'meuble de salle de bain'],
      roomDescription: 'Espace sanitaire avec équipements de salle de bain',
      analysisFocus: 'équipements sanitaires, rangement salle de bain'
    },
    'bureau': {
      expectedObjects: ['bureau', 'chaise', 'ordinateur', 'étagères', 'bibliothèque', 'lampe de bureau'],
      roomDescription: 'Espace de travail avec mobilier de bureau et rangement',
      analysisFocus: 'mobilier de bureau, rangement, éclairage de travail'
    },
    'jardin': {
      expectedObjects: ['mobilier extérieur', 'plantes', 'barbecue', 'parasol', 'table de jardin'],
      roomDescription: 'Espace extérieur avec mobilier de jardin et végétation',
      analysisFocus: 'mobilier extérieur, végétation, équipements de jardin'
    }
  };

  const context = roomContexts[roomType as keyof typeof roomContexts] || {
    expectedObjects: [],
    roomDescription: `Espace de type ${roomType}`,
    analysisFocus: 'objets divers'
  };

  return {
    roomType,
    expectedObjects: context.expectedObjects,
    roomDescription: context.roomDescription,
    analysisFocus: context.analysisFocus,
    photoCount: photos.length,
    promptEnhancement: `Analysez ces ${photos.length} photos d'un ${roomType}. ${context.roomDescription}. Concentrez-vous sur: ${context.analysisFocus}.`
  };
}

/**
 * 🎯 FUSION SIMPLIFIÉE : Plus de déduplication complexe nécessaire
 * L'IA analyse déjà l'ensemble des photos d'une pièce d'un coup
 */
async function mergeRoomAnalysesSimple(photoAnalyses: any[], roomType: string) {
  console.log(`🔀 Fusion simple pour pièce "${roomType}"...`);
  
  // Extraire tous les objets de toutes les photos
  const allItems = photoAnalyses.flatMap(pa => pa.analysis.items || []);
  
  console.log(`📊 ${allItems.length} objets trouvés dans ${photoAnalyses.length} photos`);
  
  // Calculer les totaux
  const totalVolume = allItems.reduce((sum, item) => sum + (item.volume_m3 || 0), 0);
  
  return {
    version: "1.0.0",
    items: allItems, // Plus de déduplication complexe
    totals: {
      count_items: allItems.length,
      volume_m3: totalVolume
    },
    roomAnalysis: {
      roomType,
      photoCount: photoAnalyses.length,
      analysisMethod: "room-simple-merge"
    },
    warnings: [],
    errors: [],
    processingTime: photoAnalyses.reduce((sum, pa) => sum + (pa.analysis.processingTime || 0), 0)
  };
}

// 🎯 FONCTIONS DE DÉDUPLICATION SUPPRIMÉES
// Plus nécessaires car l'IA analyse déjà l'ensemble des photos d'une pièce
