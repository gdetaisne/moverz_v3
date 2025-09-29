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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre demande de devis</h2>
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Étape {currentStep} sur {steps.length}
            </span>
          </div>
        </div>
        
        {/* Étapes */}
        <div className="relative">
          {/* Ligne de progression */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
          
          {/* Cartes des étapes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, stepIdx) => (
              <div
                key={step.id}
                className={`relative group cursor-pointer transition-all duration-300 ${
                  step.disabled ? 'cursor-not-allowed' : 'hover:scale-105'
                }`}
                onClick={() => !step.disabled && onStepChange(step.id)}
              >
                {/* Carte de l'étape */}
                <div className={`relative bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 ${
                  step.completed
                    ? 'border-green-400 bg-green-50 shadow-green-100'
                    : currentStep === step.id
                    ? 'border-blue-400 bg-blue-50 shadow-blue-100 ring-4 ring-blue-100'
                    : step.disabled
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl'
                }`}>
                  {/* Indicateur de progression */}
                  <div className="absolute -top-2 -right-2">
                    {step.completed ? (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : currentStep === step.id ? (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-white font-bold text-sm">{step.id}</span>
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                        step.disabled ? 'bg-gray-300' : 'bg-gray-400 group-hover:bg-blue-400'
                      }`}>
                        <span className={`font-bold text-sm ${
                          step.disabled ? 'text-gray-500' : 'text-white'
                        }`}>
                          {step.id}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Icône */}
                  <div className="text-center mb-4">
                    <div className={`text-4xl mb-2 ${
                      step.completed ? 'text-green-500' : 
                      currentStep === step.id ? 'text-blue-500' : 
                      step.disabled ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <div className="text-center">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      step.completed ? 'text-green-700' : 
                      currentStep === step.id ? 'text-blue-700' : 
                      step.disabled ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${
                      step.disabled ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Effet de survol */}
                  {!step.disabled && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
