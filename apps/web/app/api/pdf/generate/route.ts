// API endpoint pour générer un PDF de devis
import { NextRequest, NextResponse } from 'next/server';
import { 
  generateMovingQuotePDF, 
  generateReferenceNumber,
  formatGeneratedDate 
} from '@core/pdf/generator';
import { PDFGenerationData } from '@core/pdf/types';

// Force l'utilisation du runtime Node.js (pas Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Parser les données du body
    const body = await req.json();
    
    // Validation basique
    if (!body.formData || !body.rooms) {
      return NextResponse.json(
        { error: 'Données manquantes: formData et rooms requis' },
        { status: 400 }
      );
    }

    // Préparer les données pour le PDF
    const pdfData: PDFGenerationData = {
      formData: body.formData,
      rooms: body.rooms,
      referenceNumber: generateReferenceNumber(),
      generatedDate: formatGeneratedDate(),
    };

    // Générer le PDF
    const pdfBuffer = await generateMovingQuotePDF(pdfData);

    // Retourner le PDF
    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="devis-demenagement-${pdfData.referenceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération du PDF',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
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

