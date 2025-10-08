// Test setup file
import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.AI_TIMEOUT_MS = '1000';
process.env.AI_MAX_RETRIES = '1';
process.env.AI_METRICS_ENABLED = 'false';

// Global mocks
global.fetch = vi.fn();

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  // Keep error for debugging
};
