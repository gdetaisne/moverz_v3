import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

export const runtime = "nodejs";

/**
 * GET /api/uploads/[filename]
 * Sert les fichiers uploadés
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Sécurité : empêcher les path traversal attacks
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    const filePath = path.join(UPLOADS_DIR, filename);
    
    // Lire le fichier
    const file = await fs.readFile(filePath);
    
    // Déterminer le Content-Type
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = 
      ext === 'png' ? 'image/png' : 
      ext === 'webp' ? 'image/webp' :
      ext === 'gif' ? 'image/gif' :
      'image/jpeg';
    
    return new NextResponse(file as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    });
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


