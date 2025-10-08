import { AISettings, DEFAULT_AI_SETTINGS } from './settings';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
const SETTINGS_FILE = path.join(process.cwd(), 'ai-settings.json');

export function getServerAISettings(): AISettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(data);
      // Valider que tous les champs requis sont présents
      return { ...DEFAULT_AI_SETTINGS, ...settings };
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des paramètres IA:', error);
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveServerAISettings(settings: AISettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logger.debug('Paramètres IA sauvegardés côté serveur');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres IA:', error);
    throw error;
  }
}
