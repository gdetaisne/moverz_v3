// Image optimization utilities
export function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return Promise.resolve(buffer);
}

export function resizeImage(buffer: Buffer, width: number, height: number): Promise<Buffer> {
  return Promise.resolve(buffer);
}

export async function optimizeImageForAI(buffer: Buffer): Promise<{ buffer: Buffer }> {
  // Pour l'instant, pas d'optimisation (Sharp sera ajouté plus tard)
  // Retourner le format attendu par storage.ts
  return { buffer };
}
