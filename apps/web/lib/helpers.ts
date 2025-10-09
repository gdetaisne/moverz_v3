/**
 * 🛠️ Utility helpers
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatVolume(m3: number): string {
  return `${m3.toFixed(2)} m³`;
}

export function formatPrice(euros: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return process.env.NEXT_PUBLIC_ADMIN_BYPASS_TOKEN || null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}



