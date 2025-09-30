"use client";
import { useState, useEffect } from "react";
import { AISettings, DEFAULT_AI_SETTINGS, getAISettings, saveAISettings, resetAISettings } from "@/lib/settings";
import { getPackagingRulesForDisplay } from "@/lib/packaging";

export default function BackOffice() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isModified, setIsModified] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'configuration' | 'prompts' | 'packaging' | 'json'>('overview');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Charger depuis le serveur en priorité
        const response = await fetch('/api/ai-settings');
        if (response.ok) {
          const serverSettings = await response.json();
          setSettings(serverSettings);
          console.log('Paramètres IA chargés depuis le serveur');
        } else {
          // Fallback sur les paramètres locaux
          setSettings(getAISettings());
          console.log('Paramètres IA chargés depuis le localStorage');
        }
      } catch (error) {
        console.warn('Erreur lors du chargement des paramètres IA:', error);
        setSettings(getAISettings());
      }
    };
    
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      // Sauvegarder côté client
      saveAISettings(settings);
      
      // Sauvegarder côté serveur
      const response = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setIsModified(false);
        alert("Paramètres sauvegardés côté client et serveur !");
      } else {
        console.warn('Erreur lors de la sauvegarde côté serveur');
        alert("Paramètres sauvegardés côté client uniquement !");
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert("Erreur lors de la sauvegarde !");
    }
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

  // Générer la synthèse de fonctionnement
  const generateAISummary = () => {
    const hasApiKey = settings.openaiApiKey && settings.openaiApiKey.length > 0;
    const mode = hasApiKey ? "Mode IA Réel" : "Mode Mock/Démo";
    const status = hasApiKey ? "✅ Actif" : "⚠️ Inactif (données simulées)";
    
    return {
      mode,
      status,
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens || "Illimité",
      hasApiKey,
      promptLength: settings.systemPrompt.length + settings.userPrompt.length,
      estimatedCost: hasApiKey ? "~$0.01-0.10 par photo" : "Gratuit (mode démo)"
    };
  };

  const summary = generateAISummary();

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">🔧 Back-office IA</h1>
        <p className="text-base lg:text-lg text-gray-600">Configuration et monitoring du système d'analyse IA</p>
      </div>

      {/* Navigation par sections */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: '🤖 Synthèse IA', icon: '📊' },
            { id: 'configuration', label: '⚙️ Configuration', icon: '🔧' },
            { id: 'prompts', label: '💬 Prompts', icon: '📝' },
            { id: 'packaging', label: '📦 Emballage', icon: '📦' },
            { id: 'json', label: '📋 Schéma JSON', icon: '🔍' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Synthèse IA */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Bloc principal IA */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                🤖 Système d'Analyse IA
                <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                  summary.hasApiKey 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {summary.status}
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Mode</div>
                <div className="font-semibold text-gray-900">{summary.mode}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Modèle</div>
                <div className="font-semibold text-gray-900">{summary.model}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Température</div>
                <div className="font-semibold text-gray-900">{summary.temperature}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Coût estimé</div>
                <div className="font-semibold text-gray-900">{summary.estimatedCost}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-3">📊 Fonctionnement du système</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500">1.</span>
                  <span><strong>Upload photo</strong> → Image convertie en Base64 et optimisée</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500">2.</span>
                  <span><strong>Prompt système</strong> → Instructions générales ({settings.systemPrompt.length} caractères)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500">3.</span>
                  <span><strong>Prompt utilisateur</strong> → Schéma JSON + instructions ({settings.userPrompt.length} caractères)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500">4.</span>
                  <span><strong>API OpenAI</strong> → Analyse avec {summary.model} (température: {summary.temperature})</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500">5.</span>
                  <span><strong>Validation</strong> → Schéma Zod + enrichissement catalogue</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500">6.</span>
                  <span><strong>Cache</strong> → Résultat mis en cache pour éviter les re-analyses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Actions rapides</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSave}
                disabled={!isModified}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isModified
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                🔄 Réinitialiser
              </button>
              <button
                onClick={() => setActiveSection('configuration')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                ⚙️ Configurer
              </button>
            </div>
            {isModified && (
              <p className="text-sm text-orange-700 font-medium mt-3">⚠️ Modifications non sauvegardées</p>
            )}
          </div>
        </div>
      )}

      {/* Section Configuration */}
      {activeSection === 'configuration' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔑 Clé API OpenAI</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Clé API (sk-...)
                </label>
                <input
                  type="password"
                  value={settings.openaiApiKey || ''}
                  onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="sk-proj-..."
                />
                <p className="text-sm text-gray-600 mt-1">
                  {summary.hasApiKey ? '✅ Clé configurée' : '⚠️ Aucune clé - mode démo activé'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Paramètres IA</h2>
              
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

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={settings.maxTokens || ''}
                    onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value) || undefined)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2000"
                  />
                  <p className="text-sm text-gray-600 mt-1">Laisser vide pour illimité</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Statistiques</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Longueur prompt total</span>
                  <span className="font-semibold">{summary.promptLength} caractères</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modèle actuel</span>
                  <span className="font-semibold">{summary.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Température</span>
                  <span className="font-semibold">{summary.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max tokens</span>
                  <span className="font-semibold">{summary.maxTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode</span>
                  <span className={`font-semibold ${summary.hasApiKey ? 'text-green-600' : 'text-yellow-600'}`}>
                    {summary.mode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Prompts */}
      {activeSection === 'prompts' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">💬 Prompt Système</h2>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => updateSetting('systemPrompt', e.target.value)}
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900"
              placeholder="Instructions générales pour l'IA..."
            />
            <p className="text-sm text-gray-700 mt-2">
              Instructions générales données à l'IA avant chaque analyse ({settings.systemPrompt.length} caractères)
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Prompt Utilisateur</h2>
            <textarea
              value={settings.userPrompt}
              onChange={(e) => updateSetting('userPrompt', e.target.value)}
              rows={12}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900"
              placeholder="Instructions spécifiques et schéma JSON..."
            />
            <p className="text-sm text-gray-700 mt-2">
              Instructions détaillées et schéma JSON pour l'analyse des images ({settings.userPrompt.length} caractères)
            </p>
          </div>
        </div>
      )}

      {/* Section Emballage */}
      {activeSection === 'packaging' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Règles d'Emballage</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configuration du carton standard */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">📦 Carton Standard</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Volume:</strong> {getPackagingRulesForDisplay().cartonStandard.volume} M³</div>
                  <div><strong>Dimensions:</strong> {getPackagingRulesForDisplay().cartonStandard.dimensions.length} × {getPackagingRulesForDisplay().cartonStandard.dimensions.width} × {getPackagingRulesForDisplay().cartonStandard.dimensions.height} cm</div>
                  <div className="text-gray-600">{getPackagingRulesForDisplay().cartonStandard.description}</div>
                </div>
              </div>

              {/* Seuil de classification */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-3">📏 Classification</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Seuil petit objet:</strong> ≤ {getPackagingRulesForDisplay().threshold.smallObjectLimit} M³</div>
                  <div className="text-gray-600">{getPackagingRulesForDisplay().threshold.description}</div>
                </div>
              </div>
            </div>

            {/* Règles d'emballage */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-4">📋 Règles d'Emballage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Petits objets non fragiles */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">📦</span>
                    <h4 className="font-semibold text-green-800">Petits Objets</h4>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><strong>Condition:</strong> {getPackagingRulesForDisplay().rules.smallNonFragile.description}</div>
                    <div><strong>Augmentation:</strong> +{getPackagingRulesForDisplay().rules.smallNonFragile.increase}</div>
                    <div><strong>Destination:</strong> {getPackagingRulesForDisplay().rules.smallNonFragile.destination}</div>
                  </div>
                </div>

                {/* Meubles non fragiles */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🪑</span>
                    <h4 className="font-semibold text-blue-800">Meubles</h4>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><strong>Condition:</strong> {getPackagingRulesForDisplay().rules.furnitureNonFragile.description}</div>
                    <div><strong>Augmentation:</strong> +{getPackagingRulesForDisplay().rules.furnitureNonFragile.increase}</div>
                    <div><strong>Destination:</strong> {getPackagingRulesForDisplay().rules.furnitureNonFragile.destination}</div>
                  </div>
                </div>

                {/* Objets fragiles */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">⚠️</span>
                    <h4 className="font-semibold text-red-800">Objets Fragiles</h4>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><strong>Condition:</strong> {getPackagingRulesForDisplay().rules.fragile.description}</div>
                    <div><strong>Multiplicateur:</strong> ×{getPackagingRulesForDisplay().rules.fragile.multiplier}</div>
                    <div><strong>Destination:</strong> {getPackagingRulesForDisplay().rules.fragile.destination}</div>
                  </div>
                </div>

                {/* Objets démontables */}
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🔧</span>
                    <h4 className="font-semibold text-emerald-800">Objets Démontables</h4>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><strong>Condition:</strong> {getPackagingRulesForDisplay().rules.dismountable.description}</div>
                    <div><strong>Réduction:</strong> {getPackagingRulesForDisplay().rules.dismountable.reduction}</div>
                    <div><strong>Destination:</strong> {getPackagingRulesForDisplay().rules.dismountable.destination}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exemples de calcul */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🧮 Exemples de Calcul</h3>
              <div className="text-sm space-y-2">
                <div><strong>Petit objet (0.03 M³, non fragile):</strong> 0.03 × 1.10 = 0.033 M³ → "55% d'un carton"</div>
                <div><strong>Meuble (0.5 M³, non fragile):</strong> 0.5 × 1.05 = 0.525 M³ → "0.525 M³ emballés"</div>
                <div><strong>Vase (0.02 M³, fragile):</strong> 0.02 × 2.0 = 0.04 M³ → "66.7% d'un carton"</div>
                <div><strong>Armoire (1.0 M³, démontable):</strong> 1.0 × 1.05 × 0.7 = 0.735 M³ → "0.735 M³ emballés"</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Schéma JSON */}
      {activeSection === 'json' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Schéma JSON de sortie</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
{`{
  "items": [
    {
      "label": "string",                  // Nom de l'objet
      "category": "furniture|appliance|box|art|misc",
      "confidence": 0-1,                  // Confiance de détection
      "quantity": 1,                      // Quantité
      "dimensions_cm": {
        "length": null,
        "width": null,
        "height": null,
        "source": "estimated|catalog"
      },
      "volume_m3": 0,                    // Volume en m³
      "fragile": true,                   // Objet fragile
      "stackable": false,                // Empilable
      "notes": "string|null"             // Notes additionnelles
    }
  ],
  "totals": {
    "count_items": 0,                    // Nombre total d'objets
    "volume_m3": 0                       // Volume total en m³
  },
  "special_rules": {
    "autres_objets": {
      "present": true,                   // Autres objets présents
      "listed_items": ["string"],        // Liste des autres objets
      "volume_m3": 0                     // Volume des autres objets
    }
  }
}`}
              </pre>
            </div>
            <p className="text-sm text-gray-700 mt-3">
              Ce schéma est utilisé pour valider et structurer les réponses de l'IA
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
