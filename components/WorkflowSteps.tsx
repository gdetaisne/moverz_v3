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
    <div className="bg-gray-50 border-b">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* En-tête simple */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Demande de devis</h2>
          <div className="text-sm text-gray-600">
            Étape {currentStep} sur {steps.length}
          </div>
        </div>
        
        {/* Étapes simplifiées */}
        <div className="relative">
          {/* Ligne de progression */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
          
          {/* Étapes */}
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                {/* Cercle de l'étape */}
                <div
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-all z-10 ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-500 text-white'
                      : step.disabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-400 text-white hover:bg-blue-400'
                  }`}
                  onClick={() => !step.disabled && onStepChange(step.id)}
                >
                  {step.completed ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                
                {/* Titre de l'étape */}
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${
                    step.completed ? 'text-green-600' : 
                    currentStep === step.id ? 'text-blue-600' : 
                    step.disabled ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.id === 1 && '15 min'}
                    {step.id === 2 && '5 min'}
                    {step.id === 3 && '5 min'}
                    {step.id === 4 && '1 min'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
