export function toAbsoluteApiUrl(path: string) {
  // Handles leading slashes and NEXT_PUBLIC_API_URL base
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || '';
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;           // already absolute
  if (path.startsWith('/')) return `${base}${path}`;     // API absolute path
  return `${base}/${path.replace(/^\/+/, '')}`;
}

/**
 * Resolve a photo source from multiple possible shapes.
 * Supported:
 * - photo.file           -> File/Blob URL (newly uploaded)
 * - photo.url            -> absolute or API-relative
 * - photo.fileUrl        -> absolute url
 * - photo.filePath       -> absolute local path => served via /api/uploads/[filename]
 * - photo.id/photoId     -> fallback to /api/uploads/{id}.jpeg
 */
export function resolvePhotoSrc(photo: any): string {
  try {
    if (!photo) return '';
    // 1) fresh upload (File/Blob provided by input)
    if (photo.file instanceof File || photo.file instanceof Blob) {
      return URL.createObjectURL(photo.file);
    }

    // 2) explicit absolute URLs
    if (photo.fileUrl && /^https?:\/\//i.test(photo.fileUrl)) {
      return photo.fileUrl;
    }
    if (photo.url && /^https?:\/\//i.test(photo.url)) {
      return photo.url;
    }

    // 3) API-relative paths
    if (typeof photo.url === 'string' && photo.url.startsWith('/')) {
      return toAbsoluteApiUrl(photo.url);
    }

    // 4) persisted filePath on disk -> map to /api/uploads/{filename}
    if (typeof photo.filePath === 'string' && photo.filePath) {
      const filename = photo.filePath.split('/').pop();
      if (filename) return toAbsoluteApiUrl(`/api/uploads/${filename}`);
    }

    // 5) fallback by id
    const id = photo.photoId || photo.id;
    if (id) return toAbsoluteApiUrl(`/api/uploads/${id}.jpeg`);

    return '';
  } catch {
    return '';
  }
}
