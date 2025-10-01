// Styles et constants pour la génération PDF

export const PDF_CONFIG = {
  // Marges
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  },
  
  // Largeur utilisable
  pageWidth: 595.28, // A4 width in points
  pageHeight: 841.89, // A4 height in points
  
  get contentWidth() {
    return this.pageWidth - this.margins.left - this.margins.right;
  },
};

export const COLORS = {
  primary: '#2563eb',      // Blue 600
  secondary: '#64748b',    // Slate 500
  success: '#10b981',      // Green 500
  danger: '#ef4444',       // Red 500
  warning: '#f59e0b',      // Amber 500
  
  text: {
    dark: '#1e293b',       // Slate 800
    medium: '#475569',     // Slate 600
    light: '#94a3b8',      // Slate 400
  },
  
  background: {
    light: '#f8fafc',      // Slate 50
    medium: '#e2e8f0',     // Slate 200
  },
  
  border: '#cbd5e1',       // Slate 300
};

export const FONTS = {
  sizes: {
    h1: 24,
    h2: 18,
    h3: 14,
    body: 11,
    small: 9,
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

