"use client";
import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

interface PhotoUploadZoneProps {
  onFilesUploaded: (files: File[]) => void;
  isDragOver: boolean;
  disabled?: boolean;
  className?: string;
}

export function PhotoUploadZone({ 
  onFilesUploaded, 
  isDragOver, 
  disabled = false,
  className = ""
}: PhotoUploadZoneProps) {
  const [internalDragOver, setInternalDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setInternalDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setInternalDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setInternalDragOver(false);
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    onFilesUploaded(files);
  }, [disabled, onFilesUploaded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = Array.from(e.target.files || []);
    onFilesUploaded(files);
  }, [disabled, onFilesUploaded]);

  const isCurrentlyDragging = isDragOver || internalDragOver;

  return (
    <motion.div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isCurrentlyDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
    >
      <div className="text-6xl mb-4">📸</div>
      <h3 className="text-xl font-semibold mb-2">
        {isCurrentlyDragging ? 'Déposez vos photos ici' : 'Glissez-déposez vos photos'}
      </h3>
      <p className="text-gray-600 mb-4">
        ou cliquez pour sélectionner des fichiers
      </p>
      
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
        id="photo-upload"
      />
      
      <label
        htmlFor="photo-upload"
        className={`inline-block px-4 py-2 rounded-lg ${
          disabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
        } transition-colors`}
      >
        Choisir des fichiers
      </label>
    </motion.div>
  );
}
