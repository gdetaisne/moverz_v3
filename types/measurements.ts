// types/measurements.ts
// Types partagés pour les mesures et détections d'objets

export interface DetectedObject {
  id?: string;
  label: string;
  confidence: number; // 0-1
  dimensions: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  volume: number; // m³
  category?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MeasurementResult {
  object: DetectedObject;
  method: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

