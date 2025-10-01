import { NextRequest } from 'next/server';
import { prisma } from './db';

/**
 * Récupère ou crée l'ID utilisateur depuis les cookies/headers
 * 
 * Priorité :
 * 1. Header x-user-id (dev/test)
 * 2. Query param userId (dev/test)  
 * 3. Cookie user_id (prod)
 * 4. Création auto d'un nouvel user
 */
export async function getUserId(req: NextRequest): Promise<string> {
  // Dev: accepte header x-user-id (insensible à la casse)
  const headerUserId = req.headers.get('x-user-id') || req.headers.get('X-User-Id');
  if (headerUserId) {
    // Assurer que l'user existe en DB
    await ensureUserExists(headerUserId);
    return headerUserId;
  }

  // Dev: accepte query param userId
  const url = new URL(req.url);
  const queryUserId = url.searchParams.get('userId');
  if (queryUserId) {
    await ensureUserExists(queryUserId);
    return queryUserId;
  }

  // Prod: lit cookie
  const cookieUserId = req.cookies.get('user_id')?.value;
  if (cookieUserId) {
    await ensureUserExists(cookieUserId);
    return cookieUserId;
  }

  // Nouveau: génère ID et crée user
  const newUserId = crypto.randomUUID();
  await prisma.user.create({
    data: { id: newUserId }
  });
  
  return newUserId;
}

/**
 * Assure qu'un user existe en DB (créé si nécessaire)
 */
async function ensureUserExists(userId: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!existing) {
    await prisma.user.create({
      data: { id: userId }
    });
  }
}


