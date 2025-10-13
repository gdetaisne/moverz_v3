import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';

/**
 * GET /api/analytics/dashboard-v2
 * Dashboard PM avec funnel complet et points de friction
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '7d';
    
    // Calculer les dates selon la période
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 1. FUNNEL COMPLET AVEC RATIOS
    const funnelSteps = [
      { id: 1, name: 'App Ouverte', event: 'app_opened' },
      { id: 2, name: 'Photo Uploadée', event: 'photo_uploaded' },
      { id: 3, name: 'Pièces Classifiées', event: 'room_classified' },
      { id: 4, name: 'Pièces Validées', event: 'room_validated' },
      { id: 5, name: 'Inventaire Analysé', event: 'inventory_analyzed' },
      { id: 6, name: 'Inventaire Validé', event: 'inventory_validated' },
      { id: 7, name: 'Formulaire Complété', event: 'quote_form_completed' },
      { id: 8, name: 'Devis Envoyé', event: 'quote_submitted' }
    ];

    const funnelData = await Promise.all(
      funnelSteps.map(async (step) => {
        const events = await prisma.analyticsEvent.findMany({
          where: {
            eventType: step.event,
            createdAt: { gte: startDate }
          },
          select: {
            userId: true,
            createdAt: true,
            metadata: true
          }
        });

        const uniqueUsers = new Set(events.map(e => e.userId)).size;
        const totalEvents = events.length;
        
        return {
          ...step,
          uniqueUsers,
          totalEvents,
          avgTimePerUser: events.length > 0 ? events.length / uniqueUsers : 0
        };
      })
    );

    // Calculer les ratios de conversion
    const funnelWithRatios = funnelData.map((step, index) => {
      const previousStep = index > 0 ? funnelData[index - 1] : null;
      const conversionRate = previousStep && previousStep.uniqueUsers > 0 
        ? (step.uniqueUsers / previousStep.uniqueUsers * 100).toFixed(1)
        : '100.0';
      
      const dropOffRate = previousStep && previousStep.uniqueUsers > 0
        ? ((previousStep.uniqueUsers - step.uniqueUsers) / previousStep.uniqueUsers * 100).toFixed(1)
        : '0.0';

      return {
        ...step,
        conversionRate: parseFloat(conversionRate),
        dropOffRate: parseFloat(dropOffRate),
        isProblematic: parseFloat(dropOffRate) > 50 // Seuil d'alerte
      };
    });

    // 2. POINTS DE FRICTION DÉTECTÉS
    const frictionPoints = funnelWithRatios
      .filter(step => step.isProblematic)
      .map(step => ({
        step: step.name,
        dropOffRate: step.dropOffRate,
        severity: step.dropOffRate > 70 ? 'critical' : step.dropOffRate > 50 ? 'high' : 'medium',
        impact: `${step.dropOffRate}% d'abandon`
      }));

    // 3. MÉTRIQUES DE PERFORMANCE
    const performanceMetrics = {
      // Conversion globale
      globalConversionRate: funnelData[0]?.uniqueUsers > 0 
        ? (funnelData[funnelData.length - 1]?.uniqueUsers / funnelData[0].uniqueUsers * 100).toFixed(1)
        : '0.0',

      // Temps moyen de session
      avgSessionDuration: await calculateAvgSessionDuration(startDate),

      // Taux d'abandon global
      globalDropOffRate: funnelData[0]?.uniqueUsers > 0
        ? ((funnelData[0].uniqueUsers - funnelData[funnelData.length - 1]?.uniqueUsers) / funnelData[0].uniqueUsers * 100).toFixed(1)
        : '0.0',

      // Utilisateurs actifs
      activeUsers: funnelData[0]?.uniqueUsers || 0,

      // Photos uploadées
      photosUploaded: await prisma.analyticsEvent.count({
        where: {
          eventType: 'photo_uploaded',
          createdAt: { gte: startDate }
        }
      }),

      // Devis envoyés
      quotesSubmitted: await prisma.analyticsEvent.count({
        where: {
          eventType: 'quote_submitted',
          createdAt: { gte: startDate }
        }
      })
    };

    // 4. MÉTRIQUES TECHNIQUES
    const technicalMetrics = await getTechnicalMetrics(startDate);

    // 5. ÉVÉNEMENTS RÉCENTS (TOP 10)
    const recentEvents = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true,
      orderBy: {
        _count: { eventType: 'desc' }
      },
      take: 10
    });

    // 6. ALERTES AUTOMATIQUES
    const alerts = generateAlerts(funnelWithRatios, performanceMetrics, technicalMetrics);

    return NextResponse.json({
      period,
      timestamp: now.toISOString(),
      funnel: funnelWithRatios,
      frictionPoints,
      performance: performanceMetrics,
      technical: technicalMetrics,
      events: recentEvents.map(e => ({
        type: e.eventType,
        count: e._count.eventType
      })),
      alerts
    });

  } catch (error) {
    console.error('[Analytics Dashboard V2] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * Calculer la durée moyenne des sessions
 */
async function calculateAvgSessionDuration(startDate: Date): Promise<number> {
  const sessions = await prisma.analyticsEvent.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: startDate }
    },
    _min: { createdAt: true },
    _max: { createdAt: true }
  });

  if (sessions.length === 0) return 0;

  const totalDuration = sessions.reduce((sum, session) => {
    if (session._min.createdAt && session._max.createdAt) {
      return sum + (session._max.createdAt.getTime() - session._min.createdAt.getTime());
    }
    return sum;
  }, 0);

  return Math.round(totalDuration / sessions.length / 1000 / 60); // en minutes
}

/**
 * Récupérer les métriques techniques
 */
async function getTechnicalMetrics(startDate: Date) {
  // Métriques IA
  const aiMetrics = await prisma.aiMetric.aggregate({
    where: { ts: { gte: startDate } },
    _avg: { latencyMs: true, costUsd: true },
    _sum: { costUsd: true },
    _count: true
  });

  const aiErrors = await prisma.aiMetric.count({
    where: {
      ts: { gte: startDate },
      success: false
    }
  });

  // Métriques d'erreurs
  const errorEvents = await prisma.analyticsEvent.count({
    where: {
      createdAt: { gte: startDate },
      eventType: { contains: 'error' }
    }
  });

  return {
    ai: {
      avgLatencyMs: Math.round(aiMetrics._avg.latencyMs || 0),
      totalCalls: aiMetrics._count,
      totalCostUsd: (aiMetrics._sum.costUsd || 0).toFixed(2),
      errorRate: aiMetrics._count > 0 ? ((aiErrors / aiMetrics._count) * 100).toFixed(1) : '0.0'
    },
    errors: {
      totalErrors: errorEvents,
      errorRate: errorEvents > 0 ? '0.1' : '0.0' // Simplifié pour l'instant
    }
  };
}

/**
 * Générer les alertes automatiques
 */
function generateAlerts(funnel: any[], performance: any, technical: any): any[] {
  const alerts = [];

  // Alerte sur les points de friction critiques
  const criticalFriction = funnel.filter(step => step.dropOffRate > 70);
  if (criticalFriction.length > 0) {
    alerts.push({
      type: 'critical',
      title: 'Points de friction critiques détectés',
      message: `${criticalFriction.length} étape(s) avec >70% d'abandon`,
      steps: criticalFriction.map(f => f.name)
    });
  }

  // Alerte sur la conversion globale
  if (parseFloat(performance.globalConversionRate) < 10) {
    alerts.push({
      type: 'warning',
      title: 'Conversion globale faible',
      message: `Taux de conversion: ${performance.globalConversionRate}% (seuil: 10%)`
    });
  }

  // Alerte sur les performances IA
  if (parseFloat(technical.ai.errorRate) > 5) {
    alerts.push({
      type: 'warning',
      title: 'Taux d\'erreur IA élevé',
      message: `Erreurs IA: ${technical.ai.errorRate}% (seuil: 5%)`
    });
  }

  return alerts;
}
