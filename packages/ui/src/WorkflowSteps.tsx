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
    <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Étapes ultra-simplifiées */}
        <div className="flex justify-center space-x-8">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center space-x-2">
              {/* Cercle de l'étape avec états visuels clairs */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  step.completed
                    ? 'bg-brand-accent text-white cursor-pointer hover:bg-brand-accent/90 shadow-md' // ✅ Terminé : cercle vert avec ✓
                    : currentStep === step.id
                    ? 'bg-brand-soft text-brand-primary cursor-pointer hover:bg-brand-soft/90 shadow-lg ring-2 ring-brand-soft/30' // 🎯 En cours : cercle turquoise accentué
                    : step.disabled
                    ? 'bg-white/10 text-white/40 cursor-not-allowed' // 🔒 Verrouillé : cercle gris clair
                    : 'bg-white/20 text-white/80 cursor-pointer hover:bg-white/30 hover:shadow-md' // ⏳ Futur : cercle gris moyen
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
                  ? 'text-brand-soft font-semibold' // ✅ Terminé : texte turquoise, police accentuée
                  : currentStep === step.id 
                  ? 'text-white font-bold' // 🎯 En cours : texte blanc, police très accentuée
                  : step.disabled 
                  ? 'text-white/40 font-normal' // 🔒 Verrouillé : texte gris clair, police normale
                  : 'text-white/70 font-medium' // ⏳ Futur : texte gris moyen, police légèrement accentuée
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
