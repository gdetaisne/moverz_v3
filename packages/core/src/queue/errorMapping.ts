/**
 * Mapping des erreurs IA vers des codes stables
 * Pour observabilité et gestion cohérente des erreurs
 */

export type ErrorCode =
  | 'TIMEOUT'
  | 'PROVIDER_DOWN'
  | 'BAD_INPUT'
  | 'RATE_LIMIT'
  | 'NETWORK'
  | 'UNKNOWN';

export interface MappedError {
  errorCode: ErrorCode;
  errorMessage: string;
  retryable: boolean;
}

/**
 * Mapper une erreur brute vers un code stable
 */
export function mapError(error: any): MappedError {
  const errorMessage = error?.message || String(error);
  const errorLower = errorMessage.toLowerCase();

  // Timeout
  if (
    errorLower.includes('timeout') ||
    errorLower.includes('ai_timeout') ||
    errorLower.includes('timed out')
  ) {
    return {
      errorCode: 'TIMEOUT',
      errorMessage: 'Timeout lors de l\'appel IA',
      retryable: true,
    };
  }

  // Rate limit
  if (
    errorLower.includes('rate limit') ||
    errorLower.includes('429') ||
    errorLower.includes('too many requests')
  ) {
    return {
      errorCode: 'RATE_LIMIT',
      errorMessage: 'Quota IA dépassé, retry automatique',
      retryable: true,
    };
  }

  // Provider down / erreur serveur
  if (
    errorLower.includes('500') ||
    errorLower.includes('503') ||
    errorLower.includes('502') ||
    errorLower.includes('provider error') ||
    errorLower.includes('service unavailable')
  ) {
    return {
      errorCode: 'PROVIDER_DOWN',
      errorMessage: 'Service IA temporairement indisponible',
      retryable: true,
    };
  }

  // Network
  if (
    errorLower.includes('network') ||
    errorLower.includes('econnrefused') ||
    errorLower.includes('enotfound') ||
    errorLower.includes('fetch failed')
  ) {
    return {
      errorCode: 'NETWORK',
      errorMessage: 'Erreur réseau lors de l\'appel IA',
      retryable: true,
    };
  }

  // Bad input (validation)
  if (
    errorLower.includes('invalid') ||
    errorLower.includes('bad request') ||
    errorLower.includes('400') ||
    errorLower.includes('validation')
  ) {
    return {
      errorCode: 'BAD_INPUT',
      errorMessage: 'Données invalides pour l\'IA',
      retryable: false,
    };
  }

  // Unknown
  return {
    errorCode: 'UNKNOWN',
    errorMessage: errorMessage.substring(0, 200), // Truncate
    retryable: true,
  };
}



