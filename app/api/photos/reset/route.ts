import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Reset API - Suppression de toutes les photos...');
    
    // Supprimer toutes les photos
    const deletedPhotos = await prisma.photo.deleteMany({});
    
    console.log(`✅ ${deletedPhotos.count} photos supprimées via API`);
    
    return NextResponse.json({
      success: true,
      message: `${deletedPhotos.count} photos supprimées`,
      deletedCount: deletedPhotos.count
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du reset via API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du reset',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
