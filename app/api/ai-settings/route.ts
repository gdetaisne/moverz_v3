import { NextRequest, NextResponse } from 'next/server';
import { AISettings } from '@/lib/settings';
import { getServerAISettings, saveServerAISettings } from '@/lib/serverSettings';

export async function GET() {
  try {
    const settings = getServerAISettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres IA:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings: AISettings = await request.json();
    
    // Valider les paramètres reçus
    if (!settings.model || !settings.systemPrompt || !settings.userPrompt) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }
    
    // Sauvegarder les paramètres
    saveServerAISettings(settings);
    
    console.log('Paramètres IA sauvegardés:', {
      model: settings.model,
      temperature: settings.temperature,
      hasApiKey: !!settings.openaiApiKey,
      promptLength: settings.systemPrompt.length + settings.userPrompt.length
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres IA:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
