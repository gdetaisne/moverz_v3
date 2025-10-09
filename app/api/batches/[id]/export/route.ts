import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@core/auth';
import { computeBatchProgress } from '@moverz/core';
import { prisma } from '@core/db';
import { logger } from '@/lib/logger';
import { exportBatchToCSV, getCSVFilename } from '@moverz/core/export/csv';
import { exportBatchToPDF, getPDFFilename } from '@moverz/core/export/pdf';

/**
 * GET /api/batches/[id]/export?format=csv|pdf
 * Export un batch au format CSV ou PDF
 * 
 * LOT 15 - Export Batch CSV/PDF
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    // 1. Authentification
    const userId = await getUserId(req);
    const { id: batchId } = await params;

    // 2. Récupérer le format depuis query params
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format')?.toLowerCase();

    if (!format || !['csv', 'pdf'].includes(format)) {
      logger.warn(`Export batch ${batchId}: format invalide "${format}"`);
      return NextResponse.json(
        { 
          error: 'Format invalide', 
          code: 'INVALID_FORMAT',
          message: 'Le paramètre "format" doit être "csv" ou "pdf"',
        },
        { status: 400 }
      );
    }

    // 3. Vérifier que le batch existe et appartient à l'utilisateur
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { 
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!batch) {
      logger.warn(`Export batch ${batchId}: batch non trouvé`);
      return NextResponse.json(
        { error: 'Batch non trouvé', code: 'BATCH_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (batch.userId !== userId) {
      logger.warn(`Export batch ${batchId}: accès refusé pour user ${userId}`);
      return NextResponse.json(
        { error: 'Non autorisé', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    // 4. Récupérer les données du batch (avec cache)
    const progress = await computeBatchProgress(batchId, true);
    
    logger.info(`📤 Export batch ${batchId} au format ${format.toUpperCase()} par user ${userId}`);

    // 5. Générer l'export selon le format
    if (format === 'csv') {
      const csv = exportBatchToCSV(progress);
      const filename = getCSVFilename(batchId);
      
      const duration = Date.now() - startTime;
      logger.info(`✅ Export CSV batch ${batchId} généré en ${duration}ms (${csv.length} bytes)`);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Length': Buffer.byteLength(csv, 'utf-8').toString(),
        },
      });
    } else {
      // format === 'pdf'
      const pdfStream = exportBatchToPDF(progress);
      const filename = getPDFFilename(batchId);
      
      logger.info(`✅ Export PDF batch ${batchId} en streaming`);

      // Convertir le stream en ReadableStream pour Next.js
      const readableStream = new ReadableStream({
        start(controller) {
          pdfStream.on('data', (chunk: Buffer) => {
            controller.enqueue(chunk);
          });

          pdfStream.on('end', () => {
            const duration = Date.now() - startTime;
            logger.info(`✅ Export PDF batch ${batchId} terminé en ${duration}ms`);
            controller.close();
          });

          pdfStream.on('error', (err: Error) => {
            logger.error(`❌ Erreur export PDF batch ${batchId}:`, err);
            controller.error(err);
          });
        },
      });

      return new NextResponse(readableStream, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

  } catch (error: any) {
    const { id } = await params;
    const duration = Date.now() - startTime;
    logger.error(`❌ Erreur export batch ${id} (${duration}ms):`, error);

    return NextResponse.json(
      { 
        error: error.message || 'Erreur serveur lors de l\'export',
        code: 'EXPORT_ERROR',
      },
      { status: 500 }
    );
  }
}

// Disable static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


