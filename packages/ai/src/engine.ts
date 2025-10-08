// AI Engine - Façade unique pour tous les services IA
import { analyzePhotoWithClaude } from './adapters/claudeVision';
import { analyzePhotoWithOpenAI } from './adapters/openaiVision';
import { detectRoomType } from './adapters/roomDetection';
import { analyzeByRoom } from './adapters/roomBasedAnalysis';
import { recordMetric, getMetrics } from './metrics';

export interface PhotoAnalysis {
  items: Array<{
    name: string;
    category: string;
    dismountable?: boolean;
    fragile?: boolean;
    selected?: boolean;
  }>;
  roomType?: string;
  confidence?: number;
}

export interface RoomAnalysis {
  roomType: string;
  items: Array<{
    name: string;
    category: string;
    dismountable?: boolean;
    fragile?: boolean;
    selected?: boolean;
  }>;
  confidence: number;
}

export interface AnalyzePhotoOptions {
  provider?: 'claude' | 'openai';
  roomType?: string;
  userId?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface EngineConfig {
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  modelStrategy: 'claude-first' | 'openai-first' | 'round-robin';
}

// Configuration par défaut (peut être surchargée par env)
const defaultConfig: EngineConfig = {
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000'),
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2'),
  retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000'),
  modelStrategy: (process.env.AI_MODEL_STRATEGY as EngineConfig['modelStrategy']) || 'claude-first',
};

// Wrapper avec timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

// Wrapper avec retries exponentiels
async function withRetries<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
  opName: string
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[AI Engine] ${opName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
}

// Wrapper avec metrics
async function withMetrics<T>(
  fn: () => Promise<T>,
  operation: string,
  model: string,
  inputSize: number
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let errorCode: string | undefined;
  
  try {
    const result = await fn();
    success = true;
    return result;
  } catch (error) {
    errorCode = (error as Error).message;
    throw error;
  } finally {
    const latencyMs = Date.now() - startTime;
    recordMetric({
      operation,
      timestamp: new Date().toISOString(),
      latency_ms: latencyMs,
      success,
      model,
      input_size_bytes: inputSize,
      error_code: errorCode,
    });
  }
}

/**
 * Analyser une photo et détecter les objets
 */
export async function analyzePhoto(
  imageBuffer: Buffer,
  options: AnalyzePhotoOptions = {}
): Promise<PhotoAnalysis> {
  const { 
    provider = 'claude',
    timeoutMs = defaultConfig.timeoutMs,
    maxRetries = defaultConfig.maxRetries,
  } = options;
  
  const model = provider === 'claude' ? 'claude-3-sonnet' : 'gpt-4-vision';
  const inputSize = imageBuffer.length;
  
  return withMetrics(
    () => withRetries(
      () => withTimeout(
        provider === 'claude' 
          ? analyzePhotoWithClaude(imageBuffer, options)
          : analyzePhotoWithOpenAI(imageBuffer, options),
        timeoutMs
      ),
      maxRetries,
      defaultConfig.retryDelayMs,
      'analyzePhoto'
    ),
    'analyzePhoto',
    model,
    inputSize
  );
}

/**
 * Détecter le type de pièce à partir d'une image
 */
export async function detectRoom(
  imageBuffer: Buffer,
  options: { timeoutMs?: number; maxRetries?: number } = {}
): Promise<string> {
  const { 
    timeoutMs = defaultConfig.timeoutMs,
    maxRetries = defaultConfig.maxRetries,
  } = options;
  
  const inputSize = imageBuffer.length;
  
  return withMetrics(
    () => withRetries(
      () => withTimeout(
        detectRoomType(imageBuffer),
        timeoutMs
      ),
      maxRetries,
      defaultConfig.retryDelayMs,
      'detectRoom'
    ),
    'detectRoom',
    'claude-3-sonnet',
    inputSize
  );
}

/**
 * Analyser une pièce avec ses photos
 */
export async function analyzeByRoomType(
  roomType: string,
  photos: Array<{ buffer: Buffer; url: string }>,
  options: { timeoutMs?: number; maxRetries?: number } = {}
): Promise<RoomAnalysis> {
  const { 
    timeoutMs = defaultConfig.timeoutMs * 2, // Double timeout for room analysis
    maxRetries = defaultConfig.maxRetries,
  } = options;
  
  const inputSize = photos.reduce((sum, p) => sum + p.buffer.length, 0);
  
  return withMetrics(
    () => withRetries(
      () => withTimeout(
        analyzeByRoom(roomType, photos),
        timeoutMs
      ),
      maxRetries,
      defaultConfig.retryDelayMs,
      'analyzeByRoomType'
    ),
    'analyzeByRoomType',
    'claude-3-sonnet',
    inputSize
  );
}

/**
 * Obtenir les métriques collectées
 */
export { getMetrics };
