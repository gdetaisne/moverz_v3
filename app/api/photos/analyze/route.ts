import { NextRequest, NextResponse } from "next/server";
import { analyzePhotoWithVision } from "@/services/openaiVision";
import { saveAsBase64 } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

    // Version ultra-simple pour tester
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    return NextResponse.json({
      photo_id: "test-123",
      version: "1.0.0",
      items: [
        {
          label: "Test objet",
          category: "misc",
          confidence: 0.9,
          quantity: 1,
          dimensions_cm: { length: 100, width: 50, height: 30, source: "estimated" },
          volume_m3: 0.15,
          fragile: false,
          stackable: true,
          notes: "Objet de test"
        }
      ],
      totals: {
        count_items: 1,
        volume_m3: 0.15
      },
      special_rules: {
        autres_objets: {
          present: false,
          listed_items: [],
          volume_m3: 0
        }
      },
      warnings: [],
      errors: [],
      file_url: dataUrl,
      file_size: buffer.length
    });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "internal_error" }, { status: 500 });
  }
}
