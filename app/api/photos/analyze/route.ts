import { NextRequest, NextResponse } from "next/server";
import { savePhotoToFile, saveAsBase64, savePhotoToDatabase } from "@core/storage";
import { getUserId } from "@core/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    console.log(`🚀 [TIMING] Début traitement: ${file.name} (${file.size} bytes) - ${new Date().toISOString()}`);
    
    // ✨ NOUVEAU : Sauvegarder sur disque (pas Base64)
    const saveStart = Date.now();
    const saved = await savePhotoToFile(file);
    const saveTime = Date.now() - saveStart;
    console.log(`💾 [TIMING] Sauvegarde fichier: ${saveTime}ms - ${saved.filename}`);
    
    // Pour l'analyse IA, on a toujours besoin du Base64 temporairement
    const base64Start = Date.now();
    const base64Data = await saveAsBase64(file);
    const base64Time = Date.now() - base64Start;
    console.log(`📦 [TIMING] Conversion Base64: ${base64Time}ms`);
    
    // Import dynamique pour éviter les erreurs de build
    const { detectRoomType } = await import("@services/roomDetection");

    // 🏠 Détection de pièce IA (analyse séquentielle pour éviter les blocages)
    console.log("🏠 [TIMING] Détection de pièce IA...");
    const aiStart = Date.now();
    // Passer un objet d'analyse vide et l'URL de l'image pour l'analyse directe
    const emptyAnalysis = { items: [], processingTime: 0, aiProvider: "pending", analysisType: "pending" };
    const imageUrl = `data:${base64Data.mimeType};base64,${base64Data.base64}`;
    const roomDetection = await detectRoomType(emptyAnalysis, imageUrl);
    const aiTime = Date.now() - aiStart;
    
    console.log(`✅ [TIMING] Détection pièce IA: ${aiTime}ms - Type: ${roomDetection.roomType}, Confiance: ${roomDetection.confidence}`);
    
    // ✅ ÉTAPE 1 : On ne garde QUE la détection de pièce
    // L'analyse des objets sera faite à l'Étape 2 (/api/photos/analyze-by-room)

    // ✨ Récupérer userId depuis form data ou headers
    const formUserId = form.get("userId");
    const userId = formUserId && typeof formUserId === 'string' 
      ? formUserId 
      : await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "User ID requis" }, { status: 401 });
    }

    const dbStart = Date.now();
    await savePhotoToDatabase({
      userId: userId,
      photoId: saved.id,
      filename: saved.filename,
      filePath: saved.filePath,
      url: saved.url,
      roomType: roomDetection.roomType,
      analysis: null // ✅ Pas d'analyse à l'Étape 1, sera fait à l'Étape 2
    });
    const dbTime = Date.now() - dbStart;
    
    const totalTime = Date.now() - startTime;
    console.log(`💾 [TIMING] Sauvegarde DB: ${dbTime}ms`);
    console.log(`🏁 [TIMING] TOTAL: ${totalTime}ms - ${file.name}`);

    return NextResponse.json({
      roomType: roomDetection.roomType,
      confidence: roomDetection.confidence,
      reasoning: roomDetection.reasoning,
      file_url: saved.url,
      file_size: saved.size,
      photo_id: saved.id,
      message: "Photo classifiée - Analyse des objets sera faite à l'Étape 2"
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
