// Token estimation utilities
// Uses rough approximation: ~4 chars per token (conservative lower bound)

export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;
  
  // Rough estimation: 1 token ≈ 4 characters
  // This is a conservative estimate (actual tokenization varies by model)
  const chars = text.length;
  return Math.ceil(chars / 4);
}

export function estimateTokensFromObject(obj: any): number {
  if (!obj) return 0;
  
  try {
    const json = JSON.stringify(obj);
    return estimateTokens(json);
  } catch {
    return 0;
  }
}
