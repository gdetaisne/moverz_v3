/**
 * LOT 15 - Export Batch CSV
 * 
 * Génère un fichier CSV contenant les données d'un batch :
 * - Informations batch (id, status, progress)
 * - Liste des photos avec statut et analyse
 * - Résumé inventaire par pièce
 */

import { BatchProgress } from '../batch/batchService';

/**
 * Échapper les valeurs CSV (gestion des guillemets, virgules, retours ligne)
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // Si contient virgule, guillemet ou retour ligne → entourer de guillemets
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Générer CSV des photos d'un batch
 */
function generatePhotosCSV(progress: BatchProgress): string {
  const headers = [
    'Photo ID',
    'Filename',
    'Status',
    'Room Type',
    'Items Count',
    'Volume (m³)',
    'Error Code',
    'Error Message',
  ];
  
  const rows: string[][] = progress.photos.map((photo) => {
    // Extraire items count et volume de l'analyse si disponible
    let itemsCount = 0;
    let volume = 0;
    
    // Note: photo.analysis n'est pas dans le type BatchProgress.photos
    // On utilise les données agrégées du inventorySummary si disponible
    
    return [
      photo.id,
      photo.filename,
      photo.status,
      photo.roomType || 'unknown',
      itemsCount.toString(),
      volume.toFixed(3),
      photo.errorCode || '',
      photo.errorMessage || '',
    ];
  });
  
  // Construire le CSV
  const lines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ];
  
  return lines.join('\n');
}

/**
 * Générer CSV du résumé inventaire d'un batch
 */
function generateInventoryCSV(progress: BatchProgress): string {
  if (!progress.inventorySummary) {
    return 'No inventory summary available\n';
  }
  
  const headers = [
    'Room Type',
    'Items Count',
    'Volume (m³)',
  ];
  
  const rows = progress.inventorySummary.rooms.map((room) => [
    room.roomType,
    room.itemsCount.toString(),
    room.volume_m3.toFixed(3),
  ]);
  
  // Ajouter ligne totale
  rows.push([
    'TOTAL',
    progress.inventorySummary.totalItems.toString(),
    progress.inventorySummary.totalVolume.toFixed(3),
  ]);
  
  const lines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ];
  
  return lines.join('\n');
}

/**
 * Exporter un batch au format CSV complet
 */
export function exportBatchToCSV(progress: BatchProgress): string {
  const sections: string[] = [];
  
  // Section 1: Informations batch
  sections.push('=== BATCH INFORMATION ===');
  sections.push(`Batch ID,${escapeCSV(progress.batchId)}`);
  sections.push(`Status,${escapeCSV(progress.status)}`);
  sections.push(`Progress,${progress.progress}%`);
  sections.push(`Total Photos,${progress.counts.total}`);
  sections.push(`Queued,${progress.counts.queued}`);
  sections.push(`Processing,${progress.counts.processing}`);
  sections.push(`Completed,${progress.counts.completed}`);
  sections.push(`Failed,${progress.counts.failed}`);
  sections.push('');
  
  // Section 2: Photos
  sections.push('=== PHOTOS ===');
  sections.push(generatePhotosCSV(progress));
  sections.push('');
  
  // Section 3: Inventory Summary (si disponible)
  if (progress.inventorySummary) {
    sections.push('=== INVENTORY SUMMARY ===');
    sections.push(generateInventoryCSV(progress));
  }
  
  return sections.join('\n');
}

/**
 * Obtenir le nom de fichier CSV pour un batch
 */
export function getCSVFilename(batchId: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `batch-${batchId}-${timestamp}.csv`;
}



