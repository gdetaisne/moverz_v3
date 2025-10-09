import { NextRequest, NextResponse } from 'next/server';
import { enqueue } from '@ai/metrics/collector';

export const runtime = 'nodejs';

/**
 * POST /api/_dev/simulate-ai-call
 * 
 * Simulate AI calls for testing metrics collection
 * Dev-only endpoint
 */
export async function POST(req: NextRequest) {
  // Security: Dev-only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev endpoint not available in production' }, { status: 403 });
  }
  
  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(body.count || 10, 100);
    
    const providers = ['openai', 'anthropic', 'mock'] as const;
    const models = ['gpt-4o-mini', 'claude-3-5-haiku', 'gpt-4o', 'claude-3-5-sonnet'];
    const operations = ['analyzePhoto', 'detectRoom', 'analyzeByRoom'];
    const errorTypes = ['TIMEOUT', 'RATE_LIMIT', 'NETWORK', 'PROVIDER_ERROR'];
    
    const events = [];
    
    for (let i = 0; i < count; i++) {
      const success = Math.random() > 0.2; // 80% success rate
      const hasRetries = Math.random() > 0.7; // 30% have retries
      
      const event = {
        ts: Date.now() - Math.floor(Math.random() * 3600000), // Last hour
        provider: providers[Math.floor(Math.random() * providers.length)],
        model: models[Math.floor(Math.random() * models.length)],
        operation: operations[Math.floor(Math.random() * operations.length)],
        success,
        error_code: success ? undefined : errorTypes[Math.floor(Math.random() * errorTypes.length)],
        latency_ms: Math.floor(300 + Math.random() * 2000), // 300-2300ms
        retries: hasRetries ? Math.floor(Math.random() * 3) : 0,
        input_size_bytes: Math.floor(1024 + Math.random() * 10240), // 1-11 KB
        output_size_bytes: Math.floor(512 + Math.random() * 2048), // 0.5-2.5 KB
        input_tokens: Math.floor(256 + Math.random() * 2560),
        output_tokens: Math.floor(128 + Math.random() * 512),
        cost_usd: 0.001 + Math.random() * 0.01, // $0.001-0.011
        meta: {
          userId: `test-user-${Math.floor(Math.random() * 10)}`,
          simulation: true,
        },
      };
      
      enqueue(event);
      events.push(event);
    }
    
    // Force flush to ensure DB write
    const { flush } = await import('@ai/metrics/collector');
    await flush();
    
    return NextResponse.json({
      success: true,
      simulated: count,
      sample: events.slice(0, 3),
    });
  } catch (error) {
    console.error('[AI Metrics] Simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed' },
      { status: 500 }
    );
  }
}
