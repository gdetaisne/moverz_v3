// Section tableaux récapitulatifs
import PDFDocument from 'pdfkit';
import { COLORS, FONTS, SPACING, PDF_CONFIG } from '../styles';
import { PDFRoomData, PDFInventoryItem } from '../types';

export function addRecapTables(doc: typeof PDFDocument, rooms: PDFRoomData[]): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Nouvelle page pour les tableaux
  doc.addPage();
  
  // Collecter tous les objets fragiles et tous les meubles
  const fragileItems: Array<PDFInventoryItem & { roomName: string }> = [];
  const furnitureItems: Array<PDFInventoryItem & { roomName: string }> = [];
  
  rooms.forEach(room => {
    room.photos.forEach(photo => {
      if (photo.items) {
        photo.items.forEach((item: PDFInventoryItem) => {
          if (item.fragile) {
            fragileItems.push({ ...item, roomName: room.name });
          }
          if (item.category === 'furniture' || item.volume_m3 > 0.1) {
            furnitureItems.push({ ...item, roomName: room.name });
          }
        });
      }
    });
  });
  
  // Titre de la page
  doc
    .fontSize(FONTS.sizes.h2)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('TABLEAUX RÉCAPITULATIFS', margins.left, margins.top);
  
  doc.moveDown(1);
  
  // TABLEAU 1 : Objets fragiles
  if (fragileItems.length > 0) {
    addTableTitle(doc, 'OBJETS FRAGILES', COLORS.warning);
    addFragileTable(doc, fragileItems);
    doc.moveDown(1.5);
  }
  
  // TABLEAU 2 : Meubles
  if (furnitureItems.length > 0) {
    // Vérifier si on a besoin d'une nouvelle page
    if (doc.y > PDF_CONFIG.pageHeight - 300) {
      doc.addPage();
      doc.y = margins.top;
    }
    
    addTableTitle(doc, 'MEUBLES ET GROS OBJETS', COLORS.secondary);
    addFurnitureTable(doc, furnitureItems);
  }
}

function addTableTitle(doc: typeof PDFDocument, title: string, color: string): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  doc
    .fontSize(FONTS.sizes.h3)
    .fillColor(color)
    .font('Helvetica-Bold')
    .text(title, margins.left, doc.y);
  
  doc.moveDown(0.5);
}

function addFragileTable(doc: typeof PDFDocument, items: Array<PDFInventoryItem & { roomName: string }>): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Dimensions des colonnes
  const col1Width = 150; // Article
  const col2Width = 80;  // Pièce
  const col3Width = 120; // Dimensions
  const col4Width = 60;  // Volume
  const col5Width = contentWidth - col1Width - col2Width - col3Width - col4Width; // Qté
  
  const tableY = doc.y;
  let currentY = tableY;
  
  // En-tête du tableau
  doc
    .rect(margins.left, currentY, contentWidth, 25)
    .fillColor(COLORS.warning)
    .fillOpacity(0.2)
    .fill();
  
  doc
    .rect(margins.left, currentY, contentWidth, 25)
    .strokeColor(COLORS.warning)
    .lineWidth(1.5)
    .fillOpacity(1)
    .stroke();
  
  // Texte de l'en-tête
  doc
    .fontSize(FONTS.sizes.small)
    .fillColor(COLORS.text.dark)
    .font('Helvetica-Bold');
  
  doc.text('ARTICLE', margins.left + 5, currentY + 8, { width: col1Width - 10 });
  doc.text('PIÈCE', margins.left + col1Width + 5, currentY + 8, { width: col2Width - 10 });
  doc.text('DIMENSIONS (cm)', margins.left + col1Width + col2Width + 5, currentY + 8, { width: col3Width - 10 });
  doc.text('VOLUME', margins.left + col1Width + col2Width + col3Width + 5, currentY + 8, { width: col4Width - 10 });
  doc.text('QTÉ', margins.left + col1Width + col2Width + col3Width + col4Width + 5, currentY + 8, { width: col5Width - 10 });
  
  currentY += 25;
  
  // Lignes du tableau
  items.forEach((item, index) => {
    // Vérifier si on dépasse la page
    if (currentY > PDF_CONFIG.pageHeight - 60) {
      doc.addPage();
      currentY = margins.top;
      
      // Redessiner l'en-tête sur la nouvelle page
      doc
        .rect(margins.left, currentY, contentWidth, 25)
        .fillColor(COLORS.warning)
        .fillOpacity(0.2)
        .fill();
      
      doc
        .fontSize(FONTS.sizes.small)
        .fillColor(COLORS.text.dark)
        .font('Helvetica-Bold');
      
      doc.text('ARTICLE', margins.left + 5, currentY + 8, { width: col1Width - 10 });
      doc.text('PIÈCE', margins.left + col1Width + 5, currentY + 8, { width: col2Width - 10 });
      doc.text('DIMENSIONS', margins.left + col1Width + col2Width + 5, currentY + 8, { width: col3Width - 10 });
      doc.text('VOLUME', margins.left + col1Width + col2Width + col3Width + 5, currentY + 8, { width: col4Width - 10 });
      doc.text('QTÉ', margins.left + col1Width + col2Width + col3Width + col4Width + 5, currentY + 8, { width: col5Width - 10 });
      
      currentY += 25;
    }
    
    const rowHeight = 20;
    
    // Fond alterné
    if (index % 2 === 0) {
      doc
        .rect(margins.left, currentY, contentWidth, rowHeight)
        .fillColor(COLORS.background.light)
        .fill();
    }
    
    // Bordure de ligne
    doc
      .rect(margins.left, currentY, contentWidth, rowHeight)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();
    
    // Contenu de la ligne
    doc
      .fontSize(FONTS.sizes.small)
      .fillColor(COLORS.text.dark)
      .font('Helvetica');
    
    doc.text(item.label, margins.left + 5, currentY + 6, { width: col1Width - 10 });
    doc.text(item.roomName, margins.left + col1Width + 5, currentY + 6, { width: col2Width - 10 });
    
    // Dimensions
    let dimsText = '-';
    if (item.dimensions_cm && (item.dimensions_cm.length || item.dimensions_cm.width || item.dimensions_cm.height)) {
      const dims = [];
      if (item.dimensions_cm.length) dims.push(`L${item.dimensions_cm.length}`);
      if (item.dimensions_cm.width) dims.push(`l${item.dimensions_cm.width}`);
      if (item.dimensions_cm.height) dims.push(`H${item.dimensions_cm.height}`);
      dimsText = dims.join('×');
    }
    doc.text(dimsText, margins.left + col1Width + col2Width + 5, currentY + 6, { width: col3Width - 10 });
    
    doc.text(item.volume_m3.toFixed(2) + 'm³', margins.left + col1Width + col2Width + col3Width + 5, currentY + 6, { width: col4Width - 10 });
    doc.text(item.quantity.toString(), margins.left + col1Width + col2Width + col3Width + col4Width + 5, currentY + 6, { width: col5Width - 10 });
    
    currentY += rowHeight;
  });
  
  doc.y = currentY;
}

function addFurnitureTable(doc: typeof PDFDocument, items: Array<PDFInventoryItem & { roomName: string }>): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Dimensions des colonnes
  const col1Width = 150; // Article
  const col2Width = 80;  // Pièce
  const col3Width = 120; // Dimensions
  const col4Width = 60;  // Volume
  const col5Width = contentWidth - col1Width - col2Width - col3Width - col4Width; // Notes
  
  const tableY = doc.y;
  let currentY = tableY;
  
  // En-tête du tableau
  doc
    .rect(margins.left, currentY, contentWidth, 25)
    .fillColor(COLORS.secondary)
    .fillOpacity(0.2)
    .fill();
  
  doc
    .rect(margins.left, currentY, contentWidth, 25)
    .strokeColor(COLORS.secondary)
    .lineWidth(1.5)
    .fillOpacity(1)
    .stroke();
  
  // Texte de l'en-tête
  doc
    .fontSize(FONTS.sizes.small)
    .fillColor(COLORS.text.dark)
    .font('Helvetica-Bold');
  
  doc.text('ARTICLE', margins.left + 5, currentY + 8, { width: col1Width - 10 });
  doc.text('PIÈCE', margins.left + col1Width + 5, currentY + 8, { width: col2Width - 10 });
  doc.text('DIMENSIONS (cm)', margins.left + col1Width + col2Width + 5, currentY + 8, { width: col3Width - 10 });
  doc.text('VOLUME', margins.left + col1Width + col2Width + col3Width + 5, currentY + 8, { width: col4Width - 10 });
  doc.text('INFO', margins.left + col1Width + col2Width + col3Width + col4Width + 5, currentY + 8, { width: col5Width - 10 });
  
  currentY += 25;
  
  // Lignes du tableau
  items.forEach((item, index) => {
    // Vérifier si on dépasse la page
    if (currentY > PDF_CONFIG.pageHeight - 60) {
      doc.addPage();
      currentY = margins.top;
      
      // Redessiner l'en-tête sur la nouvelle page
      doc
        .rect(margins.left, currentY, contentWidth, 25)
        .fillColor(COLORS.secondary)
        .fillOpacity(0.2)
        .fill();
      
      doc
        .fontSize(FONTS.sizes.small)
        .fillColor(COLORS.text.dark)
        .font('Helvetica-Bold');
      
      doc.text('ARTICLE', margins.left + 5, currentY + 8, { width: col1Width - 10 });
      doc.text('PIÈCE', margins.left + col1Width + 5, currentY + 8, { width: col2Width - 10 });
      doc.text('DIMENSIONS', margins.left + col1Width + col2Width + 5, currentY + 8, { width: col3Width - 10 });
      doc.text('VOLUME', margins.left + col1Width + col2Width + col3Width + 5, currentY + 8, { width: col4Width - 10 });
      doc.text('INFO', margins.left + col1Width + col2Width + col3Width + col4Width + 5, currentY + 8, { width: col5Width - 10 });
      
      currentY += 25;
    }
    
    const rowHeight = 20;
    
    // Fond alterné
    if (index % 2 === 0) {
      doc
        .rect(margins.left, currentY, contentWidth, rowHeight)
        .fillColor(COLORS.background.light)
        .fill();
    }
    
    // Bordure de ligne
    doc
      .rect(margins.left, currentY, contentWidth, rowHeight)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();
    
    // Contenu de la ligne
    doc
      .fontSize(FONTS.sizes.small)
      .fillColor(COLORS.text.dark)
      .font('Helvetica');
    
    const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
    doc.text(qty + item.label, margins.left + 5, currentY + 6, { width: col1Width - 10 });
    doc.text(item.roomName, margins.left + col1Width + 5, currentY + 6, { width: col2Width - 10 });
    
    // Dimensions
    let dimsText = '-';
    if (item.dimensions_cm && (item.dimensions_cm.length || item.dimensions_cm.width || item.dimensions_cm.height)) {
      const dims = [];
      if (item.dimensions_cm.length) dims.push(`L${item.dimensions_cm.length}`);
      if (item.dimensions_cm.width) dims.push(`l${item.dimensions_cm.width}`);
      if (item.dimensions_cm.height) dims.push(`H${item.dimensions_cm.height}`);
      dimsText = dims.join('×');
    }
    doc.text(dimsText, margins.left + col1Width + col2Width + 5, currentY + 6, { width: col3Width - 10 });
    
    doc.text(item.volume_m3.toFixed(2) + 'm³', margins.left + col1Width + col2Width + col3Width + 5, currentY + 6, { width: col4Width - 10 });
    
    // Info (démontable, fragile)
    const info = [];
    if (item.dismountable) info.push('Démontable');
    if (item.fragile) info.push('Fragile');
    doc.text(info.join(', ') || '-', margins.left + col1Width + col2Width + col3Width + col4Width + 5, currentY + 6, { width: col5Width - 10 });
    
    currentY += rowHeight;
  });
  
  doc.y = currentY;
}


