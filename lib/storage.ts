import { randomUUID } from "crypto";

// Stockage Base64 simple et fiable
export async function saveAsBase64(file: File){
  const id = randomUUID();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  
  // Convertir en Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Convertir en Base64
  const base64 = buffer.toString('base64');
  
  // Déterminer le MIME type
  let mimeType = "image/jpeg";
  if (ext === "png") mimeType = "image/png";
  if (ext === "webp") mimeType = "image/webp";
  
  // Créer l'URL data
  const dataUrl = `data:${mimeType};base64,${base64}`;
  
  console.log(`Image processed: ${buffer.length} bytes`);
  
  return { 
    id, 
    base64, 
    dataUrl,
    mimeType,
    size: buffer.length,
    originalSize: buffer.length,
    optimizedSize: buffer.length
  };
}
