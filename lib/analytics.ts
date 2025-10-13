/**
 * 📊 Module Analytics Centralisé
 * 
 * Usage simple :
 * - Frontend : track('event_name', { metadata })
 * - Backend : trackServer('event_name', userId, { metadata })
 */

import { prisma } from '@core/db';
import { userSession } from '@core/auth-client';

// Types d'événements trackés
export type AnalyticsEventType =
  // Étape 1 : Upload Photos
  | 'app_opened'
  | 'photo_upload_started'
  | 'photo_uploaded'
  | 'photo_upload_failed'
  | 'room_detection_completed'
  
  // Étape 2 : Validation Pièces
  | 'step_reached'
  | 'room_groups_loaded'
  | 'photo_moved_to_room'
  | 'room_validation_completed'
  
  // Étape 3 : Inventaire
  | 'inventory_analysis_started'
  | 'inventory_analysis_completed'
  | 'item_quantity_changed'
  | 'inventory_validated'
  
  // Étape 4 : Formulaire
  | 'quote_form_started'
  | 'quote_offer_selected'
  | 'quote_form_completed'
  
  // Étape 5 : Envoi
  | 'pdf_generation_requested'
  | 'quote_submitted';

export interface AnalyticsMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * 🎯 FRONTEND : Track un événement côté client
 * S'appuie sur PostHog + backup DB via API
 */
export function track(
  eventType: AnalyticsEventType,
  metadata?: AnalyticsMetadata
): void {
  try {
    // 1. PostHog (si disponible)
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(eventType, metadata);
    }

    // 2. Backup DB via API (fire & forget)
    if (typeof window !== 'undefined') {
      // Utiliser le même système d'auth que l'app (cookies)
      const userId = userSession.getCurrentUserId();
      if (userId) {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, eventType, metadata }),
        }).catch(() => {}); // Silencieux si échec
      }
    }
  } catch (error) {
    // Pas de console.error pour ne pas polluer
  }
}

/**
 * 🔧 BACKEND : Track un événement côté serveur
 * Écrit directement en DB
 */
export async function trackServer(
  eventType: AnalyticsEventType,
  userId: string,
  metadata?: AnalyticsMetadata
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    // Log mais ne pas throw (tracking ne doit jamais casser l'app)
    console.warn(`[Analytics] Échec track ${eventType}:`, error);
  }
}

/**
 * 📈 Helper : Mesurer la durée d'une opération
 */
export function trackDuration(eventType: AnalyticsEventType) {
  const start = Date.now();
  return (metadata?: AnalyticsMetadata) => {
    const duration_ms = Date.now() - start;
    track(eventType, { ...metadata, duration_ms });
  };
}

/**
 * 🎯 Helper : Track une étape du workflow
 */
export function trackStep(step: number, metadata?: AnalyticsMetadata): void {
  track('step_reached', { step, ...metadata });
}


