// services/core/errorHandling.ts
// Gestion d'erreurs centralisée et standardisée

export enum ErrorType {
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR'
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class APIError extends AppError {
  constructor(service: string, message: string, statusCode: number = 500) {
    super(
      `${service} API Error: ${message}`,
      ErrorType.API_ERROR,
      `API_${service.toUpperCase()}_ERROR`,
      statusCode
    );
  }
}

export class ValidationError extends AppError {
  constructor(field: string, message: string) {
    super(
      `Validation Error: ${field} - ${message}`,
      ErrorType.VALIDATION_ERROR,
      `VALIDATION_${field.toUpperCase()}_ERROR`,
      400
    );
  }
}

export class ConfigurationError extends AppError {
  constructor(service: string, message: string) {
    super(
      `Configuration Error: ${service} - ${message}`,
      ErrorType.CONFIGURATION_ERROR,
      `CONFIG_${service.toUpperCase()}_ERROR`,
      500
    );
  }
}

/**
 * Wrapper pour les appels API avec gestion d'erreurs standardisée
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  serviceName: string,
  fallback?: T
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`[${serviceName}] API Error:`, error);
    
    if (fallback !== undefined) {
      console.warn(`[${serviceName}] Using fallback value`);
      return fallback;
    }
    
    return null;
  }
}

import { logger } from './loggingService';

/**
 * Logger d'erreurs standardisé
 */
export function logError(error: Error, context: string, additionalData?: any): void {
  if (error instanceof AppError) {
    logger.error(`${error.type} ${error.code}: ${error.message}`, context, {
      errorType: error.type,
      errorCode: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      stack: error.stack,
      ...additionalData
    });
  } else {
    logger.error(`Unknown error: ${error.message}`, context, {
      stack: error.stack,
      ...additionalData
    });
  }
}

/**
 * Handler d'erreurs pour les services
 */
export function createErrorHandler(serviceName: string) {
  return (error: unknown, context: string) => {
    if (error instanceof AppError) {
      logError(error, `${serviceName}:${context}`);
    } else if (error instanceof Error) {
      logError(error, `${serviceName}:${context}`);
    } else {
      logError(new Error(String(error)), `${serviceName}:${context}`);
    }
  };
}
