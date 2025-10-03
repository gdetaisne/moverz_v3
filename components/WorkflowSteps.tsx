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
        {/* Étapes avec nouveau design */}
        <div className="flex justify-center space-x-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Cercle de l'étape avec nouveaux styles */}
              <div
                className={`stepper-step ${
                  step.completed
                    ? 'completed' // ✅ Terminé : vert d'eau
                    : currentStep === step.id
                    ? 'active' // 🎯 En cours : pétrole
                    : step.disabled
                    ? 'pending' // 🔒 Verrouillé : gris
                    : 'pending' // ⏳ Futur : gris
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
              
              {/* Ligne de connexion (sauf pour le dernier élément) */}
              {index < steps.length - 1 && (
                <div className={`stepper-line ${
                  step.completed ? 'completed' : 'pending'
                }`} />
              )}
              
              {/* Titre avec styles selon l'état */}
              <span className={`text-sm font-medium transition-all duration-200 ml-2 ${
                step.completed 
                  ? 'text-green-600 font-semibold' // ✅ Terminé : vert
                  : currentStep === step.id 
                  ? 'text-blue-600 font-bold' // 🎯 En cours : bleu du site
                  : step.disabled 
                  ? 'text-gray-400 font-normal' // 🔒 Verrouillé : gris clair
                  : 'text-gray-500 font-medium' // ⏳ Futur : gris moyen
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
