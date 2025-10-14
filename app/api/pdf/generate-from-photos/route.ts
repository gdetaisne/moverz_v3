// API endpoint pour générer un PDF à partir d'IDs de photos
// Les images sont chargées côté serveur (pas de problème CORS)
import { NextRequest, NextResponse } from 'next/server';
import { 
  generateMovingQuotePDF, 
  generateReferenceNumber,
  formatGeneratedDate 
} from '@core/pdf/generator';
import { PDFGenerationData } from '@core/pdf/types';
import { prisma } from '@core/db';
import { promises as fs } from 'fs';
import path from 'path';

// Force l'utilisation du runtime Node.js (pas Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.formData) {
      return NextResponse.json(
        { error: 'formData requis' },
        { status: 400 }
      );
    }

    if (!body.photoIds || !Array.isArray(body.photoIds) || body.photoIds.length === 0) {
      return NextResponse.json(
        { error: 'photoIds requis (array d\'IDs)' },
        { status: 400 }
      );
    }

    console.log('📄 Génération PDF pour', body.photoIds.length, 'photos');

    // 1. Récupérer les photos depuis la DB
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: body.photoIds },
        status: 'DONE'
      },
      select: {
        id: true,
        filename: true,
        filePath: true,
        url: true,
        roomType: true,
        analysis: true
      }
    });

    if (photos.length === 0) {
      return NextResponse.json(
        { error: 'Aucune photo trouvée avec les IDs fournis' },
        { status: 404 }
      );
    }

    console.log('✅ Photos récupérées:', photos.length);

    // 2. Charger les images en base64 côté serveur
    const photosWithBase64 = await Promise.all(
      photos.map(async (photo) => {
        let photoDataBase64 = '';
        
        try {
          // Essayer de charger l'image depuis le système de fichiers
          if (photo.filePath) {
            const fullPath = path.join(process.cwd(), photo.filePath);
            
            try {
              const imageBuffer = await fs.readFile(fullPath);
              const ext = path.extname(photo.filename).toLowerCase();
              let mimeType = 'image/jpeg';
              
              if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.webp') mimeType = 'image/webp';
              else if (ext === '.gif') mimeType = 'image/gif';
              
              photoDataBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
              console.log(`✅ Image chargée: ${photo.filename} (${imageBuffer.length} bytes)`);
            } catch (fsError) {
              console.warn(`⚠️  Impossible de charger l'image depuis ${fullPath}:`, fsError);
              
              // Fallback : essayer de charger depuis l'URL
              if (photo.url && (photo.url.startsWith('http://') || photo.url.startsWith('https://'))) {
                try {
                  const response = await fetch(photo.url);
                  if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const contentType = response.headers.get('content-type') || 'image/jpeg';
                    photoDataBase64 = `data:${contentType};base64,${buffer.toString('base64')}`;
                    console.log(`✅ Image chargée depuis URL: ${photo.filename}`);
                  }
                } catch (urlError) {
                  console.error(`❌ Impossible de charger depuis URL ${photo.url}:`, urlError);
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ Erreur lors du chargement de ${photo.filename}:`, error);
        }

        return {
          ...photo,
          photoDataBase64
        };
      })
    );

    // 3. Grouper par pièce
    const roomsMap = new Map<string, any>();

    photosWithBase64.forEach(photo => {
      const roomType = photo.roomType || 'Pièce inconnue';
      
      if (!roomsMap.has(roomType)) {
        roomsMap.set(roomType, {
          id: roomType,
          name: roomType,
          photos: []
        });
      }

      // Extraire les items depuis l'analysis
      const analysis = photo.analysis as any;
      const items = analysis?.items || [];
      
      // Filtrer les items sélectionnés (si fourni)
      const selectedItems = body.selectedItemsMap?.[photo.id];
      const filteredItems = selectedItems 
        ? items.filter((_: any, idx: number) => selectedItems.includes(idx))
        : items; // Par défaut, tout inclure

      if (filteredItems.length > 0) {
        roomsMap.get(roomType)!.photos.push({
          fileUrl: photo.url,
          photoData: photo.photoDataBase64,
          items: filteredItems.map((item: any) => ({
            label: item.label,
            category: item.category,
            quantity: item.quantity || 1,
            dimensions_cm: item.dimensions_cm,
            volume_m3: item.volume_m3 || 0,
            fragile: item.fragile || false,
            dismountable: item.dismountable || false,
            notes: item.notes
          }))
        });
      }
    });

    const rooms = Array.from(roomsMap.values()).filter(room => room.photos.length > 0);

    console.log('🏠 Pièces préparées:', rooms.length);
    console.log('📦 Photos avec items:', rooms.reduce((sum, r) => sum + r.photos.length, 0));

    if (rooms.length === 0) {
      return NextResponse.json(
        { error: 'Aucune pièce avec items trouvée' },
        { status: 400 }
      );
    }

    // 4. Préparer les données pour le PDF
    const pdfData: PDFGenerationData = {
      formData: body.formData,
      rooms: rooms,
      referenceNumber: generateReferenceNumber(),
      generatedDate: formatGeneratedDate(),
    };

    console.log('🎨 Génération du PDF...');

    // 5. Générer le PDF
    const pdfBuffer = await generateMovingQuotePDF(pdfData);

    console.log('✅ PDF généré:', pdfBuffer.length, 'bytes');

    // 6. Retourner le PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="devis-demenagement-${pdfData.referenceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération du PDF',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Support pour les requêtes OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

