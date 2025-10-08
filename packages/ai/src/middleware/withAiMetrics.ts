// AI Metrics Middleware - Wrapper for AI calls with observability
import { enqueue, AiMetricEvent } from '../metrics/collector';
import { estimateTokens } from '../metrics/tokenEstimator';
import { estimateCost } from '../metrics/cost';

type AiCallable<I, O> = (input: I) => Promise<O>;

export interface WithAiMetricsOptions<I, O> {
  provider: 'openai' | 'anthropic' | 'google' | 'aws' | 'mock';
  model: string;
  operation: string;
  estimateTokensFn?: (input: I, output?: O) => { inTok?: number; outTok?: number };
  meta?: (input: I, output?: O, err?: unknown) => Record<string, any> | undefined;
}

/**
 * Wrap an AI call with metrics collection
 * 
 * This middleware:
 * - Measures latency
 * - Tracks success/failure
 * - Estimates tokens and cost
 * - Enqueues metrics (non-blocking)
 * - Does NOT modify the call signature or errors
 */
export function withAiMetrics<I, O>(
  fn: AiCallable<I, O>,
  options: WithAiMetricsOptions<I, O>
): AiCallable<I, O> {
  return async (input: I): Promise<O> => {
    const startTime = Date.now();
    let success = false;
    let errorCode: string | undefined;
    let output: O | undefined;
    let inputSizeBytes = 0;
    let outputSizeBytes = 0;
    
    try {
      // Estimate input size
      if (Buffer.isBuffer(input)) {
        inputSizeBytes = input.length;
      } else if (typeof input === 'string') {
        inputSizeBytes = Buffer.byteLength(input, 'utf-8');
      } else if (typeof input === 'object') {
        inputSizeBytes = Buffer.byteLength(JSON.stringify(input), 'utf-8');
      }
      
      // Execute the actual AI call
      output = await fn(input);
      success = true;
      
      // Estimate output size
      if (Buffer.isBuffer(output)) {
        outputSizeBytes = output.length;
      } else if (typeof output === 'string') {
        outputSizeBytes = Buffer.byteLength(output, 'utf-8');
      } else if (typeof output === 'object') {
        outputSizeBytes = Buffer.byteLength(JSON.stringify(output), 'utf-8');
      }
      
      return output;
    } catch (error) {
      errorCode = categorizeError(error);
      throw error; // Re-throw to maintain original behavior
    } finally {
      const latencyMs = Date.now() - startTime;
      
      // Estimate tokens (if not provided by estimateTokensFn)
      let tokensIn: number | undefined;
      let tokensOut: number | undefined;
      
      if (options.estimateTokensFn) {
        const tokens = options.estimateTokensFn(input, output);
        tokensIn = tokens.inTok;
        tokensOut = tokens.outTok;
      } else {
        // Fallback: estimate from bytes
        if (inputSizeBytes > 0) {
          tokensIn = Math.ceil(inputSizeBytes / 4);
        }
        if (outputSizeBytes > 0) {
          tokensOut = Math.ceil(outputSizeBytes / 4);
        }
      }
      
      // Estimate cost
      const costUsd = estimateCost(
        options.model,
        tokensIn || 0,
        tokensOut || 0
      );
      
      // Build metric event
      const event: AiMetricEvent = {
        ts: startTime,
        provider: options.provider,
        model: options.model,
        operation: options.operation,
        success,
        error_code: errorCode,
        latency_ms: latencyMs,
        retries: 0, // TODO: Extract from retry wrapper if available
        input_size_bytes: inputSizeBytes,
        output_size_bytes: outputSizeBytes,
        input_tokens: tokensIn,
        output_tokens: tokensOut,
        cost_usd: costUsd,
        meta: options.meta ? options.meta(input, output, errorCode) : undefined,
      };
      
      // Enqueue (non-blocking)
      enqueue(event);
    }
  };
}

/**
 * Categorize error type
 */
function categorizeError(error: unknown): string {
  if (!error) return 'UNKNOWN';
  
  const message = (error as Error).message || String(error);
  const lower = message.toLowerCase();
  
  if (lower.includes('timeout') || lower.includes('ai_timeout')) {
    return 'TIMEOUT';
  }
  if (lower.includes('rate limit') || lower.includes('429')) {
    return 'RATE_LIMIT';
  }
  if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('fetch')) {
    return 'NETWORK';
  }
  if (lower.includes('api') || lower.includes('provider')) {
    return 'PROVIDER_ERROR';
  }
  
  return 'UNKNOWN';
}
