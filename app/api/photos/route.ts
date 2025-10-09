import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@core/db";
import { getUserId } from "@core/auth";

export const runtime = "nodejs";

/**
 * GET /api/photos
 * Récupère toutes les photos de l'utilisateur avec leurs analyses
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    
    // Récupérer toutes les photos de l'utilisateur
    const photos = await prisma.photo.findMany({
      where: {
        project: { userId }
      },
      include: {
        project: {
          select: { userId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(photos, { status: 200 });
  } catch (error: unknown) {
    console.error('[GET /api/photos] Error:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}


