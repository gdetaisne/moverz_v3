/**
 * LOT 15 - Export Batch PDF
 * 
 * Génère un PDF lisible contenant :
 * - Header avec informations batch
 * - Résumé progression (statuts, compteurs)
 * - Inventaire par pièce (si disponible)
 * - Liste des photos avec statut
 */

import PDFDocument from 'pdfkit';
import { BatchProgress } from '../batch/batchService';
import { Readable } from 'stream';

/**
 * Créer un stream PDF pour un batch
 */
export function exportBatchToPDF(progress: BatchProgress): Readable {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Batch Export - ${progress.batchId}`,
      Author: 'Moverz v4',
      Subject: 'Batch Progress Report',
      CreationDate: new Date(),
    },
  });

  // Header
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('Batch Export Report', { align: 'center' })
    .moveDown();

  // Batch Information
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Batch Information')
    .moveDown(0.5);

  doc.fontSize(11).font('Helvetica');
  
  const batchInfo = [
    ['Batch ID:', progress.batchId],
    ['Status:', progress.status],
    ['Progress:', `${progress.progress}%`],
    ['Generated:', new Date().toLocaleString()],
  ];

  batchInfo.forEach(([label, value]) => {
    doc
      .font('Helvetica-Bold')
      .text(label, { continued: true })
      .font('Helvetica')
      .text(` ${value}`);
  });

  doc.moveDown();

  // Progress Summary
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Progress Summary')
    .moveDown(0.5);

  doc.fontSize(11).font('Helvetica');

  const statusCounts = [
    ['Total Photos:', progress.counts.total],
    ['Queued:', progress.counts.queued],
    ['Processing:', progress.counts.processing],
    ['Completed:', progress.counts.completed],
    ['Failed:', progress.counts.failed],
  ];

  statusCounts.forEach(([label, value]) => {
    doc
      .font('Helvetica-Bold')
      .text(label, { continued: true })
      .font('Helvetica')
      .text(` ${value}`);
  });

  doc.moveDown();

  // Inventory Summary (si disponible)
  if (progress.inventorySummary && progress.inventorySummary.rooms.length > 0) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Inventory Summary')
      .moveDown(0.5);

    // Tableau inventaire
    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 250;
    const col3X = 400;

    // Headers
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Room Type', col1X, tableTop);
    doc.text('Items', col2X, tableTop);
    doc.text('Volume (m³)', col3X, tableTop);

    doc.moveDown(0.5);
    let currentY = doc.y;

    // Ligne séparatrice
    doc
      .moveTo(col1X, currentY)
      .lineTo(500, currentY)
      .stroke();

    currentY += 10;
    doc.y = currentY;

    // Lignes de données
    doc.fontSize(10).font('Helvetica');
    progress.inventorySummary.rooms.forEach((room) => {
      doc.text(room.roomType, col1X, doc.y);
      doc.text(room.itemsCount.toString(), col2X, doc.y);
      doc.text(room.volume_m3.toFixed(3), col3X, doc.y);
      doc.moveDown(0.3);
    });

    // Ligne séparatrice avant total
    currentY = doc.y;
    doc
      .moveTo(col1X, currentY)
      .lineTo(500, currentY)
      .stroke();

    currentY += 10;
    doc.y = currentY;

    // Total
    doc.font('Helvetica-Bold');
    doc.text('TOTAL', col1X, doc.y);
    doc.text(progress.inventorySummary.totalItems.toString(), col2X, doc.y);
    doc.text(progress.inventorySummary.totalVolume.toFixed(3), col3X, doc.y);

    doc.moveDown();
  }

  // Photos List
  doc.addPage();
  
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Photos List')
    .moveDown(0.5);

  doc.fontSize(9).font('Helvetica');

  if (progress.photos.length === 0) {
    doc.text('No photos in this batch.');
  } else {
    progress.photos.forEach((photo, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.font('Helvetica-Bold').text(`${index + 1}. ${photo.filename}`, {
        continued: false,
      });

      const details: string[] = [];
      details.push(`   Status: ${photo.status}`);
      
      if (photo.roomType) {
        details.push(`   Room: ${photo.roomType}`);
      }

      if (photo.errorCode || photo.errorMessage) {
        details.push(`   Error: ${photo.errorCode || 'Unknown'}`);
        if (photo.errorMessage) {
          details.push(`   Message: ${photo.errorMessage}`);
        }
      }

      doc.font('Helvetica').text(details.join('\n'));
      doc.moveDown(0.3);
    });
  }

  // Footer sur toutes les pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Page ${i + 1} of ${range.count} | Batch ${progress.batchId}`,
        50,
        doc.page.height - 50,
        {
          align: 'center',
        }
      );
  }

  // Finaliser le document
  doc.end();

  return doc as unknown as Readable;
}

/**
 * Obtenir le nom de fichier PDF pour un batch
 */
export function getPDFFilename(batchId: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `batch-${batchId}-${timestamp}.pdf`;
}



