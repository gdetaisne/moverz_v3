'use client';
import React from 'react';
import PhotoCard from './PhotoCard';

export default function RoomPhotoGrid({ photos }: { photos: any[] }) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return <div className="text-sm text-gray-500">Aucune photo</div>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {photos.map((p) => (
        <PhotoCard key={p.id || p.photoId} photo={p} />
      ))}
    </div>
  );
}
