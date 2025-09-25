import { NextRequest, NextResponse } from "next/server";
import { analyzePhotoWithVision } from "@/services/openaiVision";
import { saveAsBase64 } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

    console.log("Processing file:", file.name, file.size, "bytes");
    
    // Convertir en Base64
    const saved = await saveAsBase64(file);
    console.log("Base64 conversion successful:", saved.id);
    
    // Analyser avec l'URL data Base64
    const analysis = await analyzePhotoWithVision({ 
      photoId: saved.id, 
      imageUrl: saved.dataUrl 
    });
    console.log("AI analysis successful:", analysis.items?.length, "items");

    return NextResponse.json({
      ...analysis,
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
