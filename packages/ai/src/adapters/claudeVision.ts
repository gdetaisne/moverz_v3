// Claude Vision adapter (simplified)
import { getApiConfig } from '@core/config/app';

export async function analyzePhotoWithClaude(imageBuffer: Buffer, options: any = {}): Promise<any> {
  // Mock implementation
  return {
    items: [
      { name: 'Table', category: 'mobilier', dismountable: true, fragile: false }
    ],
    roomType: 'salon',
    confidence: 0.9
  };
}