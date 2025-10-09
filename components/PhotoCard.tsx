'use client';

import Image from 'next/image';
import React from 'react';
import { resolvePhotoSrc } from '@/lib/imageUrl';

type Props = { photo: any; className?: string };

export default function PhotoCard({ photo, className }: Props) {
  const src = resolvePhotoSrc(photo);
  const alt = photo?.filename || photo?.roomType || 'photo';
  // Fallback to plain <img> if Next/Image fails
  if (!src) return <div className={className} style={{ background: '#111', height: 180, borderRadius: 8 }} />;

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: 180 }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        style={{ objectFit: 'cover', borderRadius: 8, background: '#111' }}
        unoptimized
      />
    </div>
  );
}
