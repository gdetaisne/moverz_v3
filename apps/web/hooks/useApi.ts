/**
 * 🪝 Generic API hook with loading/error states
 */

import { useState, useCallback } from 'react';
import { ApiError } from '../lib/apiClient';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await apiCall();
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : (err as Error).message || 'Une erreur est survenue';
        setState({ data: null, loading: false, error: errorMessage });
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}



