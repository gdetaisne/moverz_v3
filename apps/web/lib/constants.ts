// 🎨 Design constants
export const COLORS = {
  text: '#1E293B',
  accent: '#3B82F6',
  background: '#F8FAFC',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
} as const;

// 📝 Workflow steps
export const STEPS = [
  { id: 'upload', label: 'Upload', path: '/upload' },
  { id: 'inventory', label: 'Inventaire', path: '/inventory' },
  { id: 'estimate', label: 'Estimation', path: '/estimate' },
  { id: 'quote', label: 'Devis', path: '/quote' },
] as const;

// 🔑 Auth
export const AUTH_TOKEN_KEY = 'NEXT_PUBLIC_ADMIN_BYPASS_TOKEN';

// 🔗 API endpoints
export const API_ENDPOINTS = {
  PHOTOS_ENQUEUE: '/photos/enqueue',
  PHOTOS_STATUS: '/photos/:id',
  BATCHES: '/batches',
  BATCH_DETAIL: '/batches/:id',
  AI_STATUS: '/ai-status',
  INVENTORY: '/inventory',
  ESTIMATE: '/estimate',
} as const;



