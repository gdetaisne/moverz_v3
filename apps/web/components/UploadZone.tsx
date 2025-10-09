/**
 * 📤 Upload zone component
 */

'use client';

import { useCallback, useState } from 'react';
import { cn } from '../lib/helpers';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
}

export function UploadZone({
  onFilesSelected,
  accept = 'image/*',
  maxFiles = 10,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (files.length > maxFiles) {
        alert(`Maximum ${maxFiles} fichiers autorisés`);
        return;
      }

      onFilesSelected(files);
    },
    [onFilesSelected, maxFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > maxFiles) {
        alert(`Maximum ${maxFiles} fichiers autorisés`);
        return;
      }
      onFilesSelected(files);
    },
    [onFilesSelected, maxFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
      )}
    >
      <input
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-500 text-3xl">📸</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Glissez-déposez vos photos ici
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          ou cliquez pour sélectionner des fichiers
        </p>
        <p className="text-xs text-gray-500">
          Maximum {maxFiles} fichiers • Formats: JPG, PNG, WebP
        </p>
      </label>
    </div>
  );
}



