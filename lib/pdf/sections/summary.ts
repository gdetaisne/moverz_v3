// Section récapitulatif de l'inventaire
import PDFDocument from 'pdfkit';
import { COLORS, FONTS, SPACING, PDF_CONFIG } from '../styles';
import { PDFSummary } from '../types';

export function addSummary(doc: PDFDocument, summary: PDFSummary): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Titre de section
  doc
    .fontSize(FONTS.sizes.h2)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('📊 RÉCAPITULATIF INVENTAIRE', margins.left, doc.y);
  
  doc.moveDown(0.5);
  
  // Cadre avec fond coloré
  const boxY = doc.y;
  const boxHeight = 80;
  
  // Fond
  doc
    .rect(margins.left, boxY, contentWidth, boxHeight)
    .fillColor(COLORS.background.light)
    .fill();
  
  // Bordure
  doc
    .rect(margins.left, boxY, contentWidth, boxHeight)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();
  
  // Contenu du cadre
  const boxPadding = SPACING.md;
  let currentX = margins.left + boxPadding;
  const boxContentY = boxY + boxPadding;
  
  // Volume total
  doc
    .fontSize(FONTS.sizes.h1)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(summary.totalVolume.toFixed(1), currentX, boxContentY, { width: 80 });
  
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.medium)
    .font('Helvetica')
    .text('m³ total', currentX, doc.y + SPACING.xs, { width: 80 });
  
  currentX += 100;
  
  // Nombre d'objets
  doc
    .fontSize(FONTS.sizes.h1)
    .fillColor(COLORS.success)
    .font('Helvetica-Bold')
    .text(summary.totalItems.toString(), currentX, boxContentY, { width: 80 });
  
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.medium)
    .font('Helvetica')
    .text('objets', currentX, doc.y + SPACING.xs, { width: 80 });
  
  currentX += 100;
  
  // Nombre de pièces
  doc
    .fontSize(FONTS.sizes.h1)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text(summary.roomCount.toString(), currentX, boxContentY, { width: 80 });
  
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.medium)
    .font('Helvetica')
    .text('pièces', currentX, doc.y + SPACING.xs, { width: 80 });
  
  // Tags en bas du cadre
  const tagsY = boxY + boxHeight - boxPadding - 20;
  currentX = margins.left + boxPadding;
  
  if (summary.hasFragileItems) {
    addTag(doc, '⚠️ Objets fragiles', currentX, tagsY, COLORS.warning);
    currentX += 120;
  }
  
  if (summary.hasDismountableItems) {
    addTag(doc, '🔧 Démontage requis', currentX, tagsY, COLORS.secondary);
  }
  
  // Position après le cadre
  doc.y = boxY + boxHeight + SPACING.xl;
}

function addTag(
  doc: PDFDocument,
  text: string,
  x: number,
  y: number,
  color: string
): void {
  const tagWidth = 110;
  const tagHeight = 18;
  
  // Fond du tag
  doc
    .roundedRect(x, y, tagWidth, tagHeight, 3)
    .fillColor(color)
    .fillOpacity(0.1)
    .fill();
  
  // Bordure du tag
  doc
    .roundedRect(x, y, tagWidth, tagHeight, 3)
    .strokeColor(color)
    .lineWidth(1)
    .fillOpacity(1)
    .stroke();
  
  // Texte du tag
  doc
    .fontSize(FONTS.sizes.small)
    .fillColor(color)
    .font('Helvetica-Bold')
    .text(text, x + 4, y + 5, { width: tagWidth - 8 });
}

