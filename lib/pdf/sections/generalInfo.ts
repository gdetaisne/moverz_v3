// Section informations générales du PDF
import PDFDocument from 'pdfkit';
import type { PDFDocument as PDFDocumentType } from 'pdfkit';
import { COLORS, FONTS, SPACING, PDF_CONFIG } from '../styles';
import { PDFFormData } from '../types';

export function addGeneralInfo(doc: PDFDocumentType, formData: PDFFormData): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Titre de section moderne
  addSectionTitle(doc, 'INFORMATIONS GÉNÉRALES');
  
  const boxY = doc.y;
  const boxPadding = 12;
  const colWidth = (contentWidth - boxPadding * 3) / 2;
  
  // Encadré compact avec fond bleu clair
  doc
    .roundedRect(margins.left, boxY, contentWidth, 110, 8)
    .fillColor(COLORS.background.accent)
    .fill();
  
  doc
    .roundedRect(margins.left, boxY, contentWidth, 110, 8)
    .strokeColor(COLORS.primary)
    .lineWidth(1.5)
    .stroke();
  
  // Layout en 2 colonnes
  const col1X = margins.left + boxPadding;
  const col2X = margins.left + boxPadding + colWidth + boxPadding;
  
  doc.y = boxY + boxPadding;
  
  // COLONNE 1 - Départ
  addSubSection(doc, 'ADRESSE DE DÉPART', col1X);
  const startY = doc.y;
  
  if (formData.departureCity && formData.departurePostalCode) {
    addInfoLineCompact(doc, 'Ville', `${formData.departureCity} (${formData.departurePostalCode})`, col1X, colWidth);
  }
  if (formData.departureFloor) {
    addInfoLineCompact(doc, 'Étage', formData.departureFloor, col1X, colWidth);
  }
  if (formData.departureArea) {
    addInfoLineCompact(doc, 'Superficie', formatArea(formData.departureArea), col1X, colWidth);
  }
  
  // Caractéristiques départ
  const departureFeatures = [];
  if (formData.departureElevator) departureFeatures.push('Ascenseur');
  if (formData.departureTruckAccess) departureFeatures.push('Accès camion');
  if (formData.departureMonteCharge) departureFeatures.push('Monte-charge');
  
  if (departureFeatures.length > 0) {
    addInfoLineCompact(doc, 'Équipements', departureFeatures.join(' • '), col1X, colWidth);
  }
  
  // COLONNE 2 - Arrivée
  doc.y = startY;
  addSubSection(doc, 'ADRESSE D\'ARRIVÉE', col2X);
  if (formData.arrivalCity && formData.arrivalPostalCode) {
    addInfoLineCompact(doc, 'Ville', `${formData.arrivalCity} (${formData.arrivalPostalCode})`, col2X, colWidth);
  }
  if (formData.arrivalFloor) {
    addInfoLineCompact(doc, 'Étage', formData.arrivalFloor, col2X, colWidth);
  }
  if (formData.arrivalArea) {
    addInfoLineCompact(doc, 'Superficie', formatArea(formData.arrivalArea), col2X, colWidth);
  }
  
  // Caractéristiques arrivée
  const arrivalFeatures = [];
  if (formData.arrivalElevator) arrivalFeatures.push('Ascenseur');
  if (formData.arrivalTruckAccess) arrivalFeatures.push('Accès camion');
  if (formData.arrivalMonteCharge) arrivalFeatures.push('Monte-charge');
  
  if (arrivalFeatures.length > 0) {
    addInfoLineCompact(doc, 'Équipements', arrivalFeatures.join(' • '), col2X, colWidth);
  }
  
  // Position après l'encadré
  doc.y = boxY + 115;
  
  // Détails du déménagement - encadré compact
  addSectionTitle(doc, 'DÉTAILS DU DÉMÉNAGEMENT');
  
  const box2Y = doc.y;
  doc
    .roundedRect(margins.left, box2Y, contentWidth, 50, 8)
    .fillColor(COLORS.background.accent)
    .fill();
  
  doc
    .roundedRect(margins.left, box2Y, contentWidth, 50, 8)
    .strokeColor(COLORS.primary)
    .lineWidth(1.5)
    .stroke();
  
  doc.y = box2Y + boxPadding;
  
  // Date et heure sur la même ligne
  if (formData.movingDate) {
    const dateText = `${formatDate(formData.movingDate)} à ${formData.movingTime || '09:00'}${formData.flexibleDate ? ' (dates flexibles ± 3j)' : ''}`;
    addInfoLineCompact(doc, 'Date souhaitée', dateText, col1X, contentWidth - boxPadding * 2);
  } else {
    addInfoLineCompact(doc, 'Date souhaitée', 'À définir', col1X, contentWidth - boxPadding * 2);
  }
  
  // Offre choisie
  if (formData.selectedOffer) {
    addInfoLineCompact(doc, 'Offre sélectionnée', formatOffer(formData.selectedOffer), col1X, contentWidth - boxPadding * 2);
  } else {
    addInfoLineCompact(doc, 'Offre sélectionnée', 'À définir', col1X, contentWidth - boxPadding * 2);
  }
  
  doc.y = box2Y + 55;
  doc.moveDown(0.5);
}

function addSectionTitle(doc: PDFDocument, title: string): void {
  doc
    .fontSize(FONTS.sizes.h2)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(title, PDF_CONFIG.margins.left, doc.y);
  
  doc.moveDown(0.5);
}

function addSubSection(doc: PDFDocument, title: string, x?: number): void {
  const xPos = x || PDF_CONFIG.margins.left;
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(title, xPos, doc.y);
  
  doc.moveDown(0.3);
}

function addInfoLineCompact(doc: PDFDocument, label: string, value: string, x: number, width: number): void {
  const labelWidth = 80;
  
  doc
    .fontSize(FONTS.sizes.small)
    .fillColor(COLORS.text.dark)
    .font('Helvetica-Bold')
    .text(label + ':', x, doc.y, { 
      width: labelWidth,
      continued: true 
    })
    .font('Helvetica')
    .fillColor(COLORS.text.medium)
    .text(' ' + value, { width: width - labelWidth });
  
  doc.moveDown(0.2);
}

function formatArea(area: string): string {
  const areaMap: { [key: string]: string } = {
    'studio': 'Studio (< 30m²)',
    't2': 'T2 (30-45m²)',
    't3': 'T3 (45-70m²)',
    't4': 'T4 (70-100m²)',
    't5': 'T5 (100-130m²)',
    't6': 'T6+ (> 130m²)',
    'maison': 'Maison individuelle',
    'autre': 'Autre',
  };
  return areaMap[area] || area;
}

function formatDate(dateString: string): string {
  if (!dateString) return 'À définir';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'À définir';
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return 'À définir';
  }
}

function formatOffer(offer: string): string {
  const offerMap: { [key: string]: string } = {
    'economique': 'ÉCONOMIQUE - Transport simple',
    'standard': 'STANDARD - Avec démontage et cartons',
    'premium': 'PREMIUM - Clé en main complet',
  };
  return offerMap[offer] || offer;
}

