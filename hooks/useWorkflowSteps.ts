import { useMemo } from 'react';

interface PhotoData {
  analysis?: {
    items?: unknown[];
  };
}

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  disabled: boolean;
}

export function useWorkflowSteps(
  currentStep: number,
  photos: PhotoData[],
  quoteFormData: unknown,
  roomGroups: any[] = []
): WorkflowStep[] {
  return useMemo(() => {
    const isStep1Completed = currentStep > 1 && photos.length > 0;
    const isStep2Completed = currentStep > 2 && roomGroups.length > 0; // Validation des pièces intégrée
    const isStep3Completed = currentStep > 3 && photos.some(p => p.analysis?.items && p.analysis.items.length > 0);
    const isStep4Completed = currentStep > 4 && quoteFormData !== null;
    const isStep5Completed = false; // Toujours false car c'est la dernière étape
    
    return [
      {
        id: 1,
        title: "Charger des photos",
        description: "Uploadez vos photos de pièces",
        icon: "📸",
        completed: isStep1Completed,
        disabled: false
      },
      {
        id: 2,
        title: "Valider les pièces",
        description: "Vérifiez la classification des pièces",
        icon: "🏠",
        completed: isStep2Completed,
        disabled: !isStep1Completed
      },
      {
        id: 3,
        title: "Valider l'inventaire",
        description: "Vérifiez les objets dans la pièce",
        icon: "🔍",
        completed: isStep3Completed,
        disabled: !isStep2Completed
      },
      {
        id: 4,
        title: "Préparer la demande",
        description: "Renseignez vos informations",
        icon: "📋",
        completed: isStep4Completed,
        disabled: false // Toujours accessible
      },
      {
        id: 5,
        title: "Envoyer le devis",
        description: "Finalisez votre demande",
        icon: "📤",
        completed: isStep5Completed,
        disabled: !isStep4Completed
      }
    ];
  }, [currentStep, photos, quoteFormData, roomGroups]);
}
