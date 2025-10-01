// Section header du PDF
import PDFDocument from 'pdfkit';
import { COLORS, FONTS, SPACING, PDF_CONFIG } from '../styles';

export function addHeader(
  doc: PDFDocument,
  referenceNumber: string,
  generatedDate: string
): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Logo / Titre principal
  doc
    .fontSize(FONTS.sizes.h1)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('DEVIS DÉMÉNAGEMENT', margins.left, margins.top);
  
  // Numéro de référence
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.medium)
    .font('Helvetica')
    .text(`Référence: ${referenceNumber}`, margins.left, doc.y + SPACING.sm);
  
  // Date de génération
  doc
    .text(`Généré le: ${generatedDate}`, margins.left, doc.y + SPACING.xs);
  
  // Ligne de séparation
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(margins.left, doc.y + SPACING.md)
    .lineTo(margins.left + contentWidth, doc.y + SPACING.md)
    .stroke();
  
  // Espace après header
  doc.moveDown(2);
}

export function addPageNumber(
  doc: PDFDocument,
  pageNumber: number,
  totalPages: number
): void {
  const { pageWidth, margins, pageHeight } = PDF_CONFIG;
  
  doc
    .fontSize(FONTS.sizes.small)
    .fillColor(COLORS.text.light)
    .text(
      `Page ${pageNumber} / ${totalPages}`,
      margins.left,
      pageHeight - margins.bottom + 20,
      { align: 'right', width: pageWidth - margins.left - margins.right }
    );
}

