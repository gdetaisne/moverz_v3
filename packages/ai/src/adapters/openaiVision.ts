// OpenAI Vision adapter (simplified)
import { getApiConfig } from '@core/config/app';

export async function analyzePhotoWithOpenAI(imageBuffer: Buffer, options: any = {}): Promise<any> {
  // Mock implementation
  return {
    items: [
      { name: 'Chaise', category: 'mobilier', dismountable: true, fragile: false }
    ],
    roomType: 'salon',
    confidence: 0.8
  };
}