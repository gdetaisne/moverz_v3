/**
 * Configuration et logique pour l'emballage des objets
 */

// Configuration des cartons standards
export const CARTON_CONFIG = {
  // Carton standard de déménagement (50x40x30 cm)
  STANDARD_VOLUME_M3: 0.06,
  DIMENSIONS_CM: {
    length: 50,
    width: 40,
    height: 30
  }
} as const;

// Règles d'emballage
export const PACKAGING_RULES = {
  // Petits objets non fragiles : +10% de volume
  SMALL_NON_FRAGILE_INCREASE: 0.10,
  
  // Meubles non fragiles : +5% de volume  
  FURNITURE_NON_FRAGILE_INCREASE: 0.05,
  
  // Objets fragiles : double le volume
  FRAGILE_MULTIPLIER: 2.0,
  
  // Seuil pour considérer un objet comme "petit" (rentre dans un carton)
  SMALL_OBJECT_THRESHOLD_M3: CARTON_CONFIG.STANDARD_VOLUME_M3
} as const;

/**
 * Vérifie si un objet peut physiquement rentrer dans un carton fermé
 */
function canFitInCarton(dimensionsCm: { length: number | null; width: number | null; height: number | null }): boolean {
  // Si pas de dimensions, on se base uniquement sur le volume
  if (!dimensionsCm.length || !dimensionsCm.width || !dimensionsCm.height) {
    return true; // Fallback sur la logique de volume
  }
  
  const cartonMaxDimension = Math.max(
    CARTON_CONFIG.DIMENSIONS_CM.length,
    CARTON_CONFIG.DIMENSIONS_CM.width,
    CARTON_CONFIG.DIMENSIONS_CM.height
  ); // 50cm (la plus grande dimension du carton)
  
  const objectMaxDimension = Math.max(dimensionsCm.length, dimensionsCm.width, dimensionsCm.height);
  
  // Un objet est considéré comme "petit" si sa plus grande dimension ne dépasse pas celle du carton
  return objectMaxDimension <= cartonMaxDimension;
}

/**
 * Calcule le volume emballé d'un objet selon les règles métier
 */
export function calculatePackagedVolume(
  originalVolumeM3: number,
  isFragile: boolean,
  category: string,
  dimensionsCm?: { length: number | null; width: number | null; height: number | null }
): {
  packagedVolumeM3: number;
  isSmallObject: boolean;
  displayValue: string;
  calculationDetails: string;
} {
  // Calcul du volume emballé selon les règles
  let packagedVolumeM3: number;
  
  // Un objet est "petit" s'il respecte AUSSI BIEN le volume ET les dimensions
  const volumeCheck = originalVolumeM3 <= PACKAGING_RULES.SMALL_OBJECT_THRESHOLD_M3;
  const dimensionCheck = dimensionsCm ? canFitInCarton(dimensionsCm) : volumeCheck;
  const isSmallObject = volumeCheck && dimensionCheck;
  
  // 1. DIMENSIONS
  let calculationDetails = "📏 DIMENSIONS\n";
  if (dimensionsCm && dimensionsCm.length && dimensionsCm.width && dimensionsCm.height) {
    const maxDimension = Math.max(dimensionsCm.length, dimensionsCm.width, dimensionsCm.height);
    calculationDetails += `${dimensionsCm.length}×${dimensionsCm.width}×${dimensionsCm.height}cm (max: ${maxDimension}cm)`;
  } else {
    calculationDetails += "Non disponibles";
  }
  
  // 2. RÈGLE TYPE D'OBJET (fragile ou pas)
  calculationDetails += "\n\n🔧 RÈGLE TYPE D'OBJET\n";
  if (isFragile) {
    // Objets fragiles : double le volume
    packagedVolumeM3 = originalVolumeM3 * PACKAGING_RULES.FRAGILE_MULTIPLIER;
    calculationDetails += `Objet fragile → Volume × ${PACKAGING_RULES.FRAGILE_MULTIPLIER}`;
  } else if (originalVolumeM3 <= PACKAGING_RULES.SMALL_OBJECT_THRESHOLD_M3) {
    // Petits objets non fragiles : +10%
    packagedVolumeM3 = originalVolumeM3 * (1 + PACKAGING_RULES.SMALL_NON_FRAGILE_INCREASE);
    calculationDetails += `Petit objet non fragile → Volume + ${(PACKAGING_RULES.SMALL_NON_FRAGILE_INCREASE * 100)}%`;
  } else {
    // Meubles non fragiles : +5%
    packagedVolumeM3 = originalVolumeM3 * (1 + PACKAGING_RULES.FURNITURE_NON_FRAGILE_INCREASE);
    calculationDetails += `Meuble non fragile → Volume + ${(PACKAGING_RULES.FURNITURE_NON_FRAGILE_INCREASE * 100)}%`;
  }
  
  // 3. RÈGLE DU CARTON
  calculationDetails += "\n\n📦 RÈGLE DU CARTON\n";
  if (dimensionsCm && dimensionsCm.length && dimensionsCm.width && dimensionsCm.height) {
    const maxDimension = Math.max(dimensionsCm.length, dimensionsCm.width, dimensionsCm.height);
    const cartonMaxDimension = Math.max(
      CARTON_CONFIG.DIMENSIONS_CM.length,
      CARTON_CONFIG.DIMENSIONS_CM.width,
      CARTON_CONFIG.DIMENSIONS_CM.height
    );
    calculationDetails += `Dimension max: ${maxDimension}cm\n`;
    calculationDetails += `Carton max: ${cartonMaxDimension}cm\n`;
    calculationDetails += `Résultat: ${maxDimension <= cartonMaxDimension ? '✓ Rentré dans carton' : '✗ Trop grand pour carton'}`;
  } else {
    calculationDetails += "Seuil volume: 0.06 m³";
    calculationDetails += `\nRésultat: ${originalVolumeM3 <= PACKAGING_RULES.SMALL_OBJECT_THRESHOLD_M3 ? '✓ Petit objet' : '✗ Gros objet'}`;
  }
  
  // 4. DIMENSION EMBALLÉE
  calculationDetails += "\n\n📊 DIMENSION EMBALLÉE\n";
  calculationDetails += `Volume original: ${originalVolumeM3.toFixed(3)} m³\n`;
  calculationDetails += `Volume emballé: ${packagedVolumeM3.toFixed(3)} m³`;
  
  // Format d'affichage
  let displayValue: string;
  if (isSmallObject) {
    // Pour les petits objets : pourcentage de carton avec 1 décimale arrondi supérieur
    const cartonPercentage = (packagedVolumeM3 / CARTON_CONFIG.STANDARD_VOLUME_M3) * 100;
    const roundedPercentage = Math.ceil(cartonPercentage * 10) / 10; // Arrondi supérieur à 1 décimale
    displayValue = `${roundedPercentage}% d'un carton`;
    calculationDetails += `\n\nPourcentage carton:\n${packagedVolumeM3.toFixed(3)} ÷ 0.060 = ${cartonPercentage.toFixed(1)}%\nArrondi supérieur: ${roundedPercentage}%`;
  } else {
    // Pour les meubles : volume en M³ avec 3 décimales pour plus de précision
    displayValue = `${packagedVolumeM3.toFixed(3)} M³ emballés`;
    calculationDetails += `\n\nAffichage: ${packagedVolumeM3.toFixed(3)} m³ emballés`;
  }
  
  return {
    packagedVolumeM3,
    isSmallObject,
    displayValue,
    calculationDetails
  };
}

/**
 * Récupère les règles d'emballage pour l'affichage dans le back-office
 */
export function getPackagingRulesForDisplay() {
  return {
    cartonStandard: {
      volume: CARTON_CONFIG.STANDARD_VOLUME_M3,
      dimensions: CARTON_CONFIG.DIMENSIONS_CM,
      description: "Carton standard de déménagement"
    },
    rules: {
      smallNonFragile: {
        description: "Petits objets non fragiles (≤ 0.06 M³ ET dimension max ≤ 50cm)",
        increase: `${(PACKAGING_RULES.SMALL_NON_FRAGILE_INCREASE * 100)}%`,
        destination: "Cartons"
      },
      furnitureNonFragile: {
        description: "Meubles non fragiles (> 0.06 M³ OU dimension max > 50cm)",
        increase: `${(PACKAGING_RULES.FURNITURE_NON_FRAGILE_INCREASE * 100)}%`,
        destination: "En vrac"
      },
      fragile: {
        description: "Objets fragiles",
        multiplier: `${PACKAGING_RULES.FRAGILE_MULTIPLIER}x`,
        destination: "Emballage renforcé"
      }
    },
    threshold: {
      smallObjectLimit: PACKAGING_RULES.SMALL_OBJECT_THRESHOLD_M3,
      description: "Seuil pour considérer un objet comme 'petit' (volume ET dimensions)"
    }
  };
}
