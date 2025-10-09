/**
 * 🏠 Normalisateur de types de pièces
 * 
 * Convertis les labels détectés par l'IA vers les valeurs du système
 */

// Mapping des labels IA vers les valeurs système
const ROOM_TYPE_MAPPING: Record<string, string> = {
  // Labels avec espaces → valeurs avec underscores
  'salle à manger': 'salle_a_manger',
  'salle de bain': 'salle_de_bain',
  'salle de bains': 'salle_de_bain',
  'salle à manger': 'salle_a_manger',
  'salle à manger': 'salle_a_manger',
  
  // Labels en français → valeurs système
  'bureau': 'bureau',
  'cave': 'cave', 
  'chambre': 'chambre',
  'couloir': 'couloir',
  'cuisine': 'cuisine',
  'entrée': 'entree',
  'entree': 'entree',
  'garage': 'garage',
  'grenier': 'grenier',
  'jardin': 'jardin',
  'salon': 'salon',
  'terrasse': 'terrasse',
  'autre': 'autre',
  'dressing': 'autre', // Pas de type dressing, on met autre
  
  // Labels en anglais → valeurs système
  'dining room': 'salle_a_manger',
  'living room': 'salon',
  'bedroom': 'chambre',
  'bathroom': 'salle_de_bain',
  'kitchen': 'cuisine',
  'office': 'bureau',
  'garage': 'garage',
  'garden': 'jardin',
  'corridor': 'couloir',
  'hallway': 'couloir',
  'basement': 'cave',
  'attic': 'grenier',
  'terrace': 'terrasse',
  'other': 'autre',
  
  // Labels partiels ou variantes
  'manger': 'salle_a_manger',
  'table à manger': 'salle_a_manger',
  'salle manger': 'salle_a_manger',
  'bain': 'salle_de_bain',
  'douche': 'salle_de_bain',
  'wc': 'salle_de_bain',
  'toilettes': 'salle_de_bain',
  'séjour': 'salon',
  'salle de séjour': 'salon',
  'salle de vie': 'salon',
  'extérieur': 'jardin',
  'ext': 'jardin',
  'outdoor': 'jardin',
  'patio': 'jardin',
  'balcon': 'terrasse',
  'balcony': 'terrasse'
};

/**
 * Normalise un type de pièce détecté par l'IA vers la valeur système
 */
export function normalizeRoomType(detectedType: string): string {
  if (!detectedType || typeof detectedType !== 'string') {
    return 'autre';
  }
  
  // Nettoyer le type détecté
  const cleanedType = detectedType
    .toLowerCase()
    .trim()
    .replace(/[^\w\sàâäéèêëïîôöùûüÿç]/g, '') // Supprimer caractères spéciaux
    .replace(/\s+/g, ' '); // Normaliser les espaces
  
  // Chercher une correspondance exacte
  if (ROOM_TYPE_MAPPING[cleanedType]) {
    return ROOM_TYPE_MAPPING[cleanedType];
  }
  
  // Chercher une correspondance partielle
  for (const [label, value] of Object.entries(ROOM_TYPE_MAPPING)) {
    if (cleanedType.includes(label) || label.includes(cleanedType)) {
      logger.debug(`🔄 Normalisation partielle: "${detectedType}" → "${value}"`);
      return value;
    }
  }
  
  // Si aucune correspondance trouvée
  console.warn(`⚠️ Type de pièce non reconnu: "${detectedType}" → "autre"`);
  return 'autre';
}

/**
 * Valide qu'un type de pièce est valide selon le système
 */
export function isValidRoomType(roomType: string): boolean {
  const validTypes = [
    'bureau', 'cave', 'chambre', 'couloir', 'cuisine', 'entree',
    'garage', 'grenier', 'jardin', 'salle_a_manger', 'salle_de_bain',
    'salon', 'terrasse', 'autre'
  ];
  return validTypes.includes(roomType);
}

/**
 * Obtient le label d'affichage pour un type de pièce
 */
export function getRoomTypeLabel(roomType: string): string {
  const labels: Record<string, string> = {
    'bureau': 'Bureau',
    'cave': 'Cave',
    'chambre': 'Chambre', 
    'couloir': 'Couloir',
    'cuisine': 'Cuisine',
    'entree': 'Entrée',
    'garage': 'Garage',
    'grenier': 'Grenier',
    'jardin': 'Jardin',
    'salle_a_manger': 'Salle à manger',
    'salle_de_bain': 'Salle de bain',
    'salon': 'Salon',
    'terrasse': 'Terrasse',
    'autre': 'Autre'
  };
  
  return labels[roomType] || 'Pièce inconnue';
}





