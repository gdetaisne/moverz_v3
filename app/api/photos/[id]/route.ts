import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';
import { getUserId } from '@core/auth';

export const runtime = "nodejs";

/**
 * PATCH /api/photos/[id]
 * Met à jour l'analyse d'une photo (modifications utilisateur)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    const { id: photoId } = await params;
    const body = await req.json();

    console.log(`🔄 Mise à jour photo ${photoId}:`, Object.keys(body));

    // Vérifier que la photo existe et appartient à l'utilisateur
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        project: {
          select: { userId: true }
        }
      }
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.project.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Mettre à jour la photo
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        analysis: body.analysis || photo.analysis,
        roomType: body.roomType !== undefined ? body.roomType : photo.roomType,
      }
    });

    console.log(`✅ Photo ${photoId} mise à jour`);

    return NextResponse.json({ success: true, photo: updatedPhoto }, { status: 200 });
  } catch (error: unknown) {
    const { id } = await params;
    console.error(`❌ Erreur mise à jour photo ${id}:`, error);
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
  }
}

/**
 * GET /api/photos/[id]
 * Récupère une photo par son ID avec son statut d'analyse async
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    const { id: photoId } = await params;

    // Récupérer la photo avec tous les champs de statut
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        project: {
          select: { userId: true }
        }
      }
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.project.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Retourner la photo avec statut enrichi pour polling
    return NextResponse.json({ 
      photo: {
        ...photo,
        // Champs de statut async explicites pour le client
        status: photo.status,           // PENDING | PROCESSING | DONE | ERROR
        errorCode: photo.errorCode,     // null ou code d'erreur
        errorMessage: photo.errorMessage, // null ou message détaillé
        processedAt: photo.processedAt,  // null ou timestamp de fin
      }
    }, { status: 200 });
  } catch (error: unknown) {
    const { id } = await params;
    console.error(`❌ Erreur récupération photo ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}


