import { NextRequest, NextResponse } from "next/server";
import { analyzePhotoWithVision } from "@/services/openaiVision";
import { saveAsBase64 } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

    // Convertir en Base64
    const saved = await saveAsBase64(file);
    
    // Analyser avec l'URL data Base64
    const analysis = await analyzePhotoWithVision({ 
      photoId: saved.id, 
      imageUrl: saved.dataUrl 
    });

    return NextResponse.json({
      ...analysis,
      file_url: saved.dataUrl, // URL Base64 directement
      file_size: saved.size
    });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "internal_error" }, { status: 500 });
  }
}
