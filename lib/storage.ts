import { randomUUID } from "crypto";
import { optimizeImageForAI } from "@/lib/imageOptimization";

// Stockage Base64 optimisé - plus simple et fiable
export async function saveAsBase64(file: any){
  const id = randomUUID();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  
  // Convertir en Buffer
  const arrayBuffer = await file.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);
  
  // Optimiser l'image pour l'IA (réduction de taille significative)
  const optimized = await optimizeImageForAI(originalBuffer);
  
  // Convertir en Base64 optimisé
  const base64 = optimized.buffer.toString('base64');
  
  // Déterminer le MIME type
  let mimeType = "image/jpeg";
  if (ext === "png") mimeType = "image/png";
  if (ext === "webp") mimeType = "image/webp";
  
  // Créer l'URL data optimisée
  const dataUrl = `data:${mimeType};base64,${base64}`;
  
  console.log(`Image optimized: ${originalBuffer.length}→${optimized.buffer.length} bytes (${Math.round((1 - optimized.buffer.length/originalBuffer.length) * 100)}% reduction)`);
  
  return { 
    id, 
    base64, 
    dataUrl,
    mimeType,
    size: optimized.buffer.length,
    originalSize: originalBuffer.length,
    optimizedSize: optimized.buffer.length
  };
}
