import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/room-groups
 * Récupère les groupes de pièces de l'utilisateur avec leurs photos et analyses
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "User ID requis" }, { status: 401 });
    }
    
    // Récupérer toutes les photos de l'utilisateur avec analyses
    const photos = await prisma.photo.findMany({
      where: {
        project: { 
          is: { userId: userId }
        },
        analysis: { not: null }
      },
      include: {
        project: {
          select: { userId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Grouper les photos par type de pièce
    const roomGroupsMap = new Map<string, any>();
    
    photos.forEach(photo => {
      const roomType = photo.roomType || 'unknown';
      
      if (!roomGroupsMap.has(roomType)) {
        roomGroupsMap.set(roomType, {
          id: `room-${roomType}`,
          roomType,
          photos: [],
          lastModified: photo.createdAt
        });
      }
      
      const group = roomGroupsMap.get(roomType);
      group.photos.push({
        id: photo.id,
        url: photo.url.startsWith('http') ? photo.url : `${req.nextUrl.origin}${photo.url}`,
        analysis: photo.analysis
      });
      
      // Mettre à jour la date de modification la plus récente
      if (photo.createdAt > group.lastModified) {
        group.lastModified = photo.createdAt;
      }
    });

    // Convertir en array et trier par date de modification
    const roomGroups = Array.from(roomGroupsMap.values())
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json(roomGroups, { status: 200 });
  } catch (error: unknown) {
    console.error('[GET /api/room-groups] Error:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
