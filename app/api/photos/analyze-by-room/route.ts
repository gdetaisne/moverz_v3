import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@core/auth";
import { prisma } from "@core/db";

export const runtime = "nodejs";

/**
 * POST /api/photos/analyze-by-room
 * Analyse les objets d'un groupe de photos d'une pièce validée
 * Question aux IA : "Que vois-tu sur CES photos de cette pièce ?"
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const { roomType, photoIds } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 });
    }

    if (!roomType || !photoIds || !Array.isArray(photoIds)) {
      return NextResponse.json({ error: "roomType and photoIds required" }, { status: 400 });
    }

    console.log(`🏠 Analyse d'objets pour pièce "${roomType}" avec ${photoIds.length} photos`);
    console.log(`🔍 UserId: ${userId}`);
    console.log(`🔍 PhotoIds: ${JSON.stringify(photoIds)}`);

    // Récupérer les photos du groupe
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds },
        project: { is: { userId } }
      },
      select: {
        id: true,
        url: true,
        filename: true
      }
    });
    
    console.log(`🔍 Photos trouvées: ${photos.length}`);

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos found" }, { status: 404 });
    }

    // Import dynamique pour éviter les erreurs de build
    const { analyzeRoomPhotos } = await import("@services/roomBasedAnalysis");

    // 🎯 NOUVELLE LOGIQUE : Analyse par groupe de pièces
    const analysis = await analyzeRoomPhotos({
      roomType,
      photos: photos.map(p => ({
        id: p.id,
        url: p.url,
        filename: p.filename
      })),
      userId
    });

    console.log(`✅ Analyse pièce "${roomType}" terminée:`, analysis.items?.length, "objets");

    // ✅ Stocker l'analyse uniquement sur la première photo du groupe
    // Cela évite la duplication des analyses en DB
    const primaryPhotoId = photoIds[0];
    await prisma.photo.update({
      where: { id: primaryPhotoId },
      data: {
        analysis: {
          ...(analysis as any),
          _isGroupAnalysis: true,
          _groupPhotoIds: photoIds,
          _analysisVersion: 1
        } as any
      }
    });

    return NextResponse.json({
      ...analysis,
      roomType,
      photoCount: photos.length,
      message: `Analyse terminée pour ${photos.length} photo(s) de la pièce "${roomType}"`
    });

  } catch (e: unknown) {
    console.error("API Error:", e);
    const error = e as Error;
    return NextResponse.json({ 
      error: error.message ?? "internal_error",
      stack: error.stack
    }, { status: 500 });
  }
}
