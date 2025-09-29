import { NextRequest, NextResponse } from "next/server";
import { analyzeMultiplePhotosWithRoomDetection } from "@/services/optimizedAnalysis";
import { saveAsBase64 } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "At least one file required" }, { status: 400 });
    }

    console.log(`Analyse de ${files.length} photos avec détection de pièce`);

    // Convertir toutes les photos en Base64
    const savedPhotos = await Promise.all(
      files.map(async (file) => {
        if (typeof file === "string") {
          throw new Error(`Fichier invalide`);
        }
        console.log("Traitement photo:", file.name, file.size, "bytes");
        return await saveAsBase64(file);
      })
    );

    console.log("Conversion Base64 terminée pour toutes les photos");

    // Analyser toutes les photos avec détection de pièce
    const { analyses, roomGrouping } = await analyzeMultiplePhotosWithRoomDetection(
      savedPhotos.map(saved => ({
        photoId: saved.id,
        imageUrl: saved.dataUrl
      }))
    );

    console.log(`Analyse terminée: ${analyses.length} photos regroupées en ${Object.keys(roomGrouping).length} pièces`);

    return NextResponse.json({
      analyses: analyses.map((analysis, index) => ({
        ...analysis,
        file_url: savedPhotos[index].dataUrl,
        file_size: savedPhotos[index].size
      })),
      roomGrouping,
      summary: {
        totalPhotos: analyses.length,
        totalRooms: Object.keys(roomGrouping).length,
        totalItems: analyses.reduce((sum, analysis) => sum + analysis.items.length, 0),
        totalVolume: analyses.reduce((sum, analysis) => sum + analysis.totals.volume_m3, 0),
        averageProcessingTime: analyses.reduce((sum, analysis) => sum + analysis.processingTime, 0) / analyses.length,
        rooms: Object.keys(roomGrouping).map(roomName => ({
          name: roomName,
          photoCount: roomGrouping[roomName].length,
          itemCount: roomGrouping[roomName].reduce((sum, analysis) => sum + analysis.items.length, 0),
          volume: roomGrouping[roomName].reduce((sum, analysis) => sum + analysis.totals.volume_m3, 0)
        }))
      }
    });

  } catch (e: any) {
    console.error("API Error:", e);
    console.error("Stack:", e.stack);
    return NextResponse.json({
      error: e.message ?? "internal_error",
      stack: e.stack,
      details: e.toString()
    }, { status: 500 });
  }
}
