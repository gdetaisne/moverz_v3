import { NextRequest, NextResponse } from "next/server";
import { analyzePhotoWithVision } from "@/services/openaiVision";
import { saveLocalFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

    const saved = await saveLocalFile(file);
    const fullUrl = `${req.nextUrl.origin}${saved.url}`;
    const analysis = await analyzePhotoWithVision({ photoId: saved.id, imageUrl: fullUrl });

    return NextResponse.json({
      ...analysis,
      file_url: `/api${saved.url}` // Utiliser directement l'URL de l'API
    });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "internal_error" }, { status: 500 });
  }
}
