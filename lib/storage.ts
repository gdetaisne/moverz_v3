import { randomUUID } from "crypto";

// Stockage Base64 - plus simple et fiable
export async function saveAsBase64(file: File){
  const id = randomUUID();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  
  // Convertir en Base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  
  // Déterminer le MIME type
  let mimeType = "image/jpeg";
  if (ext === "png") mimeType = "image/png";
  if (ext === "webp") mimeType = "image/webp";
  
  // Créer l'URL data
  const dataUrl = `data:${mimeType};base64,${base64}`;
  
  return { 
    id, 
    base64, 
    dataUrl,
    mimeType,
    size: arrayBuffer.byteLength 
  };
}
