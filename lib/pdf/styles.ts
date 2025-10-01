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
  primary: '#0066FF',      // Bleu professionnel éclatant
  primaryDark: '#0052CC',  // Bleu foncé pour contraste
  secondary: '#6366f1',    // Indigo moderne
  success: '#22c55e',      // Vert vif
  danger: '#ef4444',       // Rouge vif
  warning: '#f59e0b',      // Orange attention
  
  text: {
    dark: '#0f172a',       // Presque noir
    medium: '#475569',     // Gris moyen
    light: '#94a3b8',      // Gris clair
  },
  
  background: {
    light: '#f8fafc',      // Gris très clair
    medium: '#e0e7ff',     // Bleu très clair
    accent: '#eff6ff',     // Bleu ultra-clair
  },
  
  border: '#cbd5e1',       // Bordure standard
  accent: '#0066FF',       // Accent principal
};

export const FONTS = {
  sizes: {
    h1: 28,    // Plus grand pour impact
    h2: 16,    // Section headers
    h3: 13,    // Sous-sections
    body: 10,  // Texte normal
    small: 8,  // Petites notes
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

