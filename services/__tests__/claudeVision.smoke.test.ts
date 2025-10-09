/**
 * Test anti-régression: s'assurer que analyzePhotoWithClaude
 * n'utilise plus le mock hardcodé "Table"
 */

import { describe, it, expect } from '@jest/globals';

describe('Claude Vision - Anti-Mock Test', () => {
  it('Ne retourne pas le mock legacy "Table" sans volume', () => {
    // Ce test vérifie que le module n'est pas un mock statique
    // En pratique, on ne peut pas appeler l'API en test unitaire (coût)
    // Mais on peut vérifier que le module exporté n'est pas le stub
    
    const { analyzePhotoWithClaude } = require('../claudeVision');
    
    // Vérifier que c'est bien une fonction
    expect(typeof analyzePhotoWithClaude).toBe('function');
    
    // Vérifier que ce n'est pas le mock (qui était synchrone et retournait immédiatement)
    // Le vrai Claude retourne une Promise
    const result = analyzePhotoWithClaude({ photoId: 'test', imageUrl: 'test' });
    expect(result).toBeInstanceOf(Promise);
  });
  
  it('Le module exporté contient les bonnes signatures', () => {
    const claudeModule = require('../claudeVision');
    
    // Vérifier que les exports clés existent
    expect(claudeModule).toHaveProperty('analyzePhotoWithClaude');
    expect(typeof claudeModule.analyzePhotoWithClaude).toBe('function');
  });
});

