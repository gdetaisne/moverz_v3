import { useMemo } from 'react';
import { TInventoryItem } from '@/lib/schemas';

interface PhotoData {
  file: File;
  fileUrl?: string;
  analysis?: {
    items?: TInventoryItem[];
    special_rules?: {
      autres_objets?: {
        present: boolean;
        volume_m3?: number;
        listed_items?: unknown[];
      };
    };
  };
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  selectedItems: Set<number>;
  photoId?: string;
}

interface InventoryCalculations {
  totalVolume: number;
  totalItems: number;
  totalPackagedVolume: number;
  fragileItems: number;
  dismountableItems: number;
  categoriesCount: number;
  itemsByCategory: Record<string, TInventoryItem[]>;
}

export function useInventoryCalculations(photos: PhotoData[]): InventoryCalculations {
  return useMemo(() => {
    let totalVolume = 0;
    let totalItems = 0;
    let totalPackagedVolume = 0;
    let fragileItems = 0;
    let dismountableItems = 0;
    const categories = new Set<string>();
    const itemsByCategory: Record<string, TInventoryItem[]> = {};

    photos.forEach(photo => {
      if (photo.status === 'completed' && photo.analysis?.items) {
        photo.analysis.items.forEach((item: TInventoryItem, itemIndex: number) => {
          // Vérifier si l'objet est sélectionné
          const isSelected = photo.selectedItems.size === 0 || photo.selectedItems.has(itemIndex);
          
          if (isSelected) {
            const quantity = item.quantity || 1;
            const volume = (item.volume_m3 || 0) * quantity;
            const packagedVolume = (item.packaged_volume_m3 || item.volume_m3 || 0) * quantity;
            
            totalVolume += volume;
            totalPackagedVolume += packagedVolume;
            totalItems += quantity;
            
            if (item.fragile) fragileItems += quantity;
            if (item.dismountable) dismountableItems += quantity;
            
            // Grouper par catégorie
            const category = item.category || 'Autres';
            categories.add(category);
            if (!itemsByCategory[category]) {
              itemsByCategory[category] = [];
            }
            itemsByCategory[category].push(item);
          }
        });
        
        // Autres objets (toujours sélectionnés par défaut)
        if (photo.analysis.special_rules?.autres_objets?.present) {
          const autresVolume = photo.analysis.special_rules.autres_objets.volume_m3 || 0;
          const autresItems = photo.analysis.special_rules.autres_objets.listed_items?.length || 0;
          
          totalVolume += autresVolume;
          totalItems += autresItems;
        }
      }
    });

    // Fonction pour arrondir les m³ à 2 chiffres avec arrondi supérieur
    const roundUpVolume = (volume: number): number => {
      return Math.ceil(volume * 100) / 100;
    };

    return {
      totalVolume: roundUpVolume(totalVolume),
      totalItems,
      totalPackagedVolume: roundUpVolume(totalPackagedVolume),
      fragileItems,
      dismountableItems,
      categoriesCount: categories.size,
      itemsByCategory
    };
  }, [photos]);
}
