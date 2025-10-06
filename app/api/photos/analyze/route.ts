import { NextRequest, NextResponse } from "next/server";
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
    
    // Import dynamique pour éviter les erreurs de build
    const { analyzePhotoWithOptimizedVision } = await import("@/services/optimizedAnalysis");
    const { detectRoomTypeParallel } = await import("@/services/parallelRoomDetection");

    // 🏠 ÉTAPE 1 : Seulement détection de pièce lors de l'upload
    console.log("🏠 Détection de pièce uniquement...");
    const roomDetection = await detectRoomTypeParallel(base64Data.dataUrl);
    
    console.log("✅ Détection pièce terminée:", roomDetection.roomType, "confiance:", roomDetection.confidence, "temps:", roomDetection.processingTime, "ms");
    
    // 📝 L'analyse d'objets sera lancée plus tard après validation des pièces
    const analysis = {
      items: [],
      processingTime: 0,
      aiProvider: "pending-room-validation",
      analysisType: "room-validation-pending"
    };

    // ✨ Récupérer userId depuis form data ou headers
    const formUserId = form.get("userId");
    const userId = formUserId && typeof formUserId === 'string' 
      ? formUserId 
      : await getUserId(req);
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
  } catch (e: unknown) {
    console.error("API Error:", e);
    const error = e as Error;
    console.error("Stack:", error.stack);
    return NextResponse.json({ 
      error: error.message ?? "internal_error",
      stack: error.stack,
      details: error.toString()
    }, { status: 500 });
  }
}
