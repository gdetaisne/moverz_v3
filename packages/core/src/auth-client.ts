/**
 * Gestion des cookies côté client pour l'authentification
 */

const COOKIE_NAME = 'moverz_user_id';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 jours en secondes

/**
 * Définit le cookie user_id
 */
export function setUserIdCookie(userId: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${COOKIE_NAME}=${userId}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  console.debug(`🍪 Cookie user_id défini: ${userId}`);
}

/**
 * Récupère le cookie user_id
 */
export function getUserIdCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Supprime le cookie user_id
 */
export function clearUserIdCookie(): void {
  if (typeof document === 'undefined') return;
  
  // Supprimer l'ancien cookie user_id
  document.cookie = `user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  // Supprimer le nouveau cookie moverz_user_id
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  console.debug('🍪 Cookies user_id supprimés');
}

/**
 * Nettoie les anciens cookies et migre vers le nouveau système
 */
export function migrateCookies(): void {
  if (typeof document === 'undefined') return;
  
  // Vérifier si l'ancien cookie existe
  const oldCookie = document.cookie.match(/(^| )user_id=([^;]+)/);
  if (oldCookie) {
    const oldUserId = oldCookie[2];
    console.debug(`🔄 Migration cookie: user_id → moverz_user_id (${oldUserId})`);
    
    // Supprimer l'ancien cookie
    document.cookie = `user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    // Créer le nouveau cookie avec la même valeur
    document.cookie = `${COOKIE_NAME}=${oldUserId}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

/**
 * Génère un nouvel ID utilisateur temporaire
 */
export function generateTemporaryUserId(): string {
  return `temp-${crypto.randomUUID()}`;
}

/**
 * Vérifie si un user_id est temporaire
 */
export function isTemporaryUserId(userId: string): boolean {
  return userId.startsWith('temp-');
}

/**
 * Gestion complète des sessions utilisateur
 */
export class UserSessionManager {
  private static instance: UserSessionManager;
  
  static getInstance(): UserSessionManager {
    if (!UserSessionManager.instance) {
      UserSessionManager.instance = new UserSessionManager();
    }
    return UserSessionManager.instance;
  }
  
  /**
   * Récupère l'ID utilisateur actuel (cookie ou génère un nouveau)
   */
  getCurrentUserId(): string {
    // 0. Migrer les anciens cookies si nécessaire
    migrateCookies();
    
    // 1. Essayer de récupérer depuis le cookie
    const cookieUserId = getUserIdCookie();
    if (cookieUserId) {
      return cookieUserId;
    }
    
    // 2. Générer un nouvel ID temporaire
    const newUserId = generateTemporaryUserId();
    setUserIdCookie(newUserId);
    console.debug(`🆕 Nouvel utilisateur temporaire créé: ${newUserId}`);
    
    return newUserId;
  }
  
  /**
   * Convertit un utilisateur temporaire en permanent
   */
  async convertToPermanentUser(temporaryUserId: string, email: string): Promise<string> {
    if (!isTemporaryUserId(temporaryUserId)) {
      throw new Error('L\'utilisateur n\'est pas temporaire');
    }
    
    // TODO: Appeler l'API pour créer un utilisateur permanent
    // Pour l'instant, on garde le même ID mais on pourrait en générer un nouveau
    const permanentUserId = `user-${crypto.randomUUID()}`;
    
    // Mettre à jour le cookie
    setUserIdCookie(permanentUserId);
    
    console.debug(`🔄 Utilisateur converti: ${temporaryUserId} → ${permanentUserId} (${email})`);
    
    return permanentUserId;
  }
  
  /**
   * Se connecter avec un utilisateur existant
   */
  loginWithEmail(email: string): void {
    // TODO: Appeler l'API pour récupérer l'user_id par email
    // Pour l'instant, on génère un ID basé sur l'email
    const userId = `user-${btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;
    setUserIdCookie(userId);
    console.debug(`🔑 Connexion avec email: ${email} → ${userId}`);
  }
  
  /**
   * Se déconnecter
   */
  logout(): void {
    clearUserIdCookie();
    console.debug('🚪 Déconnexion');
  }
  
  /**
   * Récupère les informations de session
   */
  getSessionInfo(): {
    userId: string;
    isTemporary: boolean;
    email?: string;
  } {
    const userId = this.getCurrentUserId();
    const isTemporary = isTemporaryUserId(userId);
    
    return {
      userId,
      isTemporary,
      email: isTemporary ? undefined : 'user@example.com' // TODO: Récupérer depuis l'API
    };
  }
}

// Export de l'instance singleton
export const userSession = UserSessionManager.getInstance();
