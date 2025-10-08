/**
 * Système de stockage localStorage isolé par utilisateur
 */

/**
 * Génère une clé de stockage unique pour un utilisateur
 */
function getUserStorageKey(userId: string, key: string): string {
  return `moverz_${userId}_${key}`;
}

/**
 * Stockage sécurisé par utilisateur
 */
export class UserStorage {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  /**
   * Sauvegarde des données d'inventaire
   */
  saveInventoryData(data: any): void {
    const key = getUserStorageKey(this.userId, 'inventory_data');
    localStorage.setItem(key, JSON.stringify({
      ...data,
      userId: this.userId,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Chargement des données d'inventaire
   */
  loadInventoryData(): any | null {
    const key = getUserStorageKey(this.userId, 'inventory_data');
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'inventaire:', error);
      return null;
    }
  }
  
  /**
   * Sauvegarde des données du formulaire
   */
  saveFormData(data: any): void {
    const key = getUserStorageKey(this.userId, 'form_data');
    localStorage.setItem(key, JSON.stringify({
      ...data,
      userId: this.userId,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Chargement des données du formulaire
   */
  loadFormData(): any | null {
    const key = getUserStorageKey(this.userId, 'form_data');
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données du formulaire:', error);
      return null;
    }
  }
  
  /**
   * Sauvegarde des paramètres IA
   */
  saveAISettings(settings: any): void {
    const key = getUserStorageKey(this.userId, 'ai_settings');
    localStorage.setItem(key, JSON.stringify({
      ...settings,
      userId: this.userId,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Chargement des paramètres IA
   */
  loadAISettings(): any | null {
    const key = getUserStorageKey(this.userId, 'ai_settings');
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres IA:', error);
      return null;
    }
  }
  
  /**
   * Sauvegarde des modifications d'objets (dismountable, fragile)
   */
  saveObjectModifications(modifications: Record<string, any>): void {
    const key = getUserStorageKey(this.userId, 'object_modifications');
    localStorage.setItem(key, JSON.stringify({
      ...modifications,
      userId: this.userId,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Chargement des modifications d'objets
   */
  loadObjectModifications(): Record<string, any> | null {
    const key = getUserStorageKey(this.userId, 'object_modifications');
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors du chargement des modifications d\'objets:', error);
      return null;
    }
  }
  
  /**
   * Supprime toutes les données d'un utilisateur
   */
  clearAllData(): void {
    const keys = Object.keys(localStorage);
    const userPrefix = `moverz_${this.userId}_`;
    
    keys.forEach(key => {
      if (key.startsWith(userPrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log(`🗑️ Données supprimées pour l'utilisateur: ${this.userId}`);
  }
  
  /**
   * Migre les données d'un utilisateur vers un autre
   */
  migrateToUser(newUserId: string): void {
    const oldKeys = Object.keys(localStorage);
    const oldPrefix = `moverz_${this.userId}_`;
    const newPrefix = `moverz_${newUserId}_`;
    
    oldKeys.forEach(key => {
      if (key.startsWith(oldPrefix)) {
        const data = localStorage.getItem(key);
        const newKey = key.replace(oldPrefix, newPrefix);
        
        if (data) {
          localStorage.setItem(newKey, data);
          localStorage.removeItem(key);
        }
      }
    });
    
    console.log(`🔄 Migration des données: ${this.userId} → ${newUserId}`);
  }
  
  /**
   * Récupère toutes les clés de stockage de cet utilisateur
   */
  getUserKeys(): string[] {
    const allKeys = Object.keys(localStorage);
    const userPrefix = `moverz_${this.userId}_`;
    
    return allKeys.filter(key => key.startsWith(userPrefix));
  }
  
  /**
   * Récupère la taille totale du stockage de cet utilisateur
   */
  getUserStorageSize(): number {
    const keys = this.getUserKeys();
    let totalSize = 0;
    
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    });
    
    return totalSize;
  }
}

/**
 * Factory function pour créer une instance de stockage utilisateur
 */
export function createUserStorage(userId: string): UserStorage {
  return new UserStorage(userId);
}

/**
 * Utilitaires de nettoyage global
 */
export class StorageCleanup {
  /**
   * Supprime toutes les données localStorage de l'ancien système
   */
  static clearLegacyData(): void {
    const legacyKeys = [
      'moverz_inventory_data',
      'moverz_form_data',
      'ai-settings'
    ];
    
    legacyKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('🧹 Données legacy supprimées');
  }
  
  /**
   * Supprime toutes les données localStorage de tous les utilisateurs
   */
  static clearAllUserData(): void {
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('moverz_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🧹 Toutes les données utilisateur supprimées');
  }
  
  /**
   * Affiche les statistiques de stockage
   */
  static getStorageStats(): {
    totalKeys: number;
    userKeys: number;
    totalSize: number;
    users: string[];
  } {
    const allKeys = Object.keys(localStorage);
    const moverzKeys = allKeys.filter(key => key.startsWith('moverz_'));
    
    let totalSize = 0;
    const users = new Set<string>();
    
    moverzKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += data.length;
        
        // Extraire l'userId de la clé
        const match = key.match(/moverz_(.+?)_/);
        if (match) {
          users.add(match[1]);
        }
      }
    });
    
    return {
      totalKeys: allKeys.length,
      userKeys: moverzKeys.length,
      totalSize,
      users: Array.from(users)
    };
  }
}
