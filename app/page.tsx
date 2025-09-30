"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BackOffice from "@/components/BackOffice";
import WorkflowSteps from "@/components/WorkflowSteps";
import QuoteForm from "@/components/QuoteForm";
import DismountableToggle from "@/components/DismountableToggle";
import { getBuildInfo } from "@/lib/buildInfo";
import { TInventoryItem } from "@/lib/schemas";
import { clearCache } from "@/lib/cache";
import { calculatePackagedVolume } from "@/lib/packaging";

interface RoomData {
  id: string;
  name: string;
  photos: {
    file: File;
    fileUrl?: string; // URL du fichier uploadé
    analysis?: any;
    status: 'uploaded' | 'processing' | 'completed' | 'error';
    error?: string;
    selectedItems: Set<number>; // Indices des objets sélectionnés (toujours défini)
    photoId?: string; // ID unique pour le traitement asynchrone
    progress?: number; // Pourcentage de progression (0-100)
    roomName?: string; // Nom de la pièce pour cette photo spécifique
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
  const [selectedObjects, setSelectedObjects] = useState<Map<string, Set<number>>>(new Map()); // photoId -> Set<itemIndex>
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Configuration des étapes du workflow
  // Une étape n'est "terminée" que si on est passé à l'étape suivante
  const isStep1Completed = currentStep > 1 && currentRoom.photos.length > 0;
  const isStep2Completed = currentStep > 2 && currentRoom.photos.some(p => p.analysis?.items && p.analysis.items.length > 0);
  const isStep3Completed = currentStep > 3 && quoteFormData !== null;
  const isStep4Completed = false; // Toujours false car c'est la dernière étape
  
  const workflowSteps = [
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
      title: "Valider l'inventaire",
      description: "Vérifiez les objets dans la pièce",
      icon: "🔍",
      completed: isStep2Completed,
      disabled: !isStep1Completed
    },
    {
      id: 3,
      title: "Préparer la demande",
      description: "Renseignez vos informations",
      icon: "📋",
      completed: isStep3Completed,
      disabled: false // Toujours accessible
    },
    {
      id: 4,
      title: "Envoyer le devis",
      description: "Finalisez votre demande",
      icon: "📤",
      completed: isStep4Completed,
      disabled: !isStep3Completed
    }
  ];

  // Fonction pour changer d'étape
  const handleStepChange = (step: number) => {
    console.log('🎯 handleStepChange appelée avec étape:', step);
    setCurrentStep(step);
  };

  // Fonctions pour gérer le formulaire (mémorisées pour éviter les re-rendus)
  const handleQuoteFormNext = useCallback((formData: any) => {
    console.log('🎯 [PARENT] handleQuoteFormNext appelée avec:', formData);
    setQuoteFormData(formData);
    // Passer à l'étape suivante (étape 4 - Envoyer le devis)
    console.log('📈 [PARENT] Passage à l\'étape 4');
    setCurrentStep(4);
    console.log('✅ [PARENT] currentStep mis à jour');
  }, []);

  const handleQuoteFormPrevious = useCallback(() => {
    // Retourner à l'étape précédente (étape 2 - Valider l'inventaire)
    setCurrentStep(2);
  }, []);

  // Fonction pour gérer la sélection/désélection des objets
  const toggleObjectSelection = useCallback((photoId: string, itemIndex: number) => {
    setSelectedObjects(prev => {
      const newMap = new Map(prev);
      const currentSelection = newMap.get(photoId) || new Set<number>();
      const newSelection = new Set(currentSelection);
      
      if (newSelection.has(itemIndex)) {
        // Désélectionner
        newSelection.delete(itemIndex);
      } else {
        // Sélectionner
        newSelection.add(itemIndex);
      }
      
      newMap.set(photoId, newSelection);
      return newMap;
    });
  }, []);

  // Fonction pour vérifier si un objet est sélectionné
  const isObjectSelected = useCallback((photoId: string, itemIndex: number) => {
    const selection = selectedObjects.get(photoId);
    // Par défaut, tous les objets sont sélectionnés si pas d'état spécifique
    // Si la sélection existe mais ne contient pas l'index, alors l'objet n'est pas sélectionné
    return selection ? selection.has(itemIndex) : true;
  }, [selectedObjects]);

  // Fonction pour gérer le toggle de démontabilité
  const handleDismountableToggle = useCallback((photoId: string, itemIndex: number, isDismountable: boolean) => {
    setCurrentRoom(prev => ({
      ...prev,
      photos: prev.photos.map(photo => {
        if (photo.photoId === photoId) {
          return {
            ...photo,
            analysis: {
              ...photo.analysis,
              items: photo.analysis?.items?.map((item: any, index: number) => {
                if (index === itemIndex) {
                  // Mettre à jour le statut démontable
                  const updatedItem = {
                    ...item,
                    dismountable: isDismountable,
                    dismountable_source: 'user'
                  };
                  
                  // Recalculer le volume emballé avec la nouvelle démontabilité
                  const packagingInfo = calculatePackagedVolume(
                    updatedItem.volume_m3,
                    updatedItem.fragile,
                    updatedItem.category,
                    updatedItem.dimensions_cm,
                    updatedItem.dismountable
                  );
                  
                  return {
                    ...updatedItem,
                    packaged_volume_m3: packagingInfo.packagedVolumeM3,
                    packaging_display: packagingInfo.displayValue,
                    is_small_object: packagingInfo.isSmallObject,
                    packaging_calculation_details: packagingInfo.calculationDetails
                  };
                }
                return item;
              }) || []
            }
          };
        }
        return photo;
      })
    }));
  }, []);

  // Fonction pour obtenir les détails de calcul d'emballage
  const getPackagingDetails = useCallback((item: any) => {
    if (item.packaging_calculation_details) {
      return item.packaging_calculation_details;
    }
    
    // Si pas de détails, créer un résumé basique avec la nouvelle structure
    const volume = item.volume_m3 || 0;
    const packaged = item.packaged_volume_m3 || volume;
    const isFragile = item.fragile || false;
    const isSmall = item.is_small_object || false;
    
    // 1. DIMENSIONS
    let details = "📏 DIMENSIONS\n";
    if (item.dimensions_cm && item.dimensions_cm.length && item.dimensions_cm.width && item.dimensions_cm.height) {
      const maxDim = Math.max(item.dimensions_cm.length, item.dimensions_cm.width, item.dimensions_cm.height);
      details += `${item.dimensions_cm.length}×${item.dimensions_cm.width}×${item.dimensions_cm.height}cm (max: ${maxDim}cm)`;
    } else {
      details += "Non disponibles";
    }
    
    // 2. RÈGLE TYPE D'OBJET
    details += "\n\n🔧 RÈGLE TYPE D'OBJET\n";
    if (isFragile) {
      details += "Objet fragile → Volume × 2";
    } else if (isSmall) {
      details += "Petit objet non fragile → Volume + 10%";
    } else {
      details += "Meuble non fragile → Volume + 5%";
    }
    
    // 3. RÈGLE DU CARTON
    details += "\n\n📦 RÈGLE DU CARTON\n";
    if (item.dimensions_cm && item.dimensions_cm.length && item.dimensions_cm.width && item.dimensions_cm.height) {
      const maxDim = Math.max(item.dimensions_cm.length, item.dimensions_cm.width, item.dimensions_cm.height);
      details += `Dimension max: ${maxDim}cm\n`;
      details += `Carton max: 50cm\n`;
      details += `Résultat: ${maxDim <= 50 ? '✓ Rentré dans carton' : '✗ Trop grand pour carton'}`;
    } else {
      details += "Seuil volume: 0.06 m³";
      details += `\nRésultat: ${volume <= 0.06 ? '✓ Petit objet' : '✗ Gros objet'}`;
    }
    
    // 4. DIMENSION EMBALLÉE
    details += "\n\n📊 DIMENSION EMBALLÉE\n";
    details += `Volume original: ${volume.toFixed(3)} m³\n`;
    details += `Volume emballé: ${packaged.toFixed(3)} m³`;
    
    if (isSmall) {
      const percentage = (packaged / 0.06) * 100;
      const rounded = Math.ceil(percentage * 10) / 10;
      details += `\n\nPourcentage carton:\n${packaged.toFixed(3)} ÷ 0.060 = ${percentage.toFixed(1)}%\nArrondi supérieur: ${rounded}%`;
    } else {
      details += `\n\nAffichage: ${packaged.toFixed(1)} m³ emballés`;
    }
    
    return details;
  }, []);

  // Fonction pour initialiser la sélection par défaut pour une photo
  const initializeDefaultSelection = useCallback((photoId: string, totalItems: number) => {
    setSelectedObjects(prev => {
      const newMap = new Map(prev);
      
      // Si cette photo n'a pas encore de sélection, on l'initialise avec tous les objets sélectionnés
      if (!newMap.has(photoId)) {
        const defaultSelection = new Set<number>();
        for (let i = 0; i < totalItems; i++) {
          defaultSelection.add(i);
        }
        newMap.set(photoId, defaultSelection);
      }
      
      return newMap;
    });
  }, []);

  // Initialiser la sélection par défaut pour toutes les photos analysées
  useEffect(() => {
    currentRoom.photos.forEach(photo => {
      if (photo.analysis?.items && photo.analysis.items.length > 0) {
        const photoId = photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`;
        const totalItems = photo.analysis.items.length;
        
        // Vérifier si cette photo a déjà une sélection
        if (!selectedObjects.has(photoId)) {
          initializeDefaultSelection(photoId, totalItems);
        }
      }
    });
  }, [currentRoom.photos, selectedObjects, initializeDefaultSelection]);

  // Fonction pour envoyer la demande de devis
  const handleSubmitQuote = async () => {
    if (!quoteFormData) {
      alert('Veuillez d\'abord remplir le formulaire de demande.');
      return;
    }

    setIsSubmittingQuote(true);
    
    try {
      // Simuler l'envoi (remplacer par un vrai appel API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Succès
      alert('✅ Demande de devis envoyée avec succès !\n\nNous vous contacterons dans les plus brefs délais pour finaliser votre devis personnalisé.');
      
      // Optionnel : réinitialiser l'application ou rediriger
      // setCurrentStep(1);
      // setCurrentRoom({ id: 'room-1', name: 'Pièce 1', photos: [] });
      // setQuoteFormData(null);
      
    } catch (error) {
      alert('❌ Erreur lors de l\'envoi de votre demande. Veuillez réessayer.');
      console.error('Erreur envoi devis:', error);
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Persistance automatique des données
  useEffect(() => {
    const saveData = () => {
      const dataToSave = {
        currentRoom,
        currentStep,
        quoteFormData,
        inventoryValidated,
        timestamp: Date.now()
      };
      localStorage.setItem('moverz_inventory_data', JSON.stringify(dataToSave));
    };

    // Sauvegarder toutes les 5 secondes
    const interval = setInterval(saveData, 5000);
    
    // Sauvegarder immédiatement
    saveData();

    return () => clearInterval(interval);
  }, [currentRoom, currentStep, quoteFormData, inventoryValidated]);

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    const savedData = localStorage.getItem('moverz_inventory_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        // Vérifier que les données ne sont pas trop anciennes (24h)
        if (data.timestamp && (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000) {
          if (data.currentRoom) setCurrentRoom(data.currentRoom);
          if (data.currentStep) setCurrentStep(data.currentStep);
          if (data.quoteFormData) setQuoteFormData(data.quoteFormData);
          if (data.inventoryValidated) setInventoryValidated(data.inventoryValidated);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données sauvegardées:', error);
      }
    }
  }, []);


  // Pas d'auto-avancement - l'utilisateur contrôle les étapes manuellement

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

  // Mettre à jour l'heure toutes les secondes (côté client uniquement)
  useEffect(() => {
    // Initialiser l'heure côté client
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fonction utilitaire pour arrondir les m³ à 2 chiffres avec arrondi supérieur
  const roundUpVolume = (volume: number): number => {
    return Math.ceil(volume * 100) / 100;
  };

  // Fonction pour générer un ID unique
  const generatePhotoId = () => {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Fonction pour changer le nom de la pièce
  const handleRoomNameChange = (newName: string) => {
    setCurrentRoom(prev => ({
      ...prev,
      name: newName || 'Pièce sans nom'
    }));
  };

  // Fonction de traitement asynchrone d'une photo
  const processPhotoAsync = async (photoIndex: number, file: File, photoId: string) => {
    try {
      // Vérifier si la photo est déjà en cours de traitement
      setCurrentRoom(prev => {
        const photo = prev.photos[photoIndex];
        if (!photo || photo.status === 'processing' || photo.status === 'completed') {
          console.log(`Photo ${photoIndex} déjà traitée ou en cours, ignorée`);
          return prev;
        }
        
        // Marquer comme en cours de traitement
        return {
          ...prev,
          photos: prev.photos.map((photo, idx) => 
            idx === photoIndex ? { 
              ...photo, 
              status: 'processing',
              progress: 10
            } : photo
          )
        };
      });

      // Simuler progression
      const progressInterval = setInterval(() => {
        setCurrentRoom(prev => ({
          ...prev,
          photos: prev.photos.map((photo, idx) => 
            idx === photoIndex ? { 
              ...photo, 
              progress: Math.min((photo.progress || 10) + Math.random() * 15, 90)
            } : photo
          )
        }));
      }, 1000);

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/photos/analyze", { method: "POST", body: fd });
      const result = await res.json();
      
      clearInterval(progressInterval);

      if (res.ok) {
        // Mettre à jour le nom de la pièce pour cette photo spécifique
        if (result.roomDetection?.roomType) {
          setCurrentRoom(prev => ({
            ...prev,
            photos: prev.photos.map((photo, idx) => 
              idx === photoIndex ? { 
                ...photo, 
                roomName: result.roomDetection.roomType
              } : photo
            )
          }));
          console.log(`Photo ${photoIndex}: pièce détectée = ${result.roomDetection.roomType}`);
        }

        // Marquer comme terminé avec le résultat et l'URL Base64
        setCurrentRoom(prev => ({
          ...prev,
          photos: prev.photos.map((photo, idx) => 
            idx === photoIndex ? { 
              ...photo, 
              status: 'completed', 
              analysis: result,
              fileUrl: result.file_url,
              progress: 100
            } : photo
          )
        }));
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      setCurrentRoom(prev => ({
        ...prev,
        photos: prev.photos.map((photo, idx) => 
          idx === photoIndex ? { 
            ...photo, 
            status: 'error', 
            error: errorMsg,
            progress: 0
          } : photo
        )
      }));
    }
  };

  // Fonctions pour le drag & drop
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 onFileSelect appelée', e.target.files);
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      console.log('📁 Fichiers sélectionnés:', files.length);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    console.log('🎯 handleFiles appelée avec', files.length, 'fichiers');
    
    // Vérifier la limite de 100 photos
    if (currentRoom.photos.length + files.length > 100) {
      alert(`Limite de 100 photos atteinte. Vous ne pouvez ajouter que ${100 - currentRoom.photos.length} photo(s) supplémentaire(s).`);
      return;
    }
    
    console.log('📸 Ajout des photos au state...');
    setLoading(true);
    
    // Initialiser les photos avec statut 'uploaded' immédiatement
    const newPhotos = files.map(file => {
      const photoId = generatePhotoId();
      return {
        file,
        fileUrl: URL.createObjectURL(file), // Créer l'URL immédiatement
        status: 'uploaded' as const,
        selectedItems: new Set<number>(),
        photoId,
        progress: 0
      };
    });
    
    setCurrentRoom(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
    
    // Traiter chaque photo en arrière-plan
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoIndex = currentRoom.photos.length + i;
      const photoId = newPhotos[i].photoId!;
      
      // Lancer le traitement asynchrone (ne pas attendre)
      // Utiliser setTimeout pour s'assurer que le state est mis à jour avant
      setTimeout(() => {
        processPhotoAsync(photoIndex, file, photoId);
      }, 100);
    }
    
    setLoading(false);
  };

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    
    // Vérifier la limite de 100 photos
    if (currentRoom.photos.length + files.length > 100) {
      alert(`Limite de 100 photos atteinte. Vous ne pouvez ajouter que ${100 - currentRoom.photos.length} photo(s) supplémentaire(s).`);
      return;
    }
    
    setLoading(true);
    
    // Initialiser les photos avec statut 'uploaded' immédiatement
    const newPhotos = files.map(file => {
      const photoId = generatePhotoId();
      return {
        file,
        fileUrl: URL.createObjectURL(file), // Créer l'URL immédiatement
        status: 'uploaded' as const,
        selectedItems: new Set<number>(),
        photoId,
        progress: 0
      };
    });
    
    setCurrentRoom(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
    
    // Ne pas basculer automatiquement - l'utilisateur peut rester sur l'onglet upload
    
    // Traiter chaque photo en arrière-plan
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoId = newPhotos[i].photoId!;
      
      // Lancer le traitement asynchrone avec l'index correct
      setTimeout(() => {
        // Trouver l'index de la photo dans le state mis à jour
        setCurrentRoom(prev => {
          const photoIndex = prev.photos.findIndex(photo => photo.photoId === photoId);
          if (photoIndex !== -1) {
            processPhotoAsync(photoIndex, file, photoId);
          }
          return prev;
        });
      }, 100);
    }
    
    setLoading(false);
  }


  const totalVolumeSelected = useMemo(() => {
    let totalVolume = 0;
    let totalItems = 0;

    currentRoom.photos.forEach(photo => {
      if (photo.status === 'completed' && photo.analysis?.items) {
        // Objets normaux
        photo.analysis.items.forEach((item: TInventoryItem, itemIndex: number) => {
          // Vérifier si l'objet est sélectionné
          // Par défaut, si le Set est vide, tous les objets sont sélectionnés
          const isSelected = photo.selectedItems.size === 0 || photo.selectedItems.has(itemIndex);
          if (isSelected) {
            totalVolume += (item.volume_m3 || 0) * (item.quantity || 1);
            totalItems += item.quantity || 1;
          }
        });
        
        // Autres objets (toujours sélectionnés par défaut)
        if (photo.analysis.special_rules?.autres_objets?.present) {
          totalVolume += photo.analysis.special_rules.autres_objets.volume_m3 || 0;
          totalItems += photo.analysis.special_rules.autres_objets.listed_items?.length || 0;
        }
      }
    });

    return { totalVolume: roundUpVolume(totalVolume), totalItems };
  }, [currentRoom.photos]);

  const toggleItemSelection = (photoIndex: number, itemIndex: number) => {
    setCurrentRoom(prev => ({
      ...prev,
      photos: prev.photos.map((photo, idx) => {
        if (idx === photoIndex) {
          const selectedItems = new Set(photo.selectedItems);
          if (selectedItems.has(itemIndex)) {
            selectedItems.delete(itemIndex);
          } else {
            selectedItems.add(itemIndex);
          }
          return { ...photo, selectedItems };
        }
        return photo;
      })
    }));
  };

  const selectAllItems = (photoIndex: number) => {
    setCurrentRoom(prev => ({
      ...prev,
      photos: prev.photos.map((photo, idx) => {
        if (idx === photoIndex && photo.analysis?.items) {
          const selectedItems = new Set(Array.from({ length: photo.analysis.items.length }, (_, i) => i));
          return { ...photo, selectedItems };
        }
        return photo;
      })
    }));
  };

  const deselectAllItems = (photoIndex: number) => {
    setCurrentRoom(prev => ({
      ...prev,
      photos: prev.photos.map((photo, idx) => {
        if (idx === photoIndex) {
          return { ...photo, selectedItems: new Set() };
        }
        return photo;
      })
    }));
  };

  const clearAnalysisCache = () => {
    clearCache();
    alert('Cache vidé ! Les prochaines analyses seront refaites.');
  };

  // Fonction pour supprimer une photo
  const deletePhoto = (photoIndex: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      setCurrentRoom(prev => ({
        ...prev,
        photos: prev.photos.filter((_, index) => index !== photoIndex)
      }));
    }
  };

  // Fonction pour réessayer l'analyse d'une photo
  const retryPhotoAnalysis = (photoIndex: number) => {
    const photo = currentRoom.photos[photoIndex];
    if (photo && photo.photoId) {
      processPhotoAsync(photoIndex, photo.file, photo.photoId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return '📤';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'text-blue-500';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const translateCategory = (category: string) => {
    switch (category) {
      case 'furniture': return 'Meuble';
      case 'appliance': return 'Électroménager';
      case 'box': return 'Carton';
      case 'art': return 'Art';
      case 'misc': return 'Divers';
      default: return category;
    }
  };

  // Fonction utilitaire pour vérifier si un objet est sélectionné
  const isItemSelected = (photo: RoomData['photos'][0], itemIndex: number): boolean => {
    return photo.selectedItems.size === 0 || photo.selectedItems.has(itemIndex);
  };

  // Fonction utilitaire pour générer les notes enrichies
  const getEnrichedNotes = (item: TInventoryItem): string => {
    let notes = item.notes || '';
    if (item.fragile && !notes.toLowerCase().includes('fragile')) {
      notes = notes ? `${notes} | Fragile !` : 'Fragile !';
    }
    return notes;
  };

  const enrichDescription = (item: TInventoryItem) => {
    let description = item.label;
    
    // Ajouter des détails selon la catégorie
    if (item.category === 'furniture') {
      if (item.label.toLowerCase().includes('fauteuil')) {
        description += ' (siège rembourré)';
      } else if (item.label.toLowerCase().includes('table')) {
        description += ' (surface plane)';
      } else if (item.label.toLowerCase().includes('lit')) {
        description += ' (meuble de couchage)';
      }
    } else if (item.category === 'appliance') {
      description += ' (appareil électrique)';
    } else if (item.category === 'art') {
      description += ' (œuvre d\'art)';
    }
    
    return description;
  };

  const renderTestsInterface = () => (
    <>

        {/* Étape 2 - Valider l'inventaire */}
        {currentStep === 2 && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              

              <div className="p-6">
                {currentRoom.photos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune photo chargée</h4>
                    <p className="text-gray-600 mb-4">Retournez à l'étape précédente pour charger des photos.</p>
                      <button
                      onClick={() => setCurrentStep(1)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Retour aux photos
                      </button>
                    </div>
                ) : (
                  <div className="space-y-6">
                    {/* Liste des photos avec leurs objets */}
                        {currentRoom.photos.map((photo, photoIndex) => (
                      <div key={photoIndex} className="bg-gray-50 rounded-xl p-6">
                        <div className="flex items-start space-x-6">
                          {/* Photo plus grande à gauche */}
                          <div className="flex-shrink-0">
                              <img
                                src={photo.fileUrl || URL.createObjectURL(photo.file)}
                                alt={`Photo ${photoIndex + 1}`}
                              className="w-64 h-64 object-cover rounded-lg shadow-sm"
                              />
                            </div>
                            
                          {/* Contenu à droite */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-medium text-gray-900">
                                {photo.roomName || `Photo ${photoIndex + 1}`}
                              </h4>
                            <button
                              onClick={() => deletePhoto(photoIndex)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Supprimer cette photo"
                            >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                            </button>
                            </div>
                            
                            {/* Inventaire simplifié par blocs */}
                            {photo.analysis?.items && photo.analysis.items.length > 0 ? (
                              <div className="space-y-6">
                                {/* Séparer les objets volumineux et petits objets */}
                                {(() => {
                                  const grosObjets = photo.analysis.items.filter((item: any) => !item.is_small_object);
                                  const petitsObjets = photo.analysis.items.filter((item: any) => item.is_small_object);
                                  
                                  return (
                                    <>
                                      {/* Bloc Objets volumineux */}
                                      {grosObjets.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                              <h4 className="text-sm font-semibold text-gray-900">🏠 Objets volumineux</h4>
                                              <div className="flex space-x-2">
                                <button
                                                  onClick={() => {
                                                    // Sélectionner tous les gros objets
                                                    grosObjets.forEach((_: any, index: number) => {
                                                      const originalIndex = photo.analysis.items.findIndex((item: any) => item === grosObjets[index]);
                                                      if (!isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex)) {
                                                        toggleObjectSelection(photo.photoId || `photo-${photoIndex}`, originalIndex);
                                                      }
                                                    });
                                                  }}
                                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                  Tout sélectionner
                                                </button>
                                                <span className="text-gray-300">|</span>
                                                <button
                                                  onClick={() => {
                                                    // Désélectionner tous les gros objets
                                                    grosObjets.forEach((_: any, index: number) => {
                                                      const originalIndex = photo.analysis.items.findIndex((item: any) => item === grosObjets[index]);
                                                      if (isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex)) {
                                                        toggleObjectSelection(photo.photoId || `photo-${photoIndex}`, originalIndex);
                                                      }
                                                    });
                                                  }}
                                                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                                >
                                                  Tout désélectionner
                                </button>
                              </div>
                                            </div>
                                          </div>
                                          <div className="divide-y divide-gray-200">
                                            {grosObjets.map((item: any, itemIndex: number) => {
                                              const originalIndex = photo.analysis.items.findIndex((originalItem: any) => originalItem === item);
                                              return (
                                              <div key={itemIndex} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-3">
                                                    {/* Checkbox de sélection */}
                                                    <input
                                                      type="checkbox"
                                                      checked={isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex)}
                                                      onChange={(e) => {
                                                        e.stopPropagation();
                                                        toggleObjectSelection(photo.photoId || `photo-${photoIndex}`, originalIndex);
                                                      }}
                                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                      title={isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex) ? "Désélectionner cet objet" : "Sélectionner cet objet"}
                                                    />
                                                    <span className={`text-sm font-medium ${isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex) ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                                      {item.label}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{item.volume_m3}m³</span>
                                                    <DismountableToggle
                                                      item={item}
                                                      onToggle={(isDismountable) => 
                                                        handleDismountableToggle(photo.photoId || `photo-${photoIndex}`, originalIndex, isDismountable)
                                                      }
                                                      className="ml-2"
                                                    />
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    {item.packaging_display && (
                                                      <span 
                                                        className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full cursor-help hover:bg-blue-100 transition-colors"
                                                        title={getPackagingDetails(item)}
                                                      >
                                                        📦 {item.packaging_display}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <button
                                                    onClick={() => {
                                                      // TODO: Implémenter l'édition de description
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Modifier la description"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                  </button>
                      </div>
                    </div>
                                              );
                                            })}
                                          </div>
                </div>
              )}

                                      {/* Bloc Petits objets */}
                                      {petitsObjets.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                          <div 
                                            className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => setIsSmallObjectsExpanded(!isSmallObjectsExpanded)}
                                          >
                                            <div className="flex items-center justify-between">
                                              <h4 className="text-sm font-semibold text-gray-900">
                                                📦 Petits objets (cartons) - {Math.ceil(petitsObjets.reduce((total: number, item: any) => total + (item.packaged_volume_m3 || 0), 0) / 0.06)} cartons
                                              </h4>
                                              <div className="flex items-center space-x-3">
                                                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                                                    onClick={() => {
                                                      // Sélectionner tous les petits objets
                                                      petitsObjets.forEach((_: any, index: number) => {
                                                        const originalIndex = photo.analysis.items.findIndex((item: any) => item === petitsObjets[index]);
                                                        if (!isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex)) {
                                                          toggleObjectSelection(photo.photoId || `photo-${photoIndex}`, originalIndex);
                                                        }
                                                      });
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                  >
                                                    Tout sélectionner
                    </button>
                                                  <span className="text-gray-300">|</span>
                    <button
                                                    onClick={() => {
                                                      // Désélectionner tous les petits objets
                                                      petitsObjets.forEach((_: any, index: number) => {
                                                        const originalIndex = photo.analysis.items.findIndex((item: any) => item === petitsObjets[index]);
                                                        if (isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex)) {
                                                          toggleObjectSelection(photo.photoId || `photo-${photoIndex}`, originalIndex);
                                                        }
                                                      });
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                                  >
                                                    Tout désélectionner
                    </button>
                  </div>
                                                <svg 
                                                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isSmallObjectsExpanded ? 'rotate-180' : ''}`} 
                                                  fill="none" 
                                                  stroke="currentColor" 
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                              </div>
                                </div>
                              </div>
                              
                                          <AnimatePresence>
                                            {isSmallObjectsExpanded && (
                                              <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                              >
                                                <div className="divide-y divide-gray-200">
                                                  {petitsObjets.map((item: any, itemIndex: number) => {
                                                    const originalIndex = photo.analysis.items.findIndex((originalItem: any) => originalItem === item);
                                                    return (
                                                    <div key={itemIndex} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                          {/* Checkbox de sélection */}
                                                          <input
                                                            type="checkbox"
                                                            checked={isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex)}
                                                            onChange={(e) => {
                                                              e.stopPropagation();
                                                              toggleObjectSelection(photo.photoId || `photo-${photoIndex}`, originalIndex);
                                                            }}
                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                            title={isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex) ? "Désélectionner cet objet" : "Sélectionner cet objet"}
                                                          />
                                                          <span className={`text-sm font-medium ${isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex) ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                                            {item.label}
                                      </span>
                                                          <span className="text-xs text-gray-500">{item.volume_m3}m³</span>
                                                          <DismountableToggle
                                                            item={item}
                                                            onToggle={(isDismountable) => 
                                                              handleDismountableToggle(photo.photoId || `photo-${photoIndex}`, originalIndex, isDismountable)
                                                            }
                                                            className="ml-2"
                                                          />
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                          {item.packaging_display && (
                                                            <span 
                                                              className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full cursor-help hover:bg-green-100 transition-colors"
                                                              title={getPackagingDetails(item)}
                                                            >
                                                              📦 {item.packaging_display}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <button
                                                          onClick={() => {
                                                            // TODO: Implémenter l'édition de description
                                                          }}
                                                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                          title="Modifier la description"
                                                        >
                                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                          </svg>
                                                        </button>
                                    </div>
                                  </div>
                                                    );
                                                  })}
                              </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                            </div>
                                      )}
                                    </>
                                  );
                                })()}
                      </div>
                    ) : (
                              <div className="text-sm text-gray-500">
                                {photo.status === 'processing' ? 'Analyse en cours...' : 'Aucun objet détecté'}
                      </div>
                    )}
                  </div>
                </div>
                      </div>
                    ))}

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 - Préparer la demande */}
        {currentStep === 3 && (
          <QuoteForm 
            onNext={handleQuoteFormNext}
            onPrevious={handleQuoteFormPrevious}
            initialData={quoteFormData}
          />
        )}




        {/* Étape 1 - Charger des photos */}
        {currentStep === 1 && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              

              <div className="p-6">
                {/* Zone d'upload principale (visible seulement si aucune photo) */}
                <AnimatePresence>
                  {currentRoom.photos.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onClick={() => {
                        console.log('🎯 Zone drag & drop cliquée');
                        fileInputRef.current?.click();
                      }}
                      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                        isDragOver
                          ? 'border-blue-400 bg-blue-50 scale-[1.02]'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
            </div>
                        
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          Ajoutez vos photos d'inventaire
                        </h4>
                        <p className="text-gray-600 mb-6">
                          Glissez-déposez vos photos ici ou cliquez pour sélectionner.<br />
                          <span className="text-sm text-gray-500">Formats acceptés : JPG, PNG, WEBP, HEIC</span>
                        </p>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={onFileSelect}
                          multiple
                          accept="image/*,.heic,.heif"
                          className="hidden"
                        />
              <button
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher la propagation vers la zone drag & drop
                            fileInputRef.current?.click();
                          }}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Sélectionner des photos
              </button>
            </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Grille des photos */}
                <AnimatePresence>
                  {currentRoom.photos.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      {/* Bouton d'ajout compact */}
              <div className="flex justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher la propagation vers la zone drag & drop
                            fileInputRef.current?.click();
                          }}
                          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Ajouter des photos
                        </motion.button>
                <input 
                  type="file" 
                          ref={fileInputRef}
                          onChange={onFileSelect}
                  multiple 
                            accept="image/*,.heic,.heif"
                          className="hidden"
                        />
          </div>

                      {/* Grille responsive */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        <AnimatePresence>
                {currentRoom.photos.map((photo, photoIndex) => (
                            <motion.div 
                              key={photoIndex}
                              initial={{ opacity: 0, scale: 0.8, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: -20 }}
                              transition={{ 
                                duration: 0.3, 
                                ease: "easeOut",
                                delay: photoIndex * 0.05 
                              }}
                              layout
                              className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                            >
                              {/* Image */}
                              <div className="aspect-square bg-gray-100 relative">
                                <img
                                  src={photo.fileUrl || URL.createObjectURL(photo.file)}
                        alt={`Photo ${photoIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                                
                                {/* Overlay de chargement */}
                    {photo.status === 'processing' && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="text-center text-white">
                                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                      <div className="text-xs">Analyse...</div>
                                    </div>
                      </div>
                    )}
                    
                                {/* Overlay d'erreur */}
                    {photo.status === 'error' && (
                                  <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
                                    <div className="text-center text-white p-2">
                                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <div className="text-xs">Erreur</div>
              </div>
            </div>
          )}
        </div>
                              
                              {/* Statut et actions */}
                              <div className="p-3">
                                {/* Statut */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    {photo.status === 'uploaded' && (
                                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                    )}
                                    {photo.status === 'processing' && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    )}
                                    {photo.status === 'completed' && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    )}
                                    {photo.status === 'error' && (
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    )}
                                    <span className="text-xs font-medium text-gray-600">
                                      {photo.status === 'uploaded' && 'En attente'}
                                      {photo.status === 'processing' && 'Analyse...'}
                                      {photo.status === 'completed' && 'Terminé'}
                                      {photo.status === 'error' && 'Erreur'}
                                    </span>
                                  </div>
                                  
                                  {/* Bouton de suppression */}
            <button
                                    onClick={() => deletePhoto(photoIndex)}
                                    className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200"
                                    title="Supprimer cette photo"
            >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
            </button>
          </div>

                                {/* Barre de progression */}
                          {photo.status === 'processing' && (
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" 
                                style={{ width: `${photo.progress || 0}%` }}
                                    />
                            </div>
                          )}
                          
                                {/* Bouton de retry pour les erreurs */}
                                {photo.status === 'error' && (
                            <button
                                    onClick={() => retryPhotoAnalysis(photoIndex)}
                                    className="w-full mt-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                            >
                                    Réessayer
                            </button>
                      )}
                    </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                                        </div>

                      {/* Bouton continuer */}
                      <div className="text-center">
                        <p className="text-sm text-blue-600 mb-4">
                          {currentRoom.photos.length}/100 photos chargées
                        </p>
                            {/* Bouton supprimé - maintenant géré par le bouton en haut */}
                        </div>
                    </motion.div>
                      )}
                </AnimatePresence>
                                    </div>
                                  </div>
                                  </div>
        )}

        {/* Navigation entre étapes - structure identique au bouton du haut */}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="flex justify-between items-center">
            {/* Bouton Précédent - à gauche */}
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
              >
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Précédent
              </button>
            ) : (
              <div></div>
            )}
            
            {/* Bouton Étape suivante - EXACTEMENT identique au bouton du haut */}
            {currentStep < 4 ? (
                            <button
                onClick={() => {
                  console.log('🎯 Bouton "Étape suivante" cliqué, passage à l\'étape', currentStep + 1);
                  setCurrentStep(currentStep + 1);
                }}
                disabled={
                  (currentStep === 1 && currentRoom.photos.length === 0) ||
                  (currentStep === 2 && !currentRoom.photos.some(p => p.status === 'completed')) ||
                  (currentStep === 3 && !quoteFormData)
                }
                className="inline-flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-50"
              >
                Étape suivante
                <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                            </button>
            ) : (
              <div></div>
                    )}
                  </div>
                </div>

        {/* Étape 4 - Envoyer mon dossier gratuitement */}
        {currentStep === 4 && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Envoyer mon dossier gratuitement</h3>
                    <p className="text-sm text-gray-600">
                      Téléchargez votre inventaire ou envoyez-le par email
                    </p>
              </div>
                </div>
              </div>

              <div className="p-6">
                {/* Résumé des volumes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Volume brut */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Volume brut</h4>
                        <p className="text-sm text-gray-600">Volume total des objets</p>
                    </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const totalVolume = currentRoom.photos
                          .filter(p => p.analysis?.items)
                          .reduce((sum, photo) => 
                            sum + (photo.analysis?.items?.reduce((itemSum: number, item: any) => itemSum + item.volume_m3, 0) || 0), 0);
                        return `${totalVolume.toFixed(1)} m³`;
                      })()}
                    </div>
                    </div>

                  {/* Volume emballé */}
                  <div className="bg-orange-50 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Volume emballé</h4>
                        <p className="text-sm text-gray-600">Avec emballage et cartons</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {(() => {
                        const totalPackagedVolume = currentRoom.photos
                          .filter(p => p.analysis?.items)
                          .reduce((sum, photo) => 
                            sum + (photo.analysis?.items?.reduce((itemSum: number, item: any) => itemSum + (item.packaged_volume_m3 || item.volume_m3), 0) || 0), 0);
                        return `${totalPackagedVolume.toFixed(1)} m³`;
                      })()}
                  </div>
                  </div>
              </div>
              
                {/* Récapitulatif des informations */}
                {quoteFormData && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Récapitulatif de votre demande
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                        <h5 className="font-semibold text-gray-700 mb-3">👤 Informations personnelles</h5>
                        <div className="space-y-2 text-gray-600">
                          <p><span className="font-medium">Nom :</span> {quoteFormData.firstName} {quoteFormData.lastName}</p>
                          <p><span className="font-medium">Email :</span> {quoteFormData.email}</p>
                          <p><span className="font-medium">Téléphone :</span> {quoteFormData.phone}</p>
                    </div>
                    </div>
                      
                    <div>
                        <h5 className="font-semibold text-gray-700 mb-3">🏠 Détails du déménagement</h5>
                        <div className="space-y-2 text-gray-600">
                          <p><span className="font-medium">Départ :</span> {quoteFormData.departureCity} ({quoteFormData.departurePostalCode})</p>
                          <p><span className="font-medium">Arrivée :</span> {quoteFormData.arrivalCity} ({quoteFormData.arrivalPostalCode})</p>
                          <p><span className="font-medium">Date :</span> {quoteFormData.movingDate}</p>
                          <p><span className="font-medium">Formule :</span> <span className="capitalize">{quoteFormData.selectedOffer}</span></p>
                    </div>
                  </div>
                  </div>
                </div>
              )}
              
                {/* Options d'export et d'envoi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Téléchargement */}
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Télécharger votre dossier</h4>
                    <p className="text-gray-600 mb-4">Obtenez votre inventaire dans différents formats</p>
                    <div className="space-y-2">
                <button
                        onClick={() => {
                          // TODO: Implémenter l'export CSV
                          alert('Export CSV à implémenter');
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        📊 Télécharger en CSV
                </button>
                      <button
                        onClick={() => {
                          // TODO: Implémenter l'export Excel
                          alert('Export Excel à implémenter');
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        📋 Télécharger en Excel
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implémenter l'export PDF
                          alert('Export PDF à implémenter');
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        📄 Télécharger en PDF
                      </button>
                    </div>
                  </div>

                  {/* Envoi par email */}
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                    <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Envoyer par email</h4>
                    <p className="text-gray-600 mb-4">Recevez votre dossier directement par email</p>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Votre adresse email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                <button
                        onClick={() => {
                          // TODO: Implémenter l'envoi par email
                          alert('Envoi par email à implémenter');
                        }}
                        className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        📧 Envoyer par email
                </button>
                    </div>
                  </div>
                </div>

                {/* Message final */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center px-6 py-3 bg-green-50 text-green-700 rounded-xl">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Votre inventaire est prêt ! Vous pouvez maintenant demander des devis.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );

  return (
    <main className={`min-h-screen ${isEmbedded ? 'iframe-mode' : 'bg-[var(--mz-bg)]'}`}>
      {/* Header moderne - seulement si pas en mode embed */}
      {!isEmbedded && (
        <div className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--mz-teal)] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Analyse automatique pour déménagement
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {getBuildInfo()}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">
                      Last update: {currentTime ? currentTime.toLocaleTimeString('fr-FR') : '--:--:--'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === 'tests' 
                      ? 'bg-[var(--mz-teal)] text-white shadow-lg' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  🧪 Tests
                </button>
                <button
                  onClick={() => setActiveTab('backoffice')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === 'backoffice' 
                      ? 'bg-[var(--mz-teal)] text-white shadow-lg' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  🔧 Back-office
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation par onglets - seulement si pas en mode embed */}
      {!isEmbedded && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex space-x-4 lg:space-x-8">
              <button
                onClick={() => setActiveTab('tests')}
                className={`py-3 lg:py-4 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'tests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🧪 Tests
              </button>
              <button
                onClick={() => setActiveTab('backoffice')}
                className={`py-3 lg:py-4 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'backoffice'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔧 Back-office
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Étapes du workflow - seulement si pas en mode embed et onglet tests */}
      {!isEmbedded && activeTab === 'tests' && (
        <>
        <WorkflowSteps 
          currentStep={currentStep}
          onStepChange={handleStepChange}
          steps={workflowSteps}
        />
          
          {/* Boutons de navigation en haut */}
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-4xl mx-auto px-4 py-2">
              <div className="flex justify-between">
                {/* Bouton Précédent - à gauche */}
                {currentStep > 1 ? (
                  <button
                    onClick={() => {
                      console.log('🎯 Bouton "Précédent" cliqué, retour à l\'étape', currentStep - 1);
                      setCurrentStep(currentStep - 1);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                  >
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Précédent
                  </button>
                ) : (
                  <div></div>
                )}
                
                {/* Bouton Étape suivante - à droite */}
                {currentStep < 4 && (
                  <button
                    onClick={() => {
                      console.log('🎯 Bouton "Étape suivante" cliqué, passage à l\'étape', currentStep + 1);
                      setCurrentStep(currentStep + 1);
                    }}
                    disabled={
                      (currentStep === 1 && currentRoom.photos.length === 0) ||
                      (currentStep === 2 && !currentRoom.photos.some(p => p.status === 'completed')) ||
                      (currentStep === 3 && !quoteFormData)
                    }
                    className="inline-flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-50"
                  >
                    Étape suivante
                    <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contenu selon l'onglet actif */}
      <div className={`${isEmbedded ? 'p-4' : 'p-6'} max-w-7xl mx-auto`}>
        {isEmbedded ? renderTestsInterface() : (activeTab === 'tests' ? renderTestsInterface() : <BackOffice />)}
      </div>
    </main>
  );
}