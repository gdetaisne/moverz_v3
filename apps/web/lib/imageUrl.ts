/**
 * Résout l'URL finale d'une image selon les champs possibles.
 * - Ne dépend pas de Next/Image (utilise <img> simple pour éviter les soucis de domaines).
 * - N'altère pas l'architecture existante (LOTS 5-18).
 */
export function toAbsoluteApiUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  // Déjà absolu
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  // URL base côté client
  const base =
    (typeof window !== "undefined" && window.location?.origin) ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  // Normalisation /api/uploads vs /uploads
  if (pathOrUrl.startsWith("/uploads/")) {
    const filename = pathOrUrl.split("/").pop();
    return `${base}/api/uploads/${filename}`;
  }
  if (pathOrUrl.startsWith("/api/")) {
    return `${base}${pathOrUrl}`;
  }
  // Chemins relatifs divers
  if (!pathOrUrl.startsWith("/")) {
    return `${base}/${pathOrUrl}`;
  }
  return `${base}${pathOrUrl}`;
}

type AnyPhoto = {
  id?: string;
  photoId?: string;
  url?: string;
  fileUrl?: string;
  filePath?: string;
  file?: File;
};

/**
 * Résout la meilleure source d'image pour une photo.
 * - Priorité: blob File (upload récent) > url/fileUrl > filePath > id/photoId
 * - Retourne toujours une chaîne (absolue) quand c'est possible
 */
export function resolvePhotoSrc(p: AnyPhoto): string | null {
  if (!p) return null;

  // 1) Upload immédiat (blob) - utiliser cache stable
  if (typeof window !== "undefined" && p.file instanceof File) {
    try {
      const { getStableBlobUrl } = require('../../lib/photoTransforms');
      return getStableBlobUrl(p.file) || '';
    } catch {
      /* noop */
    }
  }

  // 2) url / fileUrl (peuvent être absolues ou relatives)
  const direct = p.url || p.fileUrl;
  const directAbs = toAbsoluteApiUrl(direct);
  if (directAbs) return directAbs;

  // 3) filePath (/uploads/{id}.jpeg ou /api/uploads/{id}.jpeg)
  const viaPath = toAbsoluteApiUrl(p.filePath);
  if (viaPath) return viaPath;

  // 4) id -> /api/uploads/{id}.jpeg
  const id = p.photoId || p.id;
  if (id) {
    return toAbsoluteApiUrl(`/api/uploads/${id}.jpeg`);
  }

  return null;
}
