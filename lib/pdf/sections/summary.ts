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
    .text('RÉCAPITULATIF DE L\'INVENTAIRE', margins.left, doc.y);
  
  doc.moveDown(0.5);
  
  // Cadre avec fond dégradé simulé
  const boxY = doc.y;
  const boxHeight = 110;
  
  // Fond bleu clair
  doc
    .roundedRect(margins.left, boxY, contentWidth, boxHeight, 8)
    .fillColor(COLORS.background.accent)
    .fill();
  
  // Bordure bleue épaisse
  doc
    .roundedRect(margins.left, boxY, contentWidth, boxHeight, 8)
    .strokeColor(COLORS.primary)
    .lineWidth(2)
    .stroke();
  
  // Contenu du cadre - Layout en 3 colonnes
  const boxPadding = 20;
  const colWidth = (contentWidth - boxPadding * 2) / 3;
  let currentX = margins.left + boxPadding;
  const boxContentY = boxY + boxPadding;
  
  // Colonne 1 - Volume total
  doc
    .fontSize(32)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(summary.totalVolume.toFixed(1), currentX, boxContentY, { 
      width: colWidth, 
      align: 'center' 
    });
  
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.medium)
    .font('Helvetica')
    .text('m³ total', currentX, doc.y + 4, { 
      width: colWidth, 
      align: 'center' 
    });
  
  currentX += colWidth;
  
  // Colonne 2 - Nombre d'objets
  doc
    .fontSize(32)
    .fillColor(COLORS.success)
    .font('Helvetica-Bold')
    .text(summary.totalItems.toString(), currentX, boxContentY, { 
      width: colWidth, 
      align: 'center' 
    });
  
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.medium)
    .font('Helvetica')
    .text('objets', currentX, doc.y + 4, { 
      width: colWidth, 
      align: 'center' 
    });
  
  currentX += colWidth;
  
  // Colonne 3 - Nombre de pièces
  doc
    .fontSize(32)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text(summary.roomCount.toString(), currentX, boxContentY, { 
      width: colWidth, 
      align: 'center' 
    });
  
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.medium)
    .font('Helvetica')
    .text('pièces', currentX, doc.y + 4, { 
      width: colWidth, 
      align: 'center' 
    });
  
  // Tags en bas du cadre - Afficher uniquement si présents
  const tagsY = boxY + boxHeight - 28;
  currentX = margins.left + boxPadding;
  
  const tags = [];
  if (summary.hasFragileItems) tags.push({ text: 'OBJETS FRAGILES', color: COLORS.warning });
  if (summary.hasDismountableItems) tags.push({ text: 'DÉMONTAGE REQUIS', color: COLORS.secondary });
  
  tags.forEach((tag, index) => {
    if (index > 0) currentX += 145; // Espacement entre tags
    addTag(doc, tag.text, currentX, tagsY, tag.color);
  });
  
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
  const tagWidth = 130;
  const tagHeight = 22;
  
  // Fond du tag - plus opaque
  doc
    .roundedRect(x, y, tagWidth, tagHeight, 4)
    .fillColor(color)
    .fillOpacity(0.15)
    .fill();
  
  // Bordure du tag - plus épaisse
  doc
    .roundedRect(x, y, tagWidth, tagHeight, 4)
    .strokeColor(color)
    .lineWidth(1.5)
    .fillOpacity(1)
    .stroke();
  
  // Texte du tag - centré
  doc
    .fontSize(FONTS.sizes.small)
    .fillColor(color)
    .font('Helvetica-Bold')
    .text(text, x, y + 7, { width: tagWidth, align: 'center' });
}

