// Générateur PDF principal
import PDFDocument from 'pdfkit';
import { 
  PDFGenerationData, 
  PDFSummary, 
  PDFRoomData, 
  PDFInventoryItem 
} from './types';
import { addHeader } from './sections/header';
import { addGeneralInfo } from './sections/generalInfo';
import { addSummary } from './sections/summary';
import { addInventoryDetails } from './sections/inventory';

/**
 * Génère un PDF de devis de déménagement
 * @param data Données du formulaire et de l'inventaire
 * @returns Buffer du PDF généré
 */
export async function generateMovingQuotePDF(
  data: PDFGenerationData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Créer le document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
        info: {
          Title: `Devis Déménagement - ${data.referenceNumber}`,
          Author: 'Moverz',
          Subject: 'Devis de déménagement',
          Creator: 'Moverz PDF Generator',
          CreationDate: new Date(),
        },
      });

      // Buffer pour collecter le PDF
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Calculer le résumé
      const summary = calculateSummary(data.rooms);

      // Ajouter les sections
      addHeader(doc, data.referenceNumber, data.generatedDate);
      addGeneralInfo(doc, data.formData);
      addSummary(doc, summary);
      addInventoryDetails(doc, data.rooms);

      // Finaliser le document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calcule le résumé de l'inventaire
 */
function calculateSummary(rooms: PDFRoomData[]): PDFSummary {
  let totalItems = 0;
  let totalVolume = 0;
  let hasFragileItems = false;
  let hasDismountableItems = false;

  rooms.forEach((room) => {
    room.photos.forEach((photo) => {
      if (photo.items) {
        photo.items.forEach((item: PDFInventoryItem) => {
          totalItems += item.quantity || 1;
          totalVolume += item.volume_m3 * (item.quantity || 1);
          
          if (item.fragile) {
            hasFragileItems = true;
          }
          
          if (item.dismountable) {
            hasDismountableItems = true;
          }
        });
      }
    });
  });

  return {
    totalItems,
    totalVolume: Math.round(totalVolume * 10) / 10, // Arrondi à 1 décimale
    roomCount: rooms.length,
    hasFragileItems,
    hasDismountableItems,
  };
}

/**
 * Génère un numéro de référence unique
 */
export function generateReferenceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `DEV-${year}${month}${day}-${random}`;
}

/**
 * Formate une date pour l'affichage
 */
export function formatGeneratedDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

