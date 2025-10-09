import { NextResponse } from 'next/server';
import { config } from '@core/config/app';

// Interface pour le statut d'une IA
interface AIServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  configured: boolean;
  model?: string;
  lastCheck?: string;
}

// Fonction pour vérifier le statut d'OpenAI
async function checkOpenAI(): Promise<AIServiceStatus> {
  const configured = !!config.openai.apiKey;
  
  if (!configured) {
    return {
      name: 'OpenAI',
      status: 'inactive',
      configured: false,
      model: config.openai.model
    };
  }

  try {
    // Vérification simple de la clé API
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
      },
      signal: AbortSignal.timeout(5000) // Timeout de 5s
    });

    return {
      name: 'OpenAI',
      status: response.ok ? 'active' : 'error',
      configured: true,
      model: config.openai.model,
      lastCheck: new Date().toISOString()
    };
  } catch {
    return {
      name: 'OpenAI',
      status: 'error',
      configured: true,
      model: config.openai.model,
      lastCheck: new Date().toISOString()
    };
  }
}

// Fonction pour vérifier le statut de Claude
async function checkClaude(): Promise<AIServiceStatus> {
  const configured = !!config.claude.apiKey;
  
  if (!configured) {
    return {
      name: 'Claude',
      status: 'inactive',
      configured: false,
      model: config.claude.model
    };
  }

  try {
    // Vérification simple avec un message minimal
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.claude.apiKey!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: config.claude.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      }),
      signal: AbortSignal.timeout(5000)
    });

    return {
      name: 'Claude',
      status: response.ok ? 'active' : 'error',
      configured: true,
      model: config.claude.model,
      lastCheck: new Date().toISOString()
    };
  } catch {
    return {
      name: 'Claude',
      status: 'error',
      configured: true,
      model: config.claude.model,
      lastCheck: new Date().toISOString()
    };
  }
}

// Fonction pour vérifier Google Cloud Vision
async function checkGoogleVision(): Promise<AIServiceStatus> {
  const configured = config.google.enabled;
  
  return {
    name: 'Google Vision',
    status: configured ? 'active' : 'inactive',
    configured: configured,
    model: 'Vision API',
    lastCheck: new Date().toISOString()
  };
}

// Fonction pour vérifier AWS Rekognition
async function checkAWSRekognition(): Promise<AIServiceStatus> {
  const configured = config.aws.enabled;
  
  return {
    name: 'AWS Rekognition',
    status: configured ? 'active' : 'inactive',
    configured: configured,
    model: 'Rekognition',
    lastCheck: new Date().toISOString()
  };
}

export async function GET() {
  try {
    // Vérifier tous les services en parallèle avec timeout global
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout global')), 10000)
    );

    const checkPromise = Promise.all([
      checkOpenAI(),
      checkClaude(),
      checkGoogleVision(),
      checkAWSRekognition()
    ]);

    const [openai, claude, google, aws] = await Promise.race([
      checkPromise,
      timeoutPromise
    ]) as any[];

    const services = [openai, claude, google, aws];
    const activeCount = services.filter(s => s.status === 'active').length;
    const totalCount = services.length;

    return NextResponse.json({
      success: true,
      summary: {
        active: activeCount,
        total: totalCount,
        allActive: activeCount === totalCount
      },
      services,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la vérification des services IA:', error);
    
    // Retourner un JSON valide même en cas d'erreur, avec status 503 (Service Unavailable)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Services IA temporairement indisponibles',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

