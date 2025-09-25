"use client";
import { useState, useEffect } from "react";
import { AISettings, DEFAULT_AI_SETTINGS, getAISettings, saveAISettings, resetAISettings } from "@/lib/settings";

export default function BackOffice() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    setSettings(getAISettings());
  }, []);

  const handleSave = () => {
    saveAISettings(settings);
    setIsModified(false);
    alert("Paramètres sauvegardés !");
  };

  const handleReset = () => {
    const defaultSettings = resetAISettings();
    setSettings(defaultSettings);
    setIsModified(false);
    alert("Paramètres réinitialisés aux valeurs par défaut !");
  };

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsModified(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">🔧 Back-office IA</h1>
        <p className="text-base lg:text-lg text-gray-600">Configuration des paramètres d'analyse IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Configuration générale */}
        <div className="space-y-4 lg:space-y-6">
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Configuration générale</h2>
            
            <div className="space-y-4">
              <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Modèle IA
              </label>
                <select
                  value={settings.model}
                  onChange={(e) => updateSetting('model', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Recommandé)</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-vision-preview">GPT-4 Vision</option>
                </select>
              </div>

              <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Température (0.0 - 2.0)
              </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-700 mt-1">
                  <span>Déterministe</span>
                  <span className="font-semibold text-gray-800">{settings.temperature}</span>
                  <span>Créatif</span>
                </div>
              </div>

              {settings.maxTokens && (
                <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Max Tokens
              </label>
                  <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value) || undefined)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">💾 Actions</h2>
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={!isModified}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isModified
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Sauvegarder
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
            {isModified && (
              <p className="text-sm text-orange-700 font-medium mt-2">⚠️ Modifications non sauvegardées</p>
            )}
          </div>
        </div>

        {/* Prompts */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">💬 Prompt Système</h2>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => updateSetting('systemPrompt', e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900"
              placeholder="Instructions générales pour l'IA..."
            />
            <p className="text-sm text-gray-700 mt-2">
              Instructions générales données à l'IA avant chaque analyse
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Prompt Utilisateur</h2>
            <textarea
              value={settings.userPrompt}
              onChange={(e) => updateSetting('userPrompt', e.target.value)}
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900"
              placeholder="Instructions spécifiques et schéma JSON..."
            />
            <p className="text-sm text-gray-700 mt-2">
              Instructions détaillées et schéma JSON pour l'analyse des images
            </p>
          </div>
        </div>
      </div>

      {/* Prévisualisation */}
      <div className="mt-8 bg-gray-50 p-6 rounded-xl border">
        <h2 className="text-xl font-bold text-gray-800 mb-4">👁️ Prévisualisation</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Prompt Système</h3>
            <div className="bg-white p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap text-gray-900">
              {settings.systemPrompt}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Prompt Utilisateur</h3>
            <div className="bg-white p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap text-gray-900">
              {settings.userPrompt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
