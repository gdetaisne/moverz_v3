// Section détails de l'inventaire avec photos
import PDFDocument from 'pdfkit';
import { COLORS, FONTS, SPACING, PDF_CONFIG } from '../styles';
import { PDFRoomData, PDFInventoryItem } from '../types';

export function addInventoryDetails(
  doc: typeof PDFDocument,
  rooms: PDFRoomData[]
): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Titre de section
  doc
    .fontSize(FONTS.sizes.h2)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('DÉTAIL DE L\'INVENTAIRE', margins.left, doc.y);
  
  doc.moveDown(1);
  
  // Parcourir chaque pièce
  rooms.forEach((room, roomIndex) => {
    // 🎯 NOUVELLE PAGE pour chaque pièce (sauf la première)
    if (roomIndex > 0) {
      doc.addPage();
    }
    
    // Titre de la pièce
    addRoomTitle(doc, room.name, roomIndex + 1);
    
    // Calculer le total de la pièce
    let roomTotalVolume = 0;
    let roomTotalCartons = 0;
    
    // 🎯 NOUVELLE APPROCHE : Inventaire par pièce (pas par photo)
    // Tous les objets de la pièce sont regroupés ensemble
    const allRoomItems = room.photos.flatMap(photo => photo.items || []);
    
    if (allRoomItems.length > 0) {
      // Vérifier espace disponible (avec marge de sécurité)
      if (doc.y > PDF_CONFIG.pageHeight - 400) {
        doc.addPage();
      }
      
      const roomStats = addRoomInventorySection(doc, room, allRoomItems);
      roomTotalVolume += roomStats.totalVolume;
      roomTotalCartons += roomStats.totalCartons;
    }
    
    // Afficher le total de la pièce
    addRoomTotal(doc, roomTotalVolume, roomTotalCartons);
    
    // Espacement avant la prochaine pièce (sera sur nouvelle page)
    doc.moveDown(1);
  });
}

function addRoomTitle(doc: typeof PDFDocument, roomName: string, roomNumber: number): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Titre de pièce moderne avec bandeau
  const titleY = doc.y;
  const titleHeight = 32;
  
  // Fond bleu avec coins arrondis
  doc
    .roundedRect(margins.left, titleY, contentWidth, titleHeight, 6)
    .fillColor(COLORS.primary)
    .fill();
  
  // Texte du titre en blanc
  doc
    .fontSize(FONTS.sizes.h3 + 1)
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .text(
      `${roomNumber}. ${roomName.toUpperCase()}`,
      margins.left + SPACING.md,
      titleY + 10,
      { width: contentWidth - SPACING.md * 2 }
    );
  
  doc.y = titleY + titleHeight + SPACING.md;
}

// 🎯 NOUVELLE FONCTION : Inventaire par pièce
function addRoomInventorySection(
  doc: typeof PDFDocument,
  room: any,
  allItems: any[]
): { totalVolume: number; totalCartons: number } {
  const { margins, contentWidth } = PDF_CONFIG;
  const startY = doc.y;
  
  // Carrousel de photos de la pièce
  const photoWidth = contentWidth;
  const photoHeight = 200;
  
  // Titre de la pièce avec nombre de photos
  doc
    .fontSize(FONTS.sizes.h3)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(`${room.name} (${room.photos.length} photo${room.photos.length > 1 ? 's' : ''})`, margins.left, startY);
  
  doc.moveDown(0.5);
  const photosY = doc.y;
  
  // Afficher les photos côte à côte (2 par ligne max)
  let currentY = photosY;
  console.log(`🔍 Room ${room.name}: ${room.photos.length} photos`);
  if (room.photos.length > 0) {
    const photosPerRow = 2;
    const photoSpacing = 10;
    const photoWidth = (contentWidth - photoSpacing) / photosPerRow;
    const photoHeight = 150; // Plus petit pour gagner de l'espace
    
    // Grouper les photos par rangées
    for (let i = 0; i < room.photos.length; i += photosPerRow) {
      const rowPhotos = room.photos.slice(i, i + photosPerRow);
      
      // Vérifier si on a besoin d'une nouvelle page
      if (currentY > PDF_CONFIG.pageHeight - photoHeight - 100) {
        doc.addPage();
        currentY = doc.y;
      }
      
      // Afficher les photos de la rangée
      rowPhotos.forEach((photo: any, colIndex: number) => {
        const photoX = margins.left + colIndex * (photoWidth + photoSpacing);
        const photoIndex = i + colIndex;
        
        console.log(`  📸 Photo ${photoIndex + 1}:`, {
          hasPhotoData: !!photo.photoData,
          photoDataType: typeof photo.photoData,
          photoDataStart: photo.photoData?.substring(0, 20),
          itemsCount: photo.items?.length || 0
        });
        
        if (photo.photoData && typeof photo.photoData === 'string' && photo.photoData.startsWith('data:image')) {
          try {
            // Cadre pour la photo
            doc
              .roundedRect(photoX, currentY, photoWidth, photoHeight, 4)
              .strokeColor(COLORS.border)
              .lineWidth(1.5)
              .stroke();
            
            // Photo en base64
            const base64Data = photo.photoData.includes(',') 
              ? photo.photoData.split(',')[1] 
              : photo.photoData;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            doc.image(imageBuffer, photoX + 3, currentY + 3, {
              width: photoWidth - 6,
              height: photoHeight - 6,
              fit: [photoWidth - 6, photoHeight - 6],
              align: 'center',
              valign: 'center',
            });
            
            // Numéro de photo si plusieurs
            if (room.photos.length > 1) {
              doc
                .fontSize(9)
                .fillColor(COLORS.text)
                .font('Helvetica')
                .text(`${photoIndex + 1}/${room.photos.length}`, photoX + photoWidth - 40, currentY + photoHeight - 15);
            }
          } catch (error) {
            console.error('Erreur lors de l\'ajout de la photo:', error);
            addPhotoPlaceholder(doc, photoX, currentY, photoWidth, photoHeight);
          }
        } else {
          addPhotoPlaceholder(doc, photoX, currentY, photoWidth, photoHeight);
        }
      });
      
      currentY += photoHeight + photoSpacing;
    }
  }
  
  doc.y = currentY + SPACING.md;
  
  // Liste des objets de la pièce (regroupés)
  const stats = addItemsList(doc, allItems, margins.left, contentWidth);
  
  // Afficher le total de la pièce
  addRoomTotal(doc, stats.totalVolume, stats.totalCartons);
  
  doc.moveDown(1);
  
  return stats;
}

function addPhotoSection(
  doc: typeof PDFDocument,
  photo: any,
  photoNumber: number,
  roomName: string
): { totalVolume: number; totalCartons: number } {
  const { margins, contentWidth } = PDF_CONFIG;
  const startY = doc.y;
  
  // Photo en pleine largeur
  const photoWidth = contentWidth;
  const photoHeight = 280; // Plus grande pour mieux voir
  
  // Titre photo
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(`Photo ${photoNumber}`, margins.left, startY);
  
  doc.moveDown(0.3);
  const photoY = doc.y;
  
  // Ajouter la photo si disponible
  if (photo.photoData && typeof photo.photoData === 'string' && photo.photoData.startsWith('data:image')) {
    try {
      // Cadre pour la photo
      doc
        .roundedRect(margins.left, photoY, photoWidth, photoHeight, 4)
        .strokeColor(COLORS.border)
        .lineWidth(1.5)
        .stroke();
      
      // Photo en base64
      const base64Data = photo.photoData.includes(',') 
        ? photo.photoData.split(',')[1] 
        : photo.photoData;
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      doc.image(imageBuffer, margins.left + 3, photoY + 3, {
        width: photoWidth - 6,
        height: photoHeight - 6,
        fit: [photoWidth - 6, photoHeight - 6],
        align: 'center',
        valign: 'center',
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la photo:', error);
      addPhotoPlaceholder(doc, margins.left, photoY, photoWidth, photoHeight);
    }
  } else {
    addPhotoPlaceholder(doc, margins.left, photoY, photoWidth, photoHeight);
  }
  
  doc.y = photoY + photoHeight + SPACING.md;
  
  // Liste des objets en dessous de la photo
  const stats = addItemsList(doc, photo.items, margins.left, contentWidth);
  
  // Afficher le total de la photo
  addPhotoTotal(doc, stats.totalVolume, stats.totalCartons);
  
  doc.moveDown(1);
  
  return stats;
}

function addPhotoPlaceholder(
  doc: typeof PDFDocument,
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
    .text('[Photo non disponible]', x, y + height / 2 - 10, {
      width: width,
      align: 'center',
    });
}

function addItemsList(
  doc: typeof PDFDocument,
  items: PDFInventoryItem[],
  x: number,
  width: number
): { totalVolume: number; totalCartons: number } {
  let totalVolume = 0;
  let totalCartons = 0;
  
  // Séparer petits objets (cartons) et gros meubles
  const CARTON_THRESHOLD = 0.06; // 0.06m³ = carton standard 50x40x30cm
  const smallItems: PDFInventoryItem[] = [];
  const largeItems: PDFInventoryItem[] = [];
  
  items.forEach(item => {
    const itemVolume = item.volume_m3 * (item.quantity || 1);
    totalVolume += itemVolume;
    
    // Petits objets qui vont dans des cartons
    if (item.volume_m3 <= CARTON_THRESHOLD) {
      smallItems.push(item);
      totalCartons += Math.ceil(itemVolume / CARTON_THRESHOLD);
    } else {
      largeItems.push(item);
    }
  });
  
  // Afficher d'abord les gros meubles individuellement (une ligne par article)
  largeItems.forEach((item) => {
    if (doc.y > PDF_CONFIG.pageHeight - 50) {
      doc.addPage();
      doc.y = PDF_CONFIG.margins.top;
    }
    
    const itemY = doc.y;
    
    // Cercle bleu
    const circleRadius = 3;
    doc
      .circle(x + circleRadius, itemY + 4, circleRadius)
      .fillColor(COLORS.primary)
      .fill();
    
    // Construire la ligne complète de l'article
    const itemName = item.quantity > 1 
      ? `${item.quantity}x ${item.label}` 
      : item.label;
    
    // Détails compacts
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
      details.push('FRAGILE');
    }
    
    if (item.dismountable) {
      details.push('DÉMONTABLE');
    }
    
    // Note courte si disponible
    const note = item.notes ? ` • ${item.notes}` : '';
    
    // Tout sur une seule ligne
    const fullLine = `${itemName} • ${details.join(' • ')}${note}`;
    
    doc
      .fontSize(FONTS.sizes.small)
      .fillColor(COLORS.text.dark)
      .font('Helvetica')
      .text(fullLine, x + 12, itemY, { width: width - 12 });
    
    doc.moveDown(0.3);
  });
  
  // Afficher le résumé des petits objets en cartons (une ligne compacte)
  if (smallItems.length > 0) {
    if (doc.y > PDF_CONFIG.pageHeight - 30) {
      doc.addPage();
      doc.y = PDF_CONFIG.margins.top;
    }
    
    const itemY = doc.y;
    
    // Cercle bleu
    const circleRadius = 3;
    doc
      .circle(x + circleRadius, itemY + 4, circleRadius)
      .fillColor(COLORS.secondary)
      .fill();
    
    // Résumé des petits objets
    const smallItemsVolume = smallItems.reduce((sum, item) => sum + (item.volume_m3 * (item.quantity || 1)), 0);
    const cartonsCount = Math.ceil(smallItemsVolume / CARTON_THRESHOLD);
    
    // Tout sur une seule ligne
    const summaryLine = `Petits objets (${smallItems.length} articles) • ${cartonsCount} carton${cartonsCount > 1 ? 's' : ''} standard${cartonsCount > 1 ? 's' : ''} (50×40×30cm) • ${smallItemsVolume.toFixed(2)}m³`;
    
    doc
      .fontSize(FONTS.sizes.small)
      .fillColor(COLORS.text.dark)
      .font('Helvetica')
      .text(summaryLine, x + 12, itemY, { width: width - 12 });
    
    doc.moveDown(0.3);
  }
  
  return { totalVolume, totalCartons };
}

// Fonction pour afficher le total d'une photo
function addPhotoTotal(doc: typeof PDFDocument, totalVolume: number, totalCartons: number): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Encadré subtil pour le total
  const boxY = doc.y;
  const boxHeight = 28;
  
  doc
    .roundedRect(margins.left, boxY, contentWidth, boxHeight, 4)
    .fillColor(COLORS.background.medium)
    .fill();
  
  doc.y = boxY + 8;
  
  // Total sur une ligne
  const text = `Total photo: ${totalVolume.toFixed(2)}m³ emballés${totalCartons > 0 ? ` • Dont ${totalCartons} carton${totalCartons > 1 ? 's' : ''}` : ''}`;
  
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.dark)
    .font('Helvetica-Bold')
    .text(text, margins.left + SPACING.md, doc.y, { 
      width: contentWidth - SPACING.md * 2,
      align: 'right'
    });
  
  doc.y = boxY + boxHeight + SPACING.sm;
}

// Fonction pour afficher le total d'une pièce
function addRoomTotal(doc: typeof PDFDocument, totalVolume: number, totalCartons: number): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  doc.moveDown(0.5);
  
  // Encadré bleu pour le total de pièce
  const boxY = doc.y;
  const boxHeight = 40;
  
  doc
    .roundedRect(margins.left, boxY, contentWidth, boxHeight, 6)
    .fillColor(COLORS.primary)
    .fillOpacity(0.1)
    .fill();
  
  doc
    .roundedRect(margins.left, boxY, contentWidth, boxHeight, 6)
    .strokeColor(COLORS.primary)
    .lineWidth(2)
    .fillOpacity(1)
    .stroke();
  
  doc.y = boxY + 12;
  
  // Total en gros
  doc
    .fontSize(FONTS.sizes.h3)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(`TOTAL PIÈCE: ${totalVolume.toFixed(2)}m³`, margins.left + SPACING.md, doc.y);
  
  // Nombre de cartons en dessous
  if (totalCartons > 0) {
    doc.moveDown(0.3);
    doc
      .fontSize(FONTS.sizes.body)
      .fillColor(COLORS.text.dark)
      .font('Helvetica')
      .text(`Dont ${totalCartons} carton${totalCartons > 1 ? 's' : ''} standard${totalCartons > 1 ? 's' : ''} (50×40×30cm)`, margins.left + SPACING.md, doc.y);
  }
  
  doc.y = boxY + boxHeight + SPACING.md;
}

