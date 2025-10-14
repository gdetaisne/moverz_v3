// Endpoint de debug pour diagnostiquer les photos
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    
    // Récupérer toutes les photos de l'utilisateur
    const photos = await prisma.photo.findMany({
      where: {
        project: { userId: userId || undefined }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        filename: true,
        status: true,
        roomType: true,
        analysis: true,
        createdAt: true
      }
    });

    // Analyser les statuts
    const stats = {
      total: photos.length,
      byStatus: {
        PENDING: photos.filter(p => p.status === 'PENDING').length,
        PROCESSING: photos.filter(p => p.status === 'PROCESSING').length,
        DONE: photos.filter(p => p.status === 'DONE').length,
        ERROR: photos.filter(p => p.status === 'ERROR').length,
      },
      withAnalysis: photos.filter(p => p.analysis).length,
      withItems: photos.filter(p => p.analysis && (p.analysis as any).items).length,
      readyForPDF: photos.filter(p => p.status === 'DONE' && p.analysis && (p.analysis as any).items).length
    };

    return NextResponse.json({
      stats,
      photos: photos.map(p => ({
        id: p.id,
        filename: p.filename,
        status: p.status,
        roomType: p.roomType,
        hasAnalysis: !!p.analysis,
        hasItems: !!(p.analysis && (p.analysis as any).items),
        itemsCount: p.analysis && (p.analysis as any).items ? (p.analysis as any).items.length : 0,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('Erreur debug photos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
