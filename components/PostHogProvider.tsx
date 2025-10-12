"use client";

import { useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * 📊 PostHog Analytics Provider
 * Ultra simple : initialise PostHog au chargement de l'app
 */
export default function PostHogProvider() {
  useEffect(() => {
    // Initialiser PostHog (gratuit jusqu'à 1M events/mois)
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (apiKey && typeof window !== 'undefined') {
      posthog.init(apiKey, {
        api_host: host,
        capture_pageviews: true, // Auto-track pages
        capture_pageleaves: true, // Track quand l'user quitte
        autocapture: false, // Désactivé : on track manuellement
      });

      // Identifier l'user si déjà connecté
      const userId = localStorage.getItem('moverz_user_id');
      if (userId) {
        posthog.identify(userId);
      }

      console.log('📊 PostHog initialisé');
    }
  }, []);

  return null; // Pas de UI
}

