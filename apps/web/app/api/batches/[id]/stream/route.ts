import { NextRequest } from 'next/server';
import { getUserId } from '@core/auth';
import { computeBatchProgress } from '@moverz/core';
import { prisma } from '@core/db';
import { subscribeToBatch } from '@/lib/redis';

/**
 * GET /api/batches/[id]/stream
 * Server-Sent Events endpoint for real-time batch progress
 * LOT 13: Utilise Redis Pub/Sub au lieu du polling DB
 */

// Métriques SSE (LOT 13)
let sseEventCount = 0;
let sseLatencySum = 0;
let sseLatencyCount = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;

  try {
    // 1. Authentification
    const userId = await getUserId(req);

    // 2. Vérifier que le batch existe et appartient à l'utilisateur
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { userId: true, status: true },
    });

    if (!batch) {
      return new Response('Batch not found', { status: 404 });
    }

    if (batch.userId !== userId) {
      return new Response('Unauthorized', { status: 403 });
    }

    // 3. Créer un stream encodé
    const encoder = new TextEncoder();
    let isClosed = false;
    let unsubscribe: (() => Promise<void>) | null = null;
    let heartbeatId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();

        // Helper pour envoyer un event SSE
        const sendEvent = (event: string, data: any) => {
          if (isClosed) return;
          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
            
            // Métriques (LOT 13)
            sseEventCount++;
            const latency = Date.now() - startTime;
            sseLatencySum += latency;
            sseLatencyCount++;
            
            console.log(`[SSE] Sent ${event} to batch ${batchId} (latency: ${latency}ms)`);
          } catch (error) {
            console.error('[SSE] Error sending event:', error);
          }
        };

        // Envoyer l'état initial immédiatement (depuis cache si disponible)
        try {
          const progress = await computeBatchProgress(batchId, true); // useCache = true
          sendEvent('progress', progress);
        } catch (error: any) {
          sendEvent('error', { message: error.message });
        }

        // LOT 13: S'abonner à Redis Pub/Sub au lieu de faire du polling
        try {
          const subscription = await subscribeToBatch(batchId, (data) => {
            const eventStartTime = Date.now();
            
            sendEvent('progress', data);
            
            // Si batch terminé, envoyer event final et fermer
            if (['COMPLETED', 'PARTIAL', 'FAILED'].includes(data.status)) {
              sendEvent('complete', data);
              cleanup();
            }
            
            // Mettre à jour métriques latency
            const eventLatency = Date.now() - eventStartTime;
            sseLatencySum += eventLatency;
            sseLatencyCount++;
          });

          unsubscribe = subscription.unsubscribe;
          console.log(`[SSE] Subscribed to batch ${batchId} via Redis Pub/Sub`);
        } catch (error: any) {
          console.error('[SSE] Error subscribing to batch:', error);
          sendEvent('error', { message: 'Failed to subscribe to batch updates' });
        }

        // Cleanup function
        const cleanup = () => {
          if (isClosed) return;
          isClosed = true;

          if (unsubscribe) {
            unsubscribe().catch((err) => {
              console.error('[SSE] Error unsubscribing:', err);
            });
          }

          if (heartbeatId) {
            clearInterval(heartbeatId);
          }

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          try {
            controller.close();
          } catch (err) {
            // Already closed
          }

          console.log(`[SSE] Client disconnected from batch ${batchId}`);
        };

        // Heartbeat ping toutes les 15 secondes
        heartbeatId = setInterval(() => {
          if (isClosed) {
            clearInterval(heartbeatId!);
            return;
          }
          sendEvent('ping', { timestamp: Date.now() });
        }, 15000);

        // Timeout après 30 minutes
        timeoutId = setTimeout(() => {
          if (!isClosed) {
            sendEvent('timeout', { message: 'Stream timeout after 30 minutes' });
            cleanup();
          }
        }, 30 * 60 * 1000);
      },

      cancel() {
        // Cleanup quand le client ferme la connexion
        isClosed = true;
        
        if (unsubscribe) {
          unsubscribe().catch((err) => {
            console.error('[SSE] Error unsubscribing on cancel:', err);
          });
        }

        if (heartbeatId) {
          clearInterval(heartbeatId);
        }

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.log(`[SSE] Client cancelled stream for batch ${batchId}`);
      },
    });

    // 4. Retourner le stream avec headers SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });

  } catch (error: any) {
    console.error(`[SSE] Error streaming batch ${batchId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Obtenir les métriques SSE (LOT 13)
 */
export function getSSEMetrics() {
  const avgLatency = sseLatencyCount > 0 ? sseLatencySum / sseLatencyCount : 0;
  
  return {
    sseEventCount,
    sseAvgLatencyMs: Math.round(avgLatency * 100) / 100,
  };
}

// Disable static optimization for SSE
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
