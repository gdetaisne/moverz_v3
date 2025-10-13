-- Migration: Ajouter table AnalyticsEvent pour le tracking utilisateur
-- Date: 2025-01-12
-- À exécuter sur la base PostgreSQL de production

-- Créer la table
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- Vérifier la création
SELECT 
    'Table AnalyticsEvent créée avec succès' as message,
    count(*) as initial_count 
FROM "AnalyticsEvent";

