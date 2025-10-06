"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BackOffice from "@/components/BackOffice";
import WorkflowSteps from "@/components/WorkflowSteps";
import QuoteForm from "@/components/QuoteForm";
import DismountableToggle from "@/components/DismountableToggle";
import FragileToggle from "@/components/FragileToggle";
import ContinuationModal from "@/components/ContinuationModal";
import { PhotoCard } from "@/components/PhotoCard";
import { InventoryItemCard } from "@/components/InventoryItemCard";
import { InventorySummaryCard } from "@/components/InventorySummaryCard";
import { PhotoUploadZone } from "@/components/PhotoUploadZone";
import { useInventoryCalculations } from "@/hooks/useInventoryCalculations";
import { useWorkflowSteps } from "@/hooks/useWorkflowSteps";
import { getBuildInfo } from "@/lib/buildInfo";
import { TInventoryItem } from "@/lib/schemas";
import { clearCache } from "@/lib/cache";
import { calculatePackagedVolume } from "@/lib/packaging";
// 🎯 SUPPRIMÉ : Plus de détection de doublons

interface RoomData {
  id: string;
  name: string;
  photos: {
    file: File;
    fileUrl?: string;
    analysis?: any;
    status: 'uploaded' | 'processing' | 'completed' | 'error';
    error?: string;
    selectedItems: Set<number>;
    photoId?: string;
    progress?: number;
    roomName?: string;
  }[];
}

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<RoomData>({
    id: 'room-1',
    name: 'Détection automatique...',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'backoffice'>('tests');
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteFormData, setQuoteFormData] = useState<any>(null);
  const [inventoryValidated, setInventoryValidated] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSmallObjectsExpanded, setIsSmallObjectsExpanded] = useState(false);
  const [isMeublesExpanded, setIsMeublesExpanded] = useState(false);
  const [isMobilierFragileExpanded, setIsMobilierFragileExpanded] = useState(false);
  const [isCategoryDetailsExpanded, setIsCategoryDetailsExpanded] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<Map<string, Set<number>>>(new Map());
  const [showContinuationModal, setShowContinuationModal] = useState(false);
  const [hasShownContinuationModal, setHasShownContinuationModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Utiliser les hooks pour les calculs
  const inventoryCalculations = useInventoryCalculations(currentRoom.photos);
  const workflowSteps = useWorkflowSteps(currentStep, currentRoom.photos, quoteFormData);

  // Fonction pour changer d'étape
  const handleStepChange = (step: number) => {
    console.log('🎯 handleStepChange appelée avec étape:', step);
    setCurrentStep(step);
  };

  // Fonctions pour gérer le formulaire
  const handleQuoteFormNext = useCallback((formData: any) => {
    console.log('🎯 [PARENT] handleQuoteFormNext appelée avec:', formData);
    setQuoteFormData(formData);
    setCurrentStep(4);
  }, []);

  const handleQuoteFormPrevious = useCallback(() => {
    setCurrentStep(2);
  }, []);

  // Fonction pour gérer la sélection/désélection des objets
  const toggleObjectSelection = useCallback((photoId: string, itemIndex: number) => {
    setSelectedObjects(prev => {
      const newMap = new Map(prev);
      const currentSelection = newMap.get(photoId) || new Set();
      const newSelection = new Set(currentSelection);
      
      if (newSelection.has(itemIndex)) {
        newSelection.delete(itemIndex);
      } else {
        newSelection.add(itemIndex);
      }
      
      newMap.set(photoId, newSelection);
      return newMap;
    });
  }, []);

  const isObjectSelected = useCallback((photoId: string, itemIndex: number) => {
    const selection = selectedObjects.get(photoId);
    return selection ? selection.has(itemIndex) : false;
  }, [selectedObjects]);

  // Fonction pour gérer les toggles
  const handleDismountableToggle = useCallback((photoId: string, itemIndex: number, isDismountable: boolean) => {
    setCurrentRoom(prev => ({
      ...prev,
      photos: prev.photos.map(photo => {
        if (photo.photoId === photoId && photo.analysis?.items) {
          const updatedItems = [...photo.analysis.items];
          if (updatedItems[itemIndex]) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              dismountable: isDismountable,
              dismountable_confidence: 1.0,
              dismountable_source: 'user'
            };
          }
          return {
            ...photo,
            analysis: {
              ...photo.analysis,
              items: updatedItems
            }
          };
        }
        return photo;
      })
    }));
  }, []);

  const handleFragileToggle = useCallback((photoId: string, itemIndex: number, isFragile: boolean) => {
    setCurrentRoom(prev => ({
      ...prev,
      photos: prev.photos.map(photo => {
        if (photo.photoId === photoId && photo.analysis?.items) {
          const updatedItems = [...photo.analysis.items];
          if (updatedItems[itemIndex]) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              fragile: isFragile,
              confidence: 1.0
            };
          }
          return {
            ...photo,
            analysis: {
              ...photo.analysis,
              items: updatedItems
            }
          };
        }
        return photo;
      })
    }));
  }, []);

  // Fonction pour gérer l'upload de fichiers
  const handleFiles = useCallback((files: File[]) => {
    console.log('🎯 handleFiles appelée avec', files.length, 'fichiers');
    setLoading(true);
    
    const newPhotos = files.map(file => ({
      file,
      fileUrl: URL.createObjectURL(file),
      analysis: undefined,
      status: 'uploaded' as const,
      selectedItems: new Set<number>(),
      photoId: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      roomName: ''
    }));

    setCurrentRoom(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));

    // Simuler le traitement
    setTimeout(() => {
      setCurrentRoom(prev => ({
        ...prev,
        photos: prev.photos.map(photo => ({
          ...photo,
          status: 'completed' as const,
          progress: 100,
          analysis: {
            items: [
              {
                label: 'Exemple d\'objet détecté',
                category: 'meubles',
                volume_m3: 0.5,
                fragile: false,
                dismountable: true,
                quantity: 1
              }
            ]
          }
        }))
      }));
      setLoading(false);
    }, 2000);
  }, []);

  // Fonction pour changer le nom de la pièce
  const handleRoomNameChange = useCallback((photoId: string, name: string) => {
    setCurrentRoom(prev => ({
      ...prev,
      photos: prev.photos.map(photo => 
        photo.photoId === photoId 
          ? { ...photo, roomName: name }
          : photo
      )
    }));
  }, []);

  // Fonction pour télécharger le PDF
  const handleDownloadPDF = useCallback(async () => {
    console.log('📄 Téléchargement du PDF...');
    // TODO: Implémenter la génération PDF
  }, []);

  // Fonction pour envoyer le lien de continuation
  const handleSendContinuationLink = useCallback(async (email: string) => {
    console.log('📧 Envoi du lien de continuation à:', email);
    // TODO: Implémenter l'envoi d'email
  }, []);

  // Fonction pour soumettre le devis
  const handleSubmitQuote = useCallback(async () => {
    console.log('📤 Soumission du devis...');
    // TODO: Implémenter la soumission
  }, []);

  // Détecter si l'app est dans un iframe
  useEffect(() => {
    const checkIfEmbedded = () => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    };
    
    setIsEmbedded(checkIfEmbedded());
  }, []);

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (activeTab === 'backoffice') {
    return <BackOffice />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Moverz - Inventaire IA</h1>
            <button
              onClick={() => setActiveTab('backoffice')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back Office
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workflow Steps */}
        <WorkflowSteps
          currentStep={currentStep}
          onStepChange={handleStepChange}
          steps={workflowSteps}
        />

        {/* Step 1: Photo Upload */}
        {currentStep === 1 && (
          <div className="mt-8">
            <PhotoUploadZone
              onFilesUploaded={handleFiles}
              isDragOver={isDragOver}
              disabled={loading}
            />
            
            {/* Grille des photos existantes */}
            {currentRoom.photos.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentRoom.photos.map((photo, index) => (
                  <PhotoCard
                    key={photo.photoId || index}
                    photo={photo}
                    index={index}
                    onRoomNameChange={handleRoomNameChange}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Inventory Validation */}
        {currentStep === 2 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Photos chargées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRoom.photos.map((photo, index) => (
                  <PhotoCard
                    key={photo.photoId || index}
                    photo={photo}
                    index={index}
                    onRoomNameChange={handleRoomNameChange}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Inventaire détecté</h3>
              <div className="space-y-4">
                {Object.entries(inventoryCalculations.itemsByCategory).map(([category, items]) => (
                  <div key={category} className="bg-white rounded-lg shadow-sm border p-4">
                    <h4 className="font-medium mb-2">{category}</h4>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <InventoryItemCard
                          key={`${category}-${index}`}
                          item={{
                            ...item,
                            photoId: category, // Utiliser la catégorie comme photoId temporaire
                            itemIndex: index
                          }}
                          isSelected={false} // TODO: Implémenter la sélection
                          onToggle={toggleObjectSelection}
                          onDismountableToggle={handleDismountableToggle}
                          onFragileToggle={handleFragileToggle}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Quote Form */}
        {currentStep === 3 && (
          <div className="mt-8">
            <QuoteForm
              onNext={handleQuoteFormNext}
              onPrevious={handleQuoteFormPrevious}
              initialData={quoteFormData}
            />
          </div>
        )}

        {/* Step 4: Summary & Submit */}
        {currentStep === 4 && (
          <div className="mt-8">
            <InventorySummaryCard
              totalItems={inventoryCalculations.totalItems}
              totalVolume={inventoryCalculations.totalVolume}
              totalPackagedVolume={inventoryCalculations.totalPackagedVolume}
              fragileItems={inventoryCalculations.fragileItems}
              dismountableItems={inventoryCalculations.dismountableItems}
              categoriesCount={inventoryCalculations.categoriesCount}
              onDownloadPDF={handleDownloadPDF}
            />
          </div>
        )}

        {/* Continuation Modal */}
        <ContinuationModal
          isOpen={showContinuationModal}
          onClose={() => setShowContinuationModal(false)}
          onSend={handleSendContinuationLink}
          projectId={currentProjectId || ''}
        />
      </div>
    </div>
  );
}
