'use client';
import React from 'react';
import { resolvePhotoSrc } from '@core/imageUrl';

export default function PhotoThumbnail({ photo, size = 64 }: { photo: any; size?: number }) {
  const src = resolvePhotoSrc(photo);
  const style: React.CSSProperties = {
    width: size, height: size, borderRadius: 8, objectFit: 'cover', background: '#111'
  };
  if (!src) return <div style={{ ...style }} />;
  return <img src={src} alt={photo?.filename || 'photo'} style={style} />;
}
