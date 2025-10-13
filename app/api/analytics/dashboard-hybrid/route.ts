import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';

/**
 * GET /api/analytics/dashboard-hybrid
 * Dashboard hybride : données locales + production côte à côte
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

    // Récupérer les données de la base locale
    const localData = await getLocalEnvironmentData(startDate);
    
    // Pour l'instant, on simule les données production (même DB)
    const productionData = await getLocalEnvironmentData(startDate);

    // Calculer les métriques globales
    const globalMetrics = calculateGlobalMetrics(localData, productionData);

    return NextResponse.json({
      period,
      timestamp: now.toISOString(),
      environments: {
        local: {
          ...localData,
          name: 'Local (Dev)',
          icon: '🛠️',
          color: 'blue'
        },
        production: {
          ...productionData,
          name: 'Production (Simulé)',
          icon: '🚀',
          color: 'green'
        }
      },
      global: globalMetrics
    });

  } catch (error) {
    console.error('[Analytics Dashboard Hybrid] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * Récupérer les données de l'environnement local
 */
async function getLocalEnvironmentData(startDate: Date) {
  try {
    // 1. FUNNEL COMPLET
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
        isProblematic: parseFloat(dropOffRate) > 50
      };
    });

    // 2. MÉTRIQUES DE PERFORMANCE
    const performanceMetrics = {
      globalConversionRate: funnelData[0]?.uniqueUsers > 0 
        ? (funnelData[funnelData.length - 1]?.uniqueUsers / funnelData[0].uniqueUsers * 100).toFixed(1)
        : '0.0',
      avgSessionDuration: await calculateAvgSessionDuration(startDate),
      globalDropOffRate: funnelData[0]?.uniqueUsers > 0
        ? ((funnelData[0].uniqueUsers - funnelData[funnelData.length - 1]?.uniqueUsers) / funnelData[0].uniqueUsers * 100).toFixed(1)
        : '0.0',
      activeUsers: funnelData[0]?.uniqueUsers || 0,
      photosUploaded: await prisma.analyticsEvent.count({
        where: {
          eventType: 'photo_uploaded',
          createdAt: { gte: startDate }
        }
      }),
      quotesSubmitted: await prisma.analyticsEvent.count({
        where: {
          eventType: 'quote_submitted',
          createdAt: { gte: startDate }
        }
      })
    };

    // 3. MÉTRIQUES TECHNIQUES (simplifiées)
    const technicalMetrics = {
      ai: {
        avgLatencyMs: 1500,
        totalCalls: await prisma.analyticsEvent.count({
          where: {
            eventType: { contains: 'ai_' },
            createdAt: { gte: startDate }
          }
        }),
        totalCostUsd: '0.00',
        errorRate: '0.0'
      },
      errors: {
        totalErrors: await prisma.analyticsEvent.count({
          where: {
            eventType: { contains: 'error' },
            createdAt: { gte: startDate }
          }
        }),
        errorRate: '0.0'
      }
    };

    // 4. ÉVÉNEMENTS RÉCENTS
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

    // 5. POINTS DE FRICTION
    const frictionPoints = funnelWithRatios
      .filter(step => step.isProblematic)
      .map(step => ({
        step: step.name,
        dropOffRate: step.dropOffRate,
        severity: step.dropOffRate > 70 ? 'critical' : step.dropOffRate > 50 ? 'high' : 'medium',
        impact: `${step.dropOffRate}% d'abandon`
      }));

    return {
      status: 'connected',
      funnel: funnelWithRatios,
      performance: performanceMetrics,
      technical: technicalMetrics,
      events: recentEvents.map(e => ({
        type: e.eventType,
        count: e._count.eventType
      })),
      frictionPoints,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Local Environment] Error:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Calculer la durée moyenne des sessions
 */
async function calculateAvgSessionDuration(startDate: Date): Promise<number> {
  try {
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
  } catch (error) {
    console.error('[Session Duration] Error:', error);
    return 0;
  }
}

/**
 * Calculer les métriques globales
 */
function calculateGlobalMetrics(localData: any, productionData: any) {
  if (localData.status !== 'connected' || productionData.status !== 'connected') {
    return {
      status: 'partial',
      message: 'Données incomplètes - un ou plusieurs environnements non disponibles'
    };
  }

  return {
    status: 'complete',
    totalActiveUsers: localData.performance.activeUsers + productionData.performance.activeUsers,
    totalPhotosUploaded: localData.performance.photosUploaded + productionData.performance.photosUploaded,
    totalQuotesSubmitted: localData.performance.quotesSubmitted + productionData.performance.quotesSubmitted,
    avgConversionRate: (
      parseFloat(localData.performance.globalConversionRate) + 
      parseFloat(productionData.performance.globalConversionRate)
    ) / 2,
    combinedAICost: (
      parseFloat(localData.technical.ai.totalCostUsd) + 
      parseFloat(productionData.technical.ai.totalCostUsd)
    ).toFixed(2)
  };
}