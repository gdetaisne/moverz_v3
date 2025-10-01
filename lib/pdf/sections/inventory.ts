// Section détails de l'inventaire avec photos
import PDFDocument from 'pdfkit';
import { COLORS, FONTS, SPACING, PDF_CONFIG } from '../styles';
import { PDFRoomData, PDFInventoryItem } from '../types';

export function addInventoryDetails(
  doc: PDFDocument,
  rooms: PDFRoomData[]
): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Titre de section
  doc
    .fontSize(FONTS.sizes.h2)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('📋 DÉTAIL DE L\'INVENTAIRE', margins.left, doc.y);
  
  doc.moveDown(1);
  
  // Parcourir chaque pièce
  rooms.forEach((room, roomIndex) => {
    // Vérifier si on a besoin d'une nouvelle page
    if (doc.y > PDF_CONFIG.pageHeight - 200) {
      doc.addPage();
    }
    
    // Titre de la pièce
    addRoomTitle(doc, room.name, roomIndex + 1);
    
    // Parcourir les photos de la pièce
    room.photos.forEach((photo, photoIndex) => {
      if (photo.items && photo.items.length > 0) {
        // Vérifier espace disponible
        if (doc.y > PDF_CONFIG.pageHeight - 250) {
          doc.addPage();
        }
        
        addPhotoSection(doc, photo, photoIndex + 1, room.name);
      }
    });
    
    doc.moveDown(1);
  });
}

function addRoomTitle(doc: PDFDocument, roomName: string, roomNumber: number): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Fond coloré pour le titre de pièce
  const titleY = doc.y;
  const titleHeight = 30;
  
  doc
    .rect(margins.left, titleY, contentWidth, titleHeight)
    .fillColor(COLORS.primary)
    .fillOpacity(0.1)
    .fill();
  
  doc
    .rect(margins.left, titleY, contentWidth, titleHeight)
    .strokeColor(COLORS.primary)
    .lineWidth(2)
    .fillOpacity(1)
    .stroke();
  
  // Texte du titre
  doc
    .fontSize(FONTS.sizes.h3)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(
      `${roomNumber}. ${roomName}`,
      margins.left + SPACING.md,
      titleY + SPACING.sm,
      { width: contentWidth - SPACING.md * 2 }
    );
  
  doc.y = titleY + titleHeight + SPACING.md;
}

function addPhotoSection(
  doc: PDFDocument,
  photo: any,
  photoNumber: number,
  roomName: string
): void {
  const { margins, contentWidth } = PDF_CONFIG;
  const startY = doc.y;
  
  // Layout: Photo à gauche (200px), liste à droite
  const photoWidth = 200;
  const photoHeight = 150;
  const listX = margins.left + photoWidth + SPACING.lg;
  const listWidth = contentWidth - photoWidth - SPACING.lg;
  
  // Ajouter la photo si disponible
  if (photo.photoData && typeof photo.photoData === 'string' && photo.photoData.startsWith('data:image')) {
    try {
      // Cadre pour la photo
      doc
        .rect(margins.left, startY, photoWidth, photoHeight)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke();
      
      // Photo en base64
      const base64Data = photo.photoData.includes(',') 
        ? photo.photoData.split(',')[1] 
        : photo.photoData;
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      doc.image(imageBuffer, margins.left + 2, startY + 2, {
        width: photoWidth - 4,
        height: photoHeight - 4,
        fit: [photoWidth - 4, photoHeight - 4],
        align: 'center',
        valign: 'center',
      });
      
      // Numéro de photo
      doc
        .fontSize(FONTS.sizes.small)
        .fillColor(COLORS.text.light)
        .font('Helvetica')
        .text(
          `Photo ${photoNumber}`,
          margins.left,
          startY + photoHeight + SPACING.xs,
          { width: photoWidth, align: 'center' }
        );
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la photo:', error);
      // Placeholder si erreur
      addPhotoPlaceholder(doc, margins.left, startY, photoWidth, photoHeight);
    }
  } else {
    // Pas de photo disponible ou format non supporté - afficher placeholder
    addPhotoPlaceholder(doc, margins.left, startY, photoWidth, photoHeight);
  }
  
  // Liste des objets à droite
  doc.y = startY;
  addItemsList(doc, photo.items, listX, listWidth);
  
  // S'assurer qu'on est en dessous de la photo
  if (doc.y < startY + photoHeight + SPACING.xl) {
    doc.y = startY + photoHeight + SPACING.xl;
  }
}

function addPhotoPlaceholder(
  doc: PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  doc
    .rect(x, y, width, height)
    .fillColor(COLORS.background.medium)
    .fill();
  
  doc
    .rect(x, y, width, height)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();
  
  doc
    .fontSize(FONTS.sizes.small)
    .fillColor(COLORS.text.light)
    .font('Helvetica')
    .text('📷 Photo non incluse', x, y + height / 2 - 10, {
      width: width,
      align: 'center',
    });
}

function addItemsList(
  doc: PDFDocument,
  items: PDFInventoryItem[],
  x: number,
  width: number
): void {
  items.forEach((item, index) => {
    // Vérifier si on dépasse la page
    if (doc.y > PDF_CONFIG.pageHeight - 100) {
      doc.addPage();
      doc.y = PDF_CONFIG.margins.top;
    }
    
    const itemY = doc.y;
    
    // Puce
    doc
      .fontSize(FONTS.sizes.body)
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .text('•', x, itemY, { width: 10 });
    
    // Nom de l'objet avec quantité
    const itemName = item.quantity > 1 
      ? `${item.quantity}x ${item.label}` 
      : item.label;
    
    doc
      .fontSize(FONTS.sizes.body)
      .fillColor(COLORS.text.dark)
      .font('Helvetica-Bold')
      .text(itemName, x + 15, itemY, { width: width - 15 });
    
    doc.moveDown(0.2);
    
    // Détails sur la ligne suivante
    const details = [];
    
    if (item.volume_m3 > 0) {
      details.push(`${item.volume_m3.toFixed(2)}m³`);
    }
    
    if (item.dimensions_cm && (item.dimensions_cm.length || item.dimensions_cm.width || item.dimensions_cm.height)) {
      const dims = [];
      if (item.dimensions_cm.length) dims.push(`L${item.dimensions_cm.length}`);
      if (item.dimensions_cm.width) dims.push(`l${item.dimensions_cm.width}`);
      if (item.dimensions_cm.height) dims.push(`H${item.dimensions_cm.height}`);
      if (dims.length > 0) {
        details.push(dims.join('×') + 'cm');
      }
    }
    
    if (item.fragile) {
      details.push('⚠️ Fragile');
    }
    
    if (item.dismountable) {
      details.push('🔧 Démontable');
    }
    
    if (details.length > 0) {
      doc
        .fontSize(FONTS.sizes.small)
        .fillColor(COLORS.text.medium)
        .font('Helvetica')
        .text(details.join(' • '), x + 15, doc.y, { width: width - 15 });
    }
    
    if (item.notes) {
      doc.moveDown(0.1);
      doc
        .fontSize(FONTS.sizes.small)
        .fillColor(COLORS.text.light)
        .font('Helvetica-Oblique')
        .text(`Note: ${item.notes}`, x + 15, doc.y, { width: width - 15 });
    }
    
    doc.moveDown(0.4);
  });
}

