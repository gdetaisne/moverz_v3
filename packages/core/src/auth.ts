import { NextRequest } from 'next/server';
import { prisma } from './db';

/**
 * Récupère l'ID utilisateur depuis les cookies/headers
 * 
 * Priorité :
 * 1. Header x-user-id (dev/test)
 * 2. Query param userId (dev/test)  
 * 3. Cookie moverz_user_id (nouveau système)
 * 
 * Ne crée plus d'utilisateur automatiquement - la gestion se fait côté client
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  // Dev: accepte header x-user-id (insensible à la casse)
  const headerUserId = req.headers.get('x-user-id') || req.headers.get('X-User-Id');
  if (headerUserId) {
    // En mode dev, créer l'user s'il n'existe pas
    const exists = await userExists(headerUserId);
    if (!exists) {
      await createUser(headerUserId);
    }
    return headerUserId;
  }

  // Dev: accepte query param userId
  const url = new URL(req.url);
  const queryUserId = url.searchParams.get('userId');
  if (queryUserId) {
    const exists = await userExists(queryUserId);
    return exists ? queryUserId : null;
  }

  // Nouveau système: lit cookie moverz_user_id
  const cookieUserId = req.cookies.get('moverz_user_id')?.value;
  if (cookieUserId) {
    const exists = await userExists(cookieUserId);
    return exists ? cookieUserId : null;
  }

  // Aucun user ID trouvé
  return null;
}

/**
 * Vérifie si un user existe en DB (sans créer)
 */
async function userExists(userId: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  return !!existing;
}

/**
 * Crée un utilisateur en DB
 */
async function createUser(userId: string): Promise<void> {
  await prisma.user.create({
    data: { id: userId }
  });
}


