'use client';

/**
 * LOT 15 - Export Button Component
 * 
 * Bouton pour exporter un batch au format CSV ou PDF
 * Déclenche le téléchargement automatique du fichier
 */

import { useState } from 'react';

export interface ExportButtonProps {
  batchId: string;
  format: 'csv' | 'pdf';
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function ExportButton({
  batchId,
  format,
  label,
  className = '',
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Appeler l'API d'export
      const response = await fetch(
        `/api/batches/${batchId}/export?format=${format}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || `Export failed: ${response.status}`
        );
      }

      // Récupérer le blob
      const blob = await response.blob();
      
      // Extraire le filename depuis Content-Disposition ou générer un défaut
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `batch-${batchId}-${format}-${Date.now()}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Créer un lien de téléchargement temporaire
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Export ${format.toUpperCase()} téléchargé: ${filename}`);
    } catch (err: any) {
      console.error('❌ Erreur export:', err);
      setError(err.message || 'Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const defaultLabel = format === 'csv' ? '📊 Export CSV' : '📄 Export PDF';
  const buttonLabel = label || defaultLabel;

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className={`
          px-4 py-2 rounded-md font-medium transition-colors
          ${
            disabled || isExporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }
          ${className}
        `}
      >
        {isExporting ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Export en cours...
          </span>
        ) : (
          buttonLabel
        )}
      </button>
      
      {error && (
        <span className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * Composant avec les deux boutons CSV et PDF
 */
export function ExportButtons({
  batchId,
  className = '',
}: {
  batchId: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex gap-2 ${className}`}>
      <ExportButton batchId={batchId} format="csv" />
      <ExportButton batchId={batchId} format="pdf" />
    </div>
  );
}


