// Measurement utilities
export function getEstimatedDimensions(item: string): { width: number; height: number; depth: number } {
  // Mock implementation
  return { width: 100, height: 100, depth: 50 };
}

export function hasValidDimensions(dimensions: any): boolean {
  return dimensions && dimensions.width > 0 && dimensions.height > 0 && dimensions.depth > 0;
}

export function validateObjectDimensions(dimensions: any): boolean {
  return hasValidDimensions(dimensions);
}

export function calculateVolumeFromDimensions(dimensions: { width: number; height: number; depth: number }): number {
  return dimensions.width * dimensions.height * dimensions.depth;
}
