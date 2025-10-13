import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';

/**
 * GET /api/analytics/dashboard
 * Dashboard simple avec les métriques essentielles
 */
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Utilisateurs actifs (7 derniers jours)
    const activeUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    // 2. Événements par type (7 derniers jours)
    const eventsByType = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
      orderBy: {
        _count: {
          eventType: 'desc',
        },
      },
    });

    // 3. Funnel de conversion (étapes)
    const stepEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'step_reached',
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        userId: true,
        metadata: true,
      },
    });

    // Calculer utilisateurs uniques par étape
    const stepFunnel = [1, 2, 3, 4, 5].map((step) => {
      const usersAtStep = new Set(
        stepEvents
          .filter((e: any) => e.metadata?.step === step)
          .map((e) => e.userId)
      );
      return { step, users: usersAtStep.size };
    });

    // 4. Photos uploadées (derniers 7j)
    const photosUploaded = await prisma.analyticsEvent.count({
      where: {
        eventType: 'photo_uploaded',
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // 5. Devis soumis (derniers 7j)
    const quotesSubmitted = await prisma.analyticsEvent.count({
      where: {
        eventType: 'quote_submitted',
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // 6. Performance IA (depuis AiMetric)
    const aiMetrics = await prisma.aiMetric.aggregate({
      where: {
        ts: { gte: sevenDaysAgo },
      },
      _avg: {
        latencyMs: true,
        costUsd: true,
      },
      _sum: {
        costUsd: true,
      },
      _count: true,
    });

    const aiErrorRate = await prisma.aiMetric.count({
      where: {
        ts: { gte: sevenDaysAgo },
        success: false,
      },
    });

    return NextResponse.json({
      period: '7_days',
      metrics: {
        activeUsers: activeUsers.length,
        photosUploaded,
        quotesSubmitted,
        conversionRate:
          stepFunnel[0]?.users > 0
            ? ((quotesSubmitted / stepFunnel[0].users) * 100).toFixed(1) + '%'
            : 'N/A',
      },
      funnel: stepFunnel,
      events: eventsByType.map((e: any) => ({
        type: e.eventType,
        count: e._count.eventType,
      })),
      ai: {
        avgLatencyMs: aiMetrics._avg.latencyMs
          ? Math.round(aiMetrics._avg.latencyMs)
          : 0,
        totalCalls: aiMetrics._count,
        totalCostUsd: aiMetrics._sum.costUsd
          ? aiMetrics._sum.costUsd.toFixed(2)
          : '0.00',
        errorRate:
          aiMetrics._count > 0
            ? ((aiErrorRate / aiMetrics._count) * 100).toFixed(1) + '%'
            : '0%',
      },
    });
  } catch (error) {
    console.error('[Analytics Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}


