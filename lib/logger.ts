/**
 * 📊 Logger Minimal - Moverz v3.1
 * 
 * Logger simple avec niveaux configurables via LOG_LEVEL.
 * Zéro dépendance externe.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Message debug', { data });  // Only if LOG_LEVEL=debug
 *   logger.info('Message info');
 *   logger.warn('Warning');
 *   logger.error('Error', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel;

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

export const logger = {
  /**
   * Debug logs (verbose) - Only shown if LOG_LEVEL=debug
   */
  debug: (message: string, data?: any) => {
    if (shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Info logs - Shown by default
   */
  info: (message: string, data?: any) => {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Warning logs
   */
  warn: (message: string, data?: any) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Error logs (always shown)
   */
  error: (message: string, error?: Error | any) => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  },
};

// Export default
export default logger;

