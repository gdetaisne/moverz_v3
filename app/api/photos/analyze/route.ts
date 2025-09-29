import { NextRequest, NextResponse } from "next/server";
import { analyzePhotoWithOptimizedVision } from "@/services/optimizedAnalysis";
import { detectRoomTypeParallel } from "@/services/parallelRoomDetection";
import { saveAsBase64 } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    console.log("Processing file:", file.name, file.size, "bytes");
    
    // Convertir en Base64
    const saved = await saveAsBase64(file);
    console.log("Base64 conversion successful:", saved.id);
    
    // Lancer les deux analyses EN PARALLÈLE
    console.log("🚀 Lancement des analyses parallèles...");
    const [analysis, roomDetection] = await Promise.all([
      // Analyse A : Détection d'objets (sans détection de pièce)
      analyzePhotoWithOptimizedVision({ 
        photoId: saved.id, 
        imageUrl: saved.dataUrl
      }),
      // Analyse B : Détection de pièce (spécialisée)
      detectRoomTypeParallel(saved.dataUrl)
    ]);
    
    console.log("✅ Analyse objets terminée:", analysis.items?.length, "objets, temps:", analysis.processingTime, "ms");
    console.log("✅ Détection pièce terminée:", roomDetection.roomType, "confiance:", roomDetection.confidence, "temps:", roomDetection.processingTime, "ms");

    return NextResponse.json({
      ...analysis,
      roomDetection: {
        roomType: roomDetection.roomType,
        confidence: roomDetection.confidence,
        reasoning: roomDetection.reasoning
      },
      file_url: saved.dataUrl, // URL Base64 directement
      file_size: saved.size
    });
  } catch (e:any) {
    console.error("API Error:", e);
    console.error("Stack:", e.stack);
    return NextResponse.json({ 
      error: e.message ?? "internal_error",
      stack: e.stack,
      details: e.toString()
    }, { status: 500 });
  }
}
