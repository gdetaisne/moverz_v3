import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schéma de validation Zod pour POST
const createRoomSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
});

// Middleware d'authentification simple pour DEV
function getUserId(req: NextRequest): string | null {
  // Accepter x-user-id (insensible à la casse)
  const headerUserId = req.headers.get('x-user-id') || req.headers.get('X-User-Id');
  if (headerUserId) return headerUserId;

  // En DEV, accepter aussi ?userId=
  const url = new URL(req.url);
  const queryUserId = url.searchParams.get('userId');
  if (queryUserId) return queryUserId;

  return null;
}

// POST /api/rooms - Créer une room
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'x-user-id header ou ?userId= requis' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = createRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Créer l'utilisateur s'il n'existe pas
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    // Créer la room
    const room = await prisma.room.create({
      data: {
        name,
        userId,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/rooms:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// GET /api/rooms - Lister les rooms par userId
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'x-user-id header ou ?userId= requis' },
        { status: 401 }
      );
    }

    const rooms = await prisma.room.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    console.error('Erreur GET /api/rooms:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

