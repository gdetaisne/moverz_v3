import { NextRequest, NextResponse } from "next/server";
import { analyzePhotoWithOptimizedVision } from "@/services/optimizedAnalysis";
import { detectRoomTypeParallel } from "@/services/parallelRoomDetection";
import { savePhotoToFile, saveAsBase64, savePhotoToDatabase } from "@/lib/storage";
import { getUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    console.log("Processing file:", file.name, file.size, "bytes");
    
    // ✨ NOUVEAU : Sauvegarder sur disque (pas Base64)
    const saved = await savePhotoToFile(file);
    console.log("💾 Fichier sauvegardé:", saved.filename);
    
    // Pour l'analyse IA, on a toujours besoin du Base64 temporairement
    const base64Data = await saveAsBase64(file);
    
    // Lancer les deux analyses EN PARALLÈLE
    console.log("🚀 Lancement des analyses parallèles...");
    const [analysis, roomDetection] = await Promise.all([
      // Analyse A : Détection d'objets (utilise Base64 temporaire)
      analyzePhotoWithOptimizedVision({ 
        photoId: saved.id, 
        imageUrl: base64Data.dataUrl
      }),
      // Analyse B : Détection de pièce (utilise Base64 temporaire)
      detectRoomTypeParallel(base64Data.dataUrl)
    ]);
    
    console.log("✅ Analyse objets terminée:", analysis.items?.length, "objets, temps:", analysis.processingTime, "ms");
    console.log("✅ Détection pièce terminée:", roomDetection.roomType, "confiance:", roomDetection.confidence, "temps:", roomDetection.processingTime, "ms");

    // ✨ Sauvegarder en DB (URL fichier, pas Base64)
    const userId = await getUserId(req);
    const fullAnalysis = {
      ...analysis,
      roomDetection: {
        roomType: roomDetection.roomType,
        confidence: roomDetection.confidence,
        reasoning: roomDetection.reasoning
      }
    };

    await savePhotoToDatabase({
      userId: userId,
      photoId: saved.id,
      filename: saved.filename,
      filePath: saved.filePath,
      url: saved.url,
      roomType: roomDetection.roomType,
      analysis: fullAnalysis
    });

    return NextResponse.json({
      ...fullAnalysis,
      file_url: saved.url, // ✨ URL fichier (pas Base64)
      file_size: saved.size,
      photo_id: saved.id
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
