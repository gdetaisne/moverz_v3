// AI Model cost estimation
// Prices in USD per 1K tokens

interface ModelPricing {
  inputPer1K: number;   // USD per 1000 input tokens
  outputPer1K: number;  // USD per 1000 output tokens
}

// Static pricing table (v1 - easily updatable)
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic Claude
  'claude-3-5-sonnet': { inputPer1K: 3.0, outputPer1K: 15.0 },
  'claude-3-5-haiku': { inputPer1K: 0.25, outputPer1K: 1.25 },
  'claude-3-sonnet': { inputPer1K: 3.0, outputPer1K: 15.0 },
  'claude-3-haiku': { inputPer1K: 0.25, outputPer1K: 1.25 },
  'claude-3-opus': { inputPer1K: 15.0, outputPer1K: 75.0 },
  
  // OpenAI GPT
  'gpt-4o': { inputPer1K: 5.0, outputPer1K: 15.0 },
  'gpt-4o-mini': { inputPer1K: 0.15, outputPer1K: 0.60 },
  'gpt-4-turbo': { inputPer1K: 10.0, outputPer1K: 30.0 },
  'gpt-4': { inputPer1K: 30.0, outputPer1K: 60.0 },
  'gpt-3.5-turbo': { inputPer1K: 0.50, outputPer1K: 1.50 },
  
  // Default fallback for unknown models
  'default': { inputPer1K: 1.0, outputPer1K: 2.0 },
};

/**
 * Estimate cost in USD for a given model and token usage
 */
export function estimateCost(
  model: string,
  tokensIn: number,
  tokensOut: number
): number {
  if (!tokensIn && !tokensOut) return 0;
  
  // Normalize model name (handle version suffixes)
  const normalizedModel = normalizeModelName(model);
  
  // Get pricing (fallback to default if unknown)
  const pricing = MODEL_PRICING[normalizedModel] || MODEL_PRICING['default'];
  
  const inputCost = (tokensIn / 1000) * pricing.inputPer1K;
  const outputCost = (tokensOut / 1000) * pricing.outputPer1K;
  
  return inputCost + outputCost;
}

/**
 * Normalize model name to match pricing table
 */
function normalizeModelName(model: string): string {
  if (!model) return 'default';
  
  const lower = model.toLowerCase();
  
  // Match exact keys first
  if (MODEL_PRICING[lower]) return lower;
  
  // Match partial (e.g., "gpt-4o-2024-05-13" -> "gpt-4o")
  for (const key of Object.keys(MODEL_PRICING)) {
    if (lower.startsWith(key)) return key;
  }
  
  return 'default';
}

/**
 * Get pricing info for a model (for display/documentation)
 */
export function getModelPricing(model: string): ModelPricing | undefined {
  const normalized = normalizeModelName(model);
  return MODEL_PRICING[normalized];
}
