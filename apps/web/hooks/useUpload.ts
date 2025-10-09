/**
 * 📤 Upload hook with photo enqueuing
 */

import { useState, useCallback } from 'react';
import { apiPost } from '../lib/apiClient';
import { API_ENDPOINTS } from '../lib/constants';
import { wait } from '../lib/helpers';

interface Photo {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export function useUpload() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPhotos = useCallback((files: File[]) => {
    const newPhotos: Photo[] = files.map((file) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      status: 'pending' as const,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const analyzePhotos = useCallback(async () => {
    if (photos.length === 0) {
      setError('Aucune photo à analyser');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Mock enqueue (adapt to your real API structure)
      const response = await apiPost<{ batchId: string }>(
        API_ENDPOINTS.PHOTOS_ENQUEUE,
        {
          photos: photos.map((p) => ({ id: p.id, url: p.url })),
        }
      );

      // Simulate processing
      await wait(2000);

      setPhotos((prev) =>
        prev.map((p) => ({ ...p, status: 'completed' as const }))
      );

      return response.batchId;
    } catch (err) {
      const errorMsg = (err as Error).message || 'Erreur lors de l\'analyse';
      setError(errorMsg);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, [photos]);

  return {
    photos,
    uploading,
    analyzing,
    error,
    addPhotos,
    removePhoto,
    analyzePhotos,
  };
}



