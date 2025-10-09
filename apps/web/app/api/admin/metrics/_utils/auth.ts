/**
 * Guard de sécurité ultra-léger pour endpoints admin
 * LOT 18.1 - Monitoring Lite
 * 
 * Vérifie la présence du token admin via header x-admin-token
 */

import { NextRequest } from 'next/server';

/**
 * Vérifie si la requête contient le token admin valide
 */
export function isAdminAuthorized(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_BYPASS_TOKEN;
  
  // Si pas de token configuré, bloquer l'accès
  if (!adminToken) {
    console.warn('[Admin Auth] ADMIN_BYPASS_TOKEN non configuré');
    return false;
  }
  
  const requestToken = request.headers.get('x-admin-token');
  
  return requestToken === adminToken;
}

/**
 * Middleware pour protéger les routes admin
 * Retourne une réponse 401 si non autorisé
 */
export function requireAdmin(request: NextRequest): Response | null {
  if (!isAdminAuthorized(request)) {
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Token admin requis (header x-admin-token)' 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return null; // Autorisé
}



