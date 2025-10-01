// Section informations générales du PDF
import PDFDocument from 'pdfkit';
import { COLORS, FONTS, SPACING, PDF_CONFIG } from '../styles';
import { PDFFormData } from '../types';

export function addGeneralInfo(doc: PDFDocument, formData: PDFFormData): void {
  const { margins, contentWidth } = PDF_CONFIG;
  
  // Titre de section
  addSectionTitle(doc, '📍 INFORMATIONS GÉNÉRALES');
  
  // Cadre avec fond gris léger
  const startY = doc.y;
  
  // Adresse de départ
  addSubSection(doc, '🏠 Adresse de départ');
  addInfoLine(doc, 'Ville', `${formData.departureCity} (${formData.departurePostalCode})`);
  if (formData.departureFloor) {
    addInfoLine(doc, 'Étage', formData.departureFloor);
  }
  if (formData.departureArea) {
    addInfoLine(doc, 'Superficie', formatArea(formData.departureArea));
  }
  
  // Caractéristiques départ
  const departureFeatures = [];
  if (formData.departureElevator) departureFeatures.push('Ascenseur');
  if (formData.departureTruckAccess) departureFeatures.push('Accès camion');
  if (formData.departureMonteCharge) departureFeatures.push('Monte-charge requis');
  
  if (departureFeatures.length > 0) {
    addInfoLine(doc, 'Caractéristiques', departureFeatures.join(', '));
  }
  
  doc.moveDown(0.5);
  
  // Adresse d'arrivée
  addSubSection(doc, '🎯 Adresse d\'arrivée');
  addInfoLine(doc, 'Ville', `${formData.arrivalCity} (${formData.arrivalPostalCode})`);
  if (formData.arrivalFloor) {
    addInfoLine(doc, 'Étage', formData.arrivalFloor);
  }
  if (formData.arrivalArea) {
    addInfoLine(doc, 'Superficie', formatArea(formData.arrivalArea));
  }
  
  // Caractéristiques arrivée
  const arrivalFeatures = [];
  if (formData.arrivalElevator) arrivalFeatures.push('Ascenseur');
  if (formData.arrivalTruckAccess) arrivalFeatures.push('Accès camion');
  if (formData.arrivalMonteCharge) arrivalFeatures.push('Monte-charge requis');
  
  if (arrivalFeatures.length > 0) {
    addInfoLine(doc, 'Caractéristiques', arrivalFeatures.join(', '));
  }
  
  doc.moveDown(0.5);
  
  // Détails du déménagement
  addSubSection(doc, '📅 Détails du déménagement');
  addInfoLine(doc, 'Date souhaitée', formatDate(formData.movingDate));
  if (formData.movingTime) {
    addInfoLine(doc, 'Heure préférée', formData.movingTime);
  }
  if (formData.flexibleDate) {
    addInfoLine(doc, 'Flexibilité', 'Dates flexibles (± 3 jours)');
  }
  
  // Offre choisie
  addInfoLine(doc, 'Offre choisie', formatOffer(formData.selectedOffer));
  
  doc.moveDown(1.5);
}

function addSectionTitle(doc: PDFDocument, title: string): void {
  doc
    .fontSize(FONTS.sizes.h2)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(title, PDF_CONFIG.margins.left, doc.y);
  
  doc.moveDown(0.5);
}

function addSubSection(doc: PDFDocument, title: string): void {
  doc
    .fontSize(FONTS.sizes.h3)
    .fillColor(COLORS.text.dark)
    .font('Helvetica-Bold')
    .text(title, PDF_CONFIG.margins.left, doc.y);
  
  doc.moveDown(0.3);
}

function addInfoLine(doc: PDFDocument, label: string, value: string): void {
  const { margins, contentWidth } = PDF_CONFIG;
  const labelWidth = 120;
  
  doc
    .fontSize(FONTS.sizes.body)
    .fillColor(COLORS.text.medium)
    .font('Helvetica-Bold')
    .text(label + ':', margins.left + SPACING.md, doc.y, { 
      width: labelWidth,
      continued: true 
    })
    .font('Helvetica')
    .fillColor(COLORS.text.dark)
    .text(' ' + value, { width: contentWidth - labelWidth - SPACING.md });
  
  doc.moveDown(0.3);
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
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatOffer(offer: string): string {
  const offerMap: { [key: string]: string } = {
    'economique': '💼 Économique - Transport simple',
    'standard': '📦 Standard - Avec démontage et cartons',
    'premium': '⭐ Premium - Clé en main complet',
  };
  return offerMap[offer] || offer;
}

