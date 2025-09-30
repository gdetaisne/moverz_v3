// services/core/loggingService.ts
// Service de logging centralisé avec niveaux et correlation ID

import { config } from '../../config/app';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: string;
  correlationId?: string;
}

class LoggingService {
  private correlationId: string | null = null;
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.parseLogLevel(config.logging.level);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  /**
   * Définit un ID de corrélation pour le tracing
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Génère un nouvel ID de corrélation
   */
  generateCorrelationId(): string {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setCorrelationId(id);
    return id;
  }

  /**
   * Log d'erreur
   */
  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log d'information
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log de debug
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log générique
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (level > this.logLevel) {
      return; // Niveau de log trop élevé
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId || undefined
    };

    const levelName = LogLevel[level];
    const contextStr = context ? `[${context}]` : '';
    const correlationStr = this.correlationId ? `[${this.correlationId}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';

    const logMessage = `${entry.timestamp} ${levelName} ${contextStr}${correlationStr} ${message}${dataStr}`;

    // Log vers la console
    if (config.logging.enableConsole) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(logMessage);
          break;
        case LogLevel.WARN:
          console.warn(logMessage);
          break;
        case LogLevel.INFO:
          console.info(logMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(logMessage);
          break;
      }
    }

    // TODO: Log vers fichier si configuré
    if (config.logging.enableFile) {
      // Implémenter l'écriture vers fichier
    }
  }

  /**
   * Crée un logger avec un contexte fixe
   */
  createContextLogger(context: string) {
    return {
      error: (message: string, data?: any) => this.error(message, context, data),
      warn: (message: string, data?: any) => this.warn(message, context, data),
      info: (message: string, data?: any) => this.info(message, context, data),
      debug: (message: string, data?: any) => this.debug(message, context, data)
    };
  }

  /**
   * Mesure le temps d'exécution d'une fonction
   */
  async timeFunction<T>(
    name: string,
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    const startTime = performance.now();
    this.debug(`Starting ${name}`, context);
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.info(`Completed ${name} in ${duration.toFixed(2)}ms`, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`Failed ${name} after ${duration.toFixed(2)}ms: ${error}`, context);
      throw error;
    }
  }

  /**
   * Mesure le temps d'exécution d'une fonction synchrone
   */
  timeFunctionSync<T>(
    name: string,
    fn: () => T,
    context?: string
  ): T {
    const startTime = performance.now();
    this.debug(`Starting ${name}`, context);
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.info(`Completed ${name} in ${duration.toFixed(2)}ms`, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`Failed ${name} after ${duration.toFixed(2)}ms: ${error}`, context);
      throw error;
    }
  }
}

// Instance singleton du service de logging
export const logger = new LoggingService();

// Fonctions utilitaires
export function createLogger(context: string) {
  return logger.createContextLogger(context);
}

export function timeFunction<T>(name: string, fn: () => Promise<T>, context?: string): Promise<T> {
  return logger.timeFunction(name, fn, context);
}

export function timeFunctionSync<T>(name: string, fn: () => T, context?: string): T {
  return logger.timeFunctionSync(name, fn, context);
}

