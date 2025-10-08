"use client";

interface WorkflowStepsProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  steps: {
    id: number;
    title: string;
    description: string;
    icon: string;
    completed: boolean;
    disabled: boolean;
  }[];
}

export default function WorkflowSteps({ currentStep, onStepChange, steps }: WorkflowStepsProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Étapes ultra-simplifiées */}
        <div className="flex justify-center space-x-8">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center space-x-2">
              {/* Cercle de l'étape avec états visuels clairs */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  step.completed
                    ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600 shadow-md' // ✅ Terminé : cercle vert avec ✓
                    : currentStep === step.id
                    ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700 shadow-lg ring-2 ring-blue-200' // 🎯 En cours : cercle bleu accentué
                    : step.disabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' // 🔒 Verrouillé : cercle gris clair
                    : 'bg-gray-400 text-white cursor-pointer hover:bg-gray-500 hover:shadow-md' // ⏳ Futur : cercle gris moyen
                }`}
                onClick={() => {
                  console.log('🎯 Clic sur étape', step.id, 'disabled:', step.disabled);
                  if (!step.disabled) {
                    onStepChange(step.id);
                  }
                }}
                title={step.disabled ? 'Étape verrouillée' : `Aller à l'étape ${step.id}: ${step.title}`}
              >
                {step.completed ? '✓' : step.id}
              </div>
              
              {/* Titre avec styles de police selon l'état */}
              <span className={`text-sm font-medium transition-all duration-200 ${
                step.completed 
                  ? 'text-green-600 font-semibold' // ✅ Terminé : texte vert, police accentuée
                  : currentStep === step.id 
                  ? 'text-gray-900 font-bold' // 🎯 En cours : texte foncé, police très accentuée
                  : step.disabled 
                  ? 'text-gray-400 font-normal' // 🔒 Verrouillé : texte gris clair, police normale
                  : 'text-gray-500 font-medium' // ⏳ Futur : texte gris moyen, police légèrement accentuée
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
