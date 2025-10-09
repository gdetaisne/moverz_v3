/**
 * Utilitaire pour gérer les URLs d'images
 * Garantit une URL absolue vers le serveur API local
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Convertit une URL relative en URL absolue
 * @param url - URL relative ou absolue
 * @returns URL absolue
 */
export function toAbsoluteImageUrl(url?: string): string {
  if (!url) return "";
  
  // Si déjà une URL absolue (http/https), retourner telle quelle
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Si URL relative, préfixer avec l'API base
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Construit l'URL d'une photo depuis son ID ou filename
 * @param photoId - ID de la photo
 * @param filename - Nom du fichier (fallback)
 * @returns URL complète vers /api/uploads/{filename}
 */
export function getPhotoUrl(photoId?: string, filename?: string): string {
  const file = photoId || filename;
  if (!file) return "";
  
  // Si le fichier n'a pas d'extension, ajouter .jpeg par défaut
  const hasExtension = file.includes(".");
  const finalFilename = hasExtension ? file : `${file}.jpeg`;
  
  return toAbsoluteImageUrl(`/api/uploads/${finalFilename}`);
}

