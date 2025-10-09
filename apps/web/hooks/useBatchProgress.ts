'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export interface BatchPhoto {
  id: string;
  filename: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  roomType?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface BatchProgress {
  batchId: string;
  status: 'QUEUED' | 'PROCESSING' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  counts: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  photos: BatchPhoto[];
  inventorySummary?: {
    totalItems: number;
    totalVolume: number;
    rooms: Array<{
      roomType: string;
      itemsCount: number;
      volume_m3: number;
    }>;
  };
}

export interface UseBatchProgressResult {
  data: BatchProgress | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
}

/**
 * Hook React pour suivre la progression d'un batch en temps réel via SSE
 * 
 * @param batchId - ID du batch à suivre
 * @param autoReconnect - Activer la reconnexion automatique (défaut: true)
 * @returns État du batch en temps réel
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useBatchProgress('batch-123');
 * 
 * if (isLoading) return <div>Connexion...</div>;
 * if (error) return <div>Erreur: {error}</div>;
 * if (!data) return null;
 * 
 * return <div>{data.progress}% ({data.status})</div>;
 * ```
 */
export function useBatchProgress(
  batchId: string | null,
  autoReconnect: boolean = true
): UseBatchProgressResult {
  const [data, setData] = useState<BatchProgress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!batchId) {
      setIsLoading(false);
      return;
    }

    // Cleanup précédente connexion
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log(`[SSE] Connecting to batch ${batchId}...`);
    setIsLoading(true);
    setError(null);

    try {
      const eventSource = new EventSource(`/api/batches/${batchId}/stream`);
      eventSourceRef.current = eventSource;

      // Event: open (connexion établie)
      eventSource.onopen = () => {
        console.log(`[SSE] Connected to batch ${batchId}`);
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset compteur
      };

      // Event: progress (mise à jour batch)
      eventSource.addEventListener('progress', (e: MessageEvent) => {
        try {
          const progress: BatchProgress = JSON.parse(e.data);
          setData(progress);
          setLastUpdate(new Date());
          setError(null);
        } catch (err) {
          console.error('[SSE] Error parsing progress event:', err);
        }
      });

      // Event: complete (batch terminé)
      eventSource.addEventListener('complete', (e: MessageEvent) => {
        try {
          const progress: BatchProgress = JSON.parse(e.data);
          setData(progress);
          setLastUpdate(new Date());
          console.log(`[SSE] Batch ${batchId} completed with status: ${progress.status}`);
          
          // Fermer la connexion car batch terminé
          eventSource.close();
          setIsConnected(false);
        } catch (err) {
          console.error('[SSE] Error parsing complete event:', err);
        }
      });

      // Event: error (erreur serveur)
      eventSource.addEventListener('error', (e: MessageEvent) => {
        try {
          const errorData = JSON.parse(e.data);
          setError(errorData.message || 'Server error');
        } catch {
          // Si pas de data, c'est une erreur de connexion
        }
      });

      // Event: ping (heartbeat)
      eventSource.addEventListener('ping', () => {
        // Juste pour maintenir la connexion, pas d'action nécessaire
      });

      // Event: timeout
      eventSource.addEventListener('timeout', () => {
        console.log('[SSE] Stream timeout');
        setError('Stream timeout after 30 minutes');
        eventSource.close();
        setIsConnected(false);
      });

      // Error handler (erreur réseau ou fermeture)
      eventSource.onerror = (err) => {
        console.error(`[SSE] Connection error for batch ${batchId}:`, err);
        setIsConnected(false);
        setIsLoading(false);

        // Si le batch est terminé, ne pas reconnecter
        if (data && ['COMPLETED', 'PARTIAL', 'FAILED'].includes(data.status)) {
          console.log('[SSE] Batch already completed, not reconnecting');
          eventSource.close();
          return;
        }

        // Reconnexion automatique si activée
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
          
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          setError(`Connection lost, reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError('Connection lost. Max reconnect attempts reached.');
          eventSource.close();
        }
      };

    } catch (err: any) {
      console.error('[SSE] Error creating EventSource:', err);
      setError(err.message || 'Failed to connect');
      setIsLoading(false);
      setIsConnected(false);
    }
  }, [batchId, autoReconnect, data]);

  // Effect: initialiser la connexion
  useEffect(() => {
    connect();

    // Cleanup à la destruction
    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Closing connection...');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return {
    data,
    isLoading,
    error,
    isConnected,
    lastUpdate,
  };
}




