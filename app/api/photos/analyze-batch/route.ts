import { NextRequest, NextResponse } from "next/server";
import { analyzeMultiplePhotosWithGrouping } from "@/services/optimizedAnalysis";
import { saveAsBase64 } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files");
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "files required" }, { status: 400 });
    }

    console.log(`Traitement de ${files.length} photos en lot`);
    
    // Convertir toutes les photos en Base64
    const savedPhotos = await Promise.all(
      files.map(async (file, index) => {
        if (typeof file === "string") {
          throw new Error(`Fichier ${index} invalide`);
        }
        console.log(`Traitement photo ${index + 1}:`, file.name, file.size, "bytes");
        return await saveAsBase64(file);
      })
    );

    console.log("Conversion Base64 terminée pour toutes les photos");
    
    // Analyser toutes les photos avec regroupement par pièce
    const { analyses, roomGrouping } = await analyzeMultiplePhotosWithGrouping(
      savedPhotos.map(saved => ({
        photoId: saved.id,
        imageUrl: saved.dataUrl
      }))
    );

    console.log(`Analyse de lot terminée: ${analyses.length} photos, ${roomGrouping.rooms.length} pièces`);

    return NextResponse.json({
      analyses: analyses.map((analysis, index) => ({
        ...analysis,
        file_url: savedPhotos[index].dataUrl,
        file_size: savedPhotos[index].size
      })),
      roomGrouping,
      summary: {
        totalPhotos: analyses.length,
        totalRooms: roomGrouping.rooms.length,
        totalItems: analyses.reduce((sum, analysis) => sum + analysis.items.length, 0),
        totalVolume: analyses.reduce((sum, analysis) => sum + analysis.totals.volume_m3, 0),
        averageProcessingTime: analyses.reduce((sum, analysis) => sum + analysis.processingTime, 0) / analyses.length
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
