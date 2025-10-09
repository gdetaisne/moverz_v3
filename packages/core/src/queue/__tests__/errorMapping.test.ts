import { describe, it, expect } from 'vitest';
import { mapError } from '../errorMapping';

describe('errorMapping', () => {
  it('should map timeout errors', () => {
    const result = mapError(new Error('Request timeout'));
    expect(result.errorCode).toBe('TIMEOUT');
    expect(result.retryable).toBe(true);
  });

  it('should map rate limit errors', () => {
    const result = mapError(new Error('Rate limit exceeded (429)'));
    expect(result.errorCode).toBe('RATE_LIMIT');
    expect(result.retryable).toBe(true);
  });

  it('should map provider down errors', () => {
    const result = mapError(new Error('Service unavailable (503)'));
    expect(result.errorCode).toBe('PROVIDER_DOWN');
    expect(result.retryable).toBe(true);
  });

  it('should map network errors', () => {
    const result = mapError(new Error('ECONNREFUSED'));
    expect(result.errorCode).toBe('NETWORK');
    expect(result.retryable).toBe(true);
  });

  it('should map bad input errors as non-retryable', () => {
    const result = mapError(new Error('Invalid request (400)'));
    expect(result.errorCode).toBe('BAD_INPUT');
    expect(result.retryable).toBe(false);
  });

  it('should map unknown errors', () => {
    const result = mapError(new Error('Something weird happened'));
    expect(result.errorCode).toBe('UNKNOWN');
    expect(result.retryable).toBe(true);
  });

  it('should truncate long error messages', () => {
    const longMessage = 'A'.repeat(300);
    const result = mapError(new Error(longMessage));
    expect(result.errorMessage.length).toBeLessThanOrEqual(200);
  });
});



