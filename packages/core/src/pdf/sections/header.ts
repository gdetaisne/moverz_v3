// Section header du PDF
import PDFDocument from 'pdfkit';
import { COLORS, FONTS, SPACING, PDF_CONFIG } from '../styles';

export function addHeader(
  doc: typeof PDFDocument,
  referenceNumber: string,
  generatedDate: string
): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Bandeau bleu en haut
  doc
    .rect(0, 0, PDF_CONFIG.pageWidth, 80)
    .fillColor(COLORS.primary)
    .fill();
  
  // Titre principal en blanc
  doc
    .fontSize(FONTS.sizes.h1)
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .text('RÉCAPITULATIF DE DEMANDE DE DEVIS', margins.left, margins.top - 15);
  
  // Sous-titre
  doc
    .fontSize(FONTS.sizes.small)
    .fillColor('#FFFFFF')
    .fillOpacity(0.9)
    .font('Helvetica')
    .text('Document pour établissement du devis de déménagement', margins.left, doc.y + 5);
  
  doc.fillOpacity(1); // Reset opacity
  
  // Zone info sur fond blanc
  const infoY = 90;
  doc.y = infoY;
  
  // Numéro de référence (gauche)
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.dark)
    .font('Helvetica-Bold')
    .text('Référence:', margins.left, infoY, { continued: true })
    .font('Helvetica')
    .fillColor(COLORS.text.medium)
    .text(` ${referenceNumber}`);
  
  // Date de génération (droite)
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.dark)
    .font('Helvetica-Bold')
    .text('Généré le:', margins.left + contentWidth / 2, infoY, { continued: true })
    .font('Helvetica')
    .fillColor(COLORS.text.medium)
    .text(` ${generatedDate}`);
  
  // Ligne de séparation élégante
  doc.y = infoY + 20;
  doc
    .strokeColor(COLORS.primary)
    .lineWidth(2)
    .moveTo(margins.left, doc.y)
    .lineTo(margins.left + contentWidth, doc.y)
    .stroke();
  
  // Espace après header
  doc.moveDown(1.5);
}

export function addPageNumber(
  doc: typeof PDFDocument,
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

