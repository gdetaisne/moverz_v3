import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';
import { z } from 'zod';

const TrackEventSchema = z.object({
  userId: z.string().min(1),
  eventType: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/analytics/track
 * Enregistre un événement analytics depuis le frontend
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, eventType, metadata } = TrackEventSchema.parse(body);

    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Pas d'erreur 500 pour ne pas casser l'app si tracking échoue
    console.warn('[Analytics] Échec track:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

