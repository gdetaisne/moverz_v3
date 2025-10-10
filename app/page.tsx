"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BackOffice from "@ui/BackOffice";
import WorkflowSteps from "@ui/WorkflowSteps";
import QuoteForm from "@/components/QuoteForm";
import DismountableToggle from "@ui/DismountableToggle";
import FragileToggle from "@ui/FragileToggle";
import ContinuationModal from "@ui/ContinuationModal";
import { PhotoCard } from "@ui/PhotoCard";
import { InventoryItemCard } from "@ui/InventoryItemCard";
import { InventorySummaryCard } from "@ui/InventorySummaryCard";
import { PhotoUploadZone } from "@ui/PhotoUploadZone";
import { RoomValidationStepV2 } from "@/components/RoomValidationStepV2";
import { Step2RoomInventory } from "@/components/Step2RoomInventory";
import { RoomInventoryCard } from "@ui/RoomInventoryCard";
import { RoomPhotoCarousel } from "@ui/RoomPhotoCarousel";
import { useInventoryCalculations } from "@/hooks/useInventoryCalculations";
import { useWorkflowSteps } from "@/hooks/useWorkflowSteps";
import { getBuildInfo } from "@core/buildInfo";
import { TInventoryItem } from "@core/schemas";
import { clearCache } from "@core/cache";
import { calculatePackagedVolume } from "@core/packaging";
import { userSession } from "@core/auth-client";
import { createUserStorage, StorageCleanup } from "@core/user-storage";
// 🎯 SUPPRIMÉ : Plus de détection de doublons avec la nouvelle logique par pièce

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
    roomType?: string; // Type de pièce détecté par l'IA
    roomConfidence?: number; // Confiance de la détection de pièce
    userId?: string; // ID de l'utilisateur propriétaire
  }[];
}


export default function Home() {
  // Gestion des sessions utilisateur
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userStorage, setUserStorage] = useState<any>(null);
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
  const [roomGroups, setRoomGroups] = useState<any[]>([]);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSmallObjectsExpanded, setIsSmallObjectsExpanded] = useState(false);
  const [isMeublesExpanded, setIsMeublesExpanded] = useState(false);
  const [isMobilierFragileExpanded, setIsMobilierFragileExpanded] = useState(false);
  const [isCategoryDetailsExpanded, setIsCategoryDetailsExpanded] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<Map<string, Set<number>>>(new Map()); // photoId -> Set<itemIndex>
  const [showContinuationModal, setShowContinuationModal] = useState(false);
  const [hasShownContinuationModal, setHasShownContinuationModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialisation du système d'authentification
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Nettoyer les anciennes données localStorage
        StorageCleanup.clearLegacyData();
        
        // Initialiser la session utilisateur
        const userId = userSession.getCurrentUserId();
        const storage = createUserStorage(userId);
        
        setCurrentUserId(userId);
        setUserStorage(storage);
        
        console.log(`🔐 Session initialisée: ${userId}`);
        
        // Charger les données sauvegardées pour cet utilisateur
        const savedData = storage.loadInventoryData();
        if (savedData) {
          console.log('📥 Données utilisateur chargées depuis localStorage');
          // TODO: Restaurer les données si nécessaire
        }
        
      } catch (error) {
        console.error('❌ Erreur initialisation auth:', error);
      }
    };
    
    initializeAuth();
  }, []);

  // Configuration des étapes du workflow
  // Une étape n'est "terminée" que si on est passé à l'étape suivante
  const isStep1Completed = currentStep > 1 && currentRoom.photos.length > 0;
  const isStep2Completed = currentStep > 2 && roomGroups.length > 0; // Validation des pièces
  const isStep3Completed = currentStep > 3 && currentRoom.photos.some(p => p.analysis?.items && p.analysis.items.length > 0);
  const isStep4Completed = currentStep > 4 && quoteFormData !== null;
  const isStep5Completed = false; // Toujours false car c'est la dernière étape
  
  // Les workflowSteps sont maintenant gérés par le hook useWorkflowSteps

  // Fonction pour changer d'étape
  const handleStepChange = (step: number) => {
    console.log('🎯 handleStepChange appelée avec étape:', step);
    setCurrentStep(step);
  };

  // Fonction pour gérer la validation des pièces
  const handleRoomValidationComplete = useCallback((validatedRoomGroups: any[]) => {
    console.log('🏠 Validation des pièces terminée:', validatedRoomGroups);
    setRoomGroups(validatedRoomGroups);
    setCurrentStep(3); // Passer à l'étape 3 (Valider l'inventaire)
  }, []);

  // Fonction pour charger les roomGroups depuis l'API
  const loadRoomGroupsFromAPI = useCallback(async () => {
    if (!currentUserId) {
      console.log('⏳ Attente de l\'initialisation de l\'utilisateur...');
      return;
    }
    
    try {
      console.log(`🔄 Chargement des roomGroups depuis l'API pour ${currentUserId}...`);
      const { apiGet } = await import('@/lib/apiClient');
      const roomGroups = await apiGet(`/api/room-groups?userId=${currentUserId}`);
      
      if (roomGroups) {
        console.log(`✅ RoomGroups chargés: ${roomGroups.length} pièces`);
        setRoomGroups(roomGroups);
        
        // Note: Passage automatique désactivé pour permettre à l'utilisateur de contrôler la navigation
        // if (roomGroups.length > 0 && currentStep === 1) {
        //   console.log('🚀 Passage automatique à l\'étape 2 (Inventaire par Pièce)');
        //   setCurrentStep(2);
        // }
      } else {
        console.error('❌ Erreur lors du chargement des roomGroups:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des roomGroups:', error);
    }
  }, [currentUserId]); // Retirer currentStep pour éviter la boucle

  // Fonction pour recharger les photos depuis la base de données
  const handlePhotosUpdated = useCallback((updatedPhotos: any[]) => {
    console.log('🔄 [handlePhotosUpdated] Mise à jour des photos:', updatedPhotos.length);
    
    // Vérifier que les photos ont des analyses
    const photosWithAnalysis = updatedPhotos.filter(p => p.analysis && p.analysis.items && p.analysis.items.length > 0);
    console.log(`📊 Photos avec analyse: ${photosWithAnalysis.length}/${updatedPhotos.length}`);
    
    setCurrentRoom(prev => ({
      ...prev,
      photos: updatedPhotos
    }));
    
    // Recalculer les groupes de pièces à partir des photos mises à jour
    const newRoomGroups = updatedPhotos.reduce((groups: any[], photo) => {
      const roomType = photo.roomType || photo.roomName || 'unknown';
      let group = groups.find(g => g.roomType === roomType);
      
      if (!group) {
        group = {
          id: `room-${roomType}`,
          roomType,
          photos: []
        };
        groups.push(group);
      }
      
      group.photos.push(photo);
      return groups;
    }, []);
    
    console.log('🔄 Groupes de pièces recalculés:', newRoomGroups.length);
    newRoomGroups.forEach(group => {
      const itemsCount = group.photos.flatMap((p: any) => p.analysis?.items || []).length;
      console.log(`  - ${group.roomType}: ${group.photos.length} photos, ${itemsCount} objets`);
    });
    
    setRoomGroups(newRoomGroups);
  }, []);

  // Fonction de test pour recharger les photos manuellement
  const handleTestReloadPhotos = useCallback(async () => {
    if (!currentUserId) {
      console.log('⏳ Attente de l\'initialisation de l\'utilisateur...');
      return;
    }
    
    try {
      console.log(`🧪 Test rechargement photos pour ${currentUserId}...`);
      const { apiFetch } = await import('@/lib/apiClient');
      const photos = await apiFetch('/api/photos', {
        headers: { 'x-user-id': currentUserId }
      });
      if (photos) {
        console.log('🧪 Photos récupérées:', photos.length);
        handlePhotosUpdated(photos);
      }
    } catch (error) {
      console.error('❌ Erreur test rechargement:', error);
    }
  }, [currentUserId, handlePhotosUpdated]);

  const handleRoomValidationPrevious = useCallback(() => {
    setCurrentStep(1); // Retourner à l'étape 1 (Charger des photos)
  }, []);

  // Fonctions pour gérer le formulaire (mémorisées pour éviter les re-rendus)
  const handleQuoteFormNext = useCallback((formData: any) => {
    console.log('🎯 [PARENT] handleQuoteFormNext appelée avec:', formData);
    setQuoteFormData(formData);
    // Passer à l'étape suivante (étape 5 - Synthèse et envoi du devis)
    console.log('📈 [PARENT] Passage à l\'étape 5');
    setCurrentStep(5);
    console.log('✅ [PARENT] currentStep mis à jour');
  }, []);

  const handleQuoteFormPrevious = useCallback(() => {
    // Retourner à l'étape précédente (étape 3 - Valider l'inventaire par pièce)
    setCurrentStep(3);
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

  // Fonction pour gérer le toggle de fragilité
  const handleFragileToggle = useCallback((photoId: string, itemIndex: number, isFragile: boolean) => {
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
                  // Mettre à jour le statut fragile
                  const updatedItem = {
                    ...item,
                    fragile: isFragile
                  };
                  
                  // Recalculer le volume emballé avec la nouvelle fragilité
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

  // Fonction helper pour convertir une image URL en base64
  const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erreur conversion image en base64:', error);
      return '';
    }
  };

  // Fonction pour télécharger le PDF
  const handleDownloadPDF = useCallback(async () => {
    try {
      setLoading(true);
      
      // Détecter le nom réel de la pièce depuis les photos
      const detectedRoomName = currentRoom.photos.find(photo => photo.roomName)?.roomName || 'Pièce';
      
      // Convertir les photos en base64
      const photosWithBase64 = await Promise.all(
        currentRoom.photos
          .filter(photo => photo.status === 'completed' && photo.analysis?.items)
          .map(async (photo) => {
            const photoData = photo.fileUrl ? await convertImageToBase64(photo.fileUrl) : '';
            return {
              ...photo,
              photoDataBase64: photoData
            };
          })
      );
      
      // Préparer les données des pièces avec les items sélectionnés
      const rooms = [{
        id: currentRoom.id,
        name: detectedRoomName,
        photos: photosWithBase64
          .map(photo => ({
            fileUrl: photo.fileUrl,
            photoData: photo.photoDataBase64, // Image en base64
            items: photo.analysis.items
              .map((item: any, idx: number) => {
                if (isObjectSelected(photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`, idx)) {
                  return {
                    label: item.label,
                    category: item.category,
                    quantity: item.quantity || 1,
                    dimensions_cm: item.dimensions_cm,
                    volume_m3: item.volume_m3 || 0,
                    fragile: item.fragile || false,
                    dismountable: item.dismountable || false,
                    notes: item.notes,
                  };
                }
                return null;
              })
              .filter((item: any) => item !== null),
          }))
          .filter(photo => photo.items.length > 0),
      }];

      // Appeler l'API pour générer le PDF
      const { apiPost } = await import('@/lib/apiClient');
      const pdfBlob = await apiPost<Blob>('/api/pdf/generate', {
        formData: quoteFormData,
        rooms: rooms,
      });

      // Télécharger le PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-demenagement-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ PDF téléchargé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [currentRoom, quoteFormData, isObjectSelected]);

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

  // Afficher le modal de continuation quand on arrive sur l'étape 3
  useEffect(() => {
    if (currentStep === 3 && currentRoom.photos.length > 0 && !hasShownContinuationModal) {
      // Afficher le modal après 5 secondes
      const timer = setTimeout(() => {
        setShowContinuationModal(true);
        setHasShownContinuationModal(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, currentRoom.photos.length, hasShownContinuationModal]);

  // Handler pour envoyer l'email de continuation
  const handleSendContinuationLink = async (email: string) => {
    try {
      const { apiPost } = await import('@/lib/apiClient');
      const data = await apiPost('/api/send-continuation-link', { email });
      console.log('✅ Lien de continuation envoyé:', data);

      // En dev, logger l'URL debug
      if (data.debugUrl) {
        console.log('🔗 URL debug:', data.debugUrl);
      }
    } catch (error) {
      console.error('❌ Erreur envoi lien:', error);
      throw error;
    }
  };

  // Persistance automatique des données (nouveau système)
  useEffect(() => {
    if (!userStorage) return;
    
    const saveData = () => {
      const dataToSave = {
        currentRoom,
        currentStep,
        quoteFormData,
        inventoryValidated,
        timestamp: Date.now()
      };
      userStorage.saveInventoryData(dataToSave);
    };

    // Sauvegarder toutes les 5 secondes
    const interval = setInterval(saveData, 5000);
    
    // Sauvegarder immédiatement
    saveData();

    return () => clearInterval(interval);
  }, [currentRoom, currentStep, quoteFormData, inventoryValidated, userStorage]);

  // 🚫 DÉSACTIVÉ: Auto-sauvegarde automatique en DB (causait des boucles)
  // Les analyses sont maintenant sauvegardées directement par l'API d'analyse par pièce
  /*
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Code désactivé pour éviter les sauvegardes en boucle
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentRoom.photos]);
  */

  // Charger les données sauvegardées au démarrage (nouveau système)
  useEffect(() => {
    if (!userStorage) return;
    
    const savedData = userStorage.loadInventoryData();
    if (savedData) {
      try {
        // Vérifier que les données ne sont pas trop anciennes (24h)
        if (savedData.timestamp && (Date.now() - savedData.timestamp) < 24 * 60 * 60 * 1000) {
          if (savedData.currentRoom) setCurrentRoom(savedData.currentRoom);
          if (savedData.currentStep) setCurrentStep(savedData.currentStep);
          if (savedData.quoteFormData) setQuoteFormData(savedData.quoteFormData);
          if (savedData.inventoryValidated) setInventoryValidated(savedData.inventoryValidated);
          console.log('📥 Données utilisateur restaurées depuis localStorage');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données sauvegardées:', error);
      }
    }
  }, [userStorage]);


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

  // 🎯 SUPPRIMÉ : Plus de détection de doublons nécessaire
  // Avec la nouvelle logique d'analyse par pièce, l'IA analyse déjà
  // l'ensemble des photos d'une pièce d'un coup, donc pas de doublons possibles

  // Fonction de traitement asynchrone d'une photo
  const processPhotoAsync = async (photoIndex: number, file: File, photoId: string) => {
    const photoStart = Date.now();
    try {
      console.log(`📸 [TIMING] Début traitement photo ${photoIndex}: ${file.name}`);
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
      const apiStart = Date.now();
      
      // Utiliser le client API unifié avec authentification
      const { apiFetch } = await import('@/lib/apiClient');
      const result = await apiFetch("/api/photos/analyze", { 
        method: "POST", 
        body: fd,
        headers: {
          'x-user-id': currentUserId
        }
      });
      
      const apiTime = Date.now() - apiStart;
      console.log(`🌐 [TIMING] API /photos/analyze: ${apiTime}ms - Photo ${photoIndex}`);
      
      clearInterval(progressInterval);

      if (result) {
        // ✅ UN SEUL appel setCurrentRoom pour éviter d'écraser les propriétés
        const totalPhotoTime = Date.now() - photoStart;
        if (result.roomType) {
          console.log(`✅ [TIMING] Photo ${photoIndex} terminée: ${totalPhotoTime}ms - Pièce: ${result.roomType} (${result.confidence})`);
        }

        // Marquer comme terminé avec TOUTES les propriétés en un seul appel
        setCurrentRoom(prev => ({
          ...prev,
          photos: prev.photos.map((photo, idx) => 
            idx === photoIndex ? { 
              ...photo,
              // Propriétés de classification
              roomName: result.roomType,
              roomType: result.roomType,
              roomConfidence: result.confidence,
              // Propriétés de completion
              status: 'completed', 
              analysis: result,
              fileUrl: result.file_url,
              photoId: result.photo_id || photo.photoId,
              progress: 100
            } : photo
          )
        }));

        // 🎯 SUPPRIMÉ : Plus de détection de doublons nécessaire
        // L'analyse par pièce élimine automatiquement les doublons
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
        progress: 0,
        userId: currentUserId
      };
    });
    
    setCurrentRoom(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
    
    // 🚀 OPTIMISATION : Traitement parallèle au lieu de séquentiel
    const parallelStart = Date.now();
    console.log(`🚀 [TIMING] Début traitement parallèle de ${files.length} photos`);
    
    const processingPromises = files.map((file, i) => {
      const photoIndex = currentRoom.photos.length + i;
      const photoId = newPhotos[i].photoId!;
      
      // Lancer le traitement asynchrone immédiatement
      return processPhotoAsync(photoIndex, file, photoId);
    });
    
    // Lancer tous les traitements en parallèle
    Promise.allSettled(processingPromises).then(() => {
      const parallelTime = Date.now() - parallelStart;
      console.log(`✅ [TIMING] Traitement parallèle terminé: ${parallelTime}ms pour ${files.length} photos (${Math.round(parallelTime/files.length)}ms/photo)`);
      setLoading(false);
    }).catch(error => {
      console.error('❌ Erreur lors du traitement parallèle:', error);
      setLoading(false);
    });
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
        progress: 0,
        userId: currentUserId
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


  // Utiliser le hook pour les calculs d'inventaire
  const inventoryCalculations = useInventoryCalculations(currentRoom.photos);
  
  // Utiliser le hook pour les étapes du workflow
  const workflowSteps = useWorkflowSteps(currentStep, currentRoom.photos, quoteFormData, roomGroups);

  // Charger les photos ET roomGroups depuis l'API quand l'utilisateur est initialisé
  useEffect(() => {
    if (!currentUserId) return;
    
    const loadInitialData = async () => {
      console.log('📥 Chargement initial des données pour:', currentUserId);
      
      // Charger les photos depuis la DB
      try {
        const { apiFetch } = await import('@/lib/apiClient');
        const photos = await apiFetch('/api/photos', {
          headers: { 'x-user-id': currentUserId }
        });
        
        if (photos && photos.length > 0) {
          console.log('✅ Photos chargées depuis DB:', photos.length);
          
          // Transformer les photos de la DB au format attendu
          const transformedPhotos = photos.map((photo: any) => ({
            id: photo.id,
            photoId: photo.id,
            file: null,
            fileUrl: photo.url, // URL déjà au bon format depuis la DB
            analysis: photo.analysis,
            status: 'completed' as const,
            error: undefined,
            selectedItems: new Set(),
            progress: 100,
            roomName: photo.roomType,
            roomConfidence: 0.9,
            roomType: photo.roomType,
            userId: currentUserId
          }));
          
          setCurrentRoom(prev => ({
            ...prev,
            photos: transformedPhotos
          }));
        }
      } catch (error) {
        console.error('❌ Erreur chargement photos:', error);
      }
      
      // Charger les roomGroups
      loadRoomGroupsFromAPI();
    };
    
    loadInitialData();
  }, [currentUserId]); // Déclencher une seule fois au changement d'utilisateur

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

  // Nouvelle logique de classification : basée sur is_small_object et fragile
  const getNewCategory = (item: any): string => {
    // Règle 1 : Tous les petits objets → Cartons (peu importe la fragilité)
    if (item.is_small_object) {
      return 'Cartons';
    }
    
    // Règle 2 : Objets volumineux fragiles → Mobilier fragile
    if (item.fragile) {
      return 'Mobilier fragile';
    }
    
    // Règle 3 : Objets volumineux non fragiles → Meubles
    return 'Meubles';
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

  // 🎯 SUPPRIMÉ : Plus de badges de doublons nécessaires
  const renderDuplicateBadge = (item: any) => {
    return null; // Plus de doublons avec l'analyse par pièce
  };

  const renderTestsInterface = () => (
    <>

        {/* Étape 2 - Valider les pièces */}
        {currentStep === 2 && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <RoomValidationStepV2
                  photos={currentRoom.photos}
                  userId={currentUserId}
                  onValidationComplete={handleRoomValidationComplete}
                  onPrevious={handleRoomValidationPrevious}
                  onPhotosUpdated={handlePhotosUpdated}
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 - Valider l'inventaire par pièce */}
        {currentStep === 3 && (
          <div>
            <Step2RoomInventory
              roomGroups={roomGroups}
              onRoomTypeChange={(groupId, newRoomType) => {
                setRoomGroups(prev => prev.map(group => 
                  group.id === groupId 
                    ? { ...group, roomType: newRoomType }
                    : group
                ));
              }}
              onItemUpdate={(groupId, itemIndex, updates) => {
                console.log('🔄 onItemUpdate appelé:', { groupId, itemIndex, updates });
                setRoomGroups(prev => prev.map(group => {
                  if (group.id !== groupId) return group;
                  
                  console.log('📊 Group photos:', group.photos.length);
                  group.photos.forEach((p, i) => {
                    console.log(`  Photo ${i}:`, {
                      hasAnalysis: !!p.analysis,
                      hasItems: !!p.analysis?.items,
                      itemsCount: p.analysis?.items?.length || 0,
                      isGroupAnalysis: p.analysis?._isGroupAnalysis
                    });
                  });
                  
                  // Trouver la photo avec l'analyse groupée (essayer plusieurs méthodes)
                  let groupAnalysisPhoto = group.photos.find(p => p?.analysis?._isGroupAnalysis === true);
                  
                  // Fallback: prendre la première photo avec des items
                  if (!groupAnalysisPhoto) {
                    console.log('⚠️ Pas de flag _isGroupAnalysis, fallback sur première photo avec items');
                    groupAnalysisPhoto = group.photos.find(p => p?.analysis?.items && p.analysis.items.length > 0);
                  }
                  
                  // Dernier fallback: première photo
                  if (!groupAnalysisPhoto) {
                    console.log('⚠️ Fallback sur première photo');
                    groupAnalysisPhoto = group.photos[0];
                  }
                  
                  if (!groupAnalysisPhoto || !groupAnalysisPhoto.analysis?.items) {
                    console.log('❌ Aucune photo avec analyse trouvée');
                    return group;
                  }
                  
                  console.log('✅ Photo trouvée avec', groupAnalysisPhoto.analysis.items.length, 'items');
                  
                  // Mettre à jour l'item
                  const updatedItems = [...groupAnalysisPhoto.analysis.items];
                  const item = updatedItems[itemIndex];
                  if (!item) {
                    console.log('❌ Item non trouvé à l\'index:', itemIndex);
                    return group;
                  }
                  
                  console.log('📦 Item avant update:', { ...item });
                  
                  // Appliquer les updates
                  Object.assign(item, updates);
                  
                  console.log('📦 Item après update:', { ...item });
                  
                  // Recalculer le volume emballé si nécessaire
                  if (updates.dismountable !== undefined || updates.fragile !== undefined) {
                    const packagingInfo = calculatePackagedVolume(
                      item.volume_m3,
                      item.fragile,
                      item.category,
                      item.dimensions_cm,
                      item.dismountable
                    );
                    item.packaged_volume_m3 = packagingInfo.packagedVolumeM3;
                    item.packaging_display = packagingInfo.displayValue;
                    item.packaging_calculation_details = packagingInfo.calculationDetails;
                    console.log('📦 Volume emballé recalculé:', packagingInfo.packagedVolumeM3);
                  }
                  
                  // Mettre à jour l'analyse
                  groupAnalysisPhoto.analysis.items = updatedItems;
                  
                  // Forcer une copie profonde pour déclencher le re-render
                  const updatedGroup = {
                    ...group,
                    photos: group.photos.map(p => 
                      p.id === groupAnalysisPhoto.id 
                        ? { ...p, analysis: { ...p.analysis, items: updatedItems } }
                        : p
                    )
                  };
                  
                  console.log('✅ Groupe mis à jour');
                  return updatedGroup;
                }));
              }}
              onPrevious={() => setCurrentStep(1.5)}
              onNext={() => setCurrentStep(4)}
            />
          </div>
        )}

        {/* Ancienne étape 2 - Commentée pour référence */}
        {false && currentStep === 2 && (
          <div className="max-w-7xl mx-auto px-4">
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
                                                    <div className="flex-1">
                                                      <span className={`text-sm font-medium ${isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex) ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                                        {item.quantity > 1 ? `${item.label} (×${item.quantity})` : item.label}
                                                      </span>
                                                      <span className="text-xs text-gray-500 ml-2">{item.volume_m3}m³</span>
                                                      {/* Badge doublon */}
                                                      {/* Plus de badges de doublons */}
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                      <FragileToggle
                                                        item={item}
                                                        onToggle={(isFragile) => 
                                                          handleFragileToggle(photo.photoId || `photo-${photoIndex}`, originalIndex, isFragile)
                                                        }
                                                      />
                                                      <DismountableToggle
                                                        item={item}
                                                        onToggle={(isDismountable) => 
                                                          handleDismountableToggle(photo.photoId || `photo-${photoIndex}`, originalIndex, isDismountable)
                                                        }
                                                      />
                    </div>
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
                                                          <div className="flex-1">
                                                            <span className={`text-sm font-medium ${isObjectSelected(photo.photoId || `photo-${photoIndex}`, originalIndex) ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                                              {item.quantity > 1 ? `${item.label} (×${item.quantity})` : item.label}
                                                            </span>
                                                            <span className="text-xs text-gray-500 ml-2">{item.volume_m3}m³</span>
                                                            {/* Badge doublon */}
                                                            {/* Plus de badges de doublons */}
                                                          </div>
                                                          <div className="flex items-center space-x-2">
                                                            <FragileToggle
                                                              item={item}
                                                              onToggle={(isFragile) => 
                                                                handleFragileToggle(photo.photoId || `photo-${photoIndex}`, originalIndex, isFragile)
                                                              }
                                                            />
                                                            <DismountableToggle
                                                              item={item}
                                                              onToggle={(isDismountable) => 
                                                                handleDismountableToggle(photo.photoId || `photo-${photoIndex}`, originalIndex, isDismountable)
                                                              }
                                                            />
                                </div>
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

        {/* Étape 4 - Préparer la demande */}
        {currentStep === 4 && (
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
                          <span className="text-sm text-gray-500">Formats acceptés : JPG, PNG, WEBP, HEIC, AVIF, TIFF, BMP</span>
                        </p>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={onFileSelect}
                          multiple
                          accept="image/*,.heic,.heif,.avif,.tiff,.tif,.bmp"
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
                            accept="image/*,.heic,.heif,.avif,.tiff,.tif,.bmp"
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
                                      {photo.status === 'completed' && (
                                        photo.roomName || 
                                        (photo.roomType && photo.roomType !== 'autre' ? 
                                          (() => {
                                            const roomTypeNames: { [key: string]: string } = {
                                              'salon': 'Salon',
                                              'cuisine': 'Cuisine',
                                              'chambre': 'Chambre',
                                              'bureau': 'Bureau',
                                              'salle_de_bain': 'Salle de bain',
                                              'couloir': 'Couloir',
                                              'entree': 'Entrée',
                                              'jardin': 'Jardin',
                                              'terrasse': 'Terrasse',
                                              'garage': 'Garage',
                                              'cave': 'Cave',
                                              'grenier': 'Grenier',
                                              'salle_a_manger': 'Salle à manger'
                                            };
                                            const roomName = roomTypeNames[photo.roomType] || photo.roomType;
                                            // S'assurer que la première lettre est en majuscule
                                            return roomName.charAt(0).toUpperCase() + roomName.slice(1);
                                          })() 
                                        : 'Terminé')
                                      )}
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
            {currentStep < 5 ? (
                            <button
                onClick={() => {
                  const nextStep = currentStep + 1;
                  console.log('🎯 Bouton "Étape suivante" cliqué, passage à l\'étape', nextStep);
                  setCurrentStep(nextStep);
                }}
                disabled={
                  (currentStep === 1 && currentRoom.photos.length === 0) ||
                  (currentStep === 2 && roomGroups.length === 0) ||
                  (currentStep === 3 && !currentRoom.photos.some(p => p.status === 'completed')) ||
                  (currentStep === 4 && !quoteFormData)
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

        {/* Étape 5 - Envoyer un devis */}
        {currentStep === 5 && (
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">📋 État Synthétique de votre Déménagement</h3>
                  <p className="text-sm text-gray-600">
                    Toutes vos informations en un coup d'œil
                  </p>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                {/* Section 1 : Résumé des Volumes */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    📦 Inventaire et Volumes
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Nombre de photos */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                      <div className="text-sm text-purple-700 font-medium mb-1">Photos analysées</div>
                      <div className="text-3xl font-bold text-purple-900">
                        {currentRoom.photos.filter(p => p.status === 'completed').length}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">pièces documentées</div>
                    </div>
                    
                    {/* Nombre d'objets */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                      <div className="text-sm text-green-700 font-medium mb-1">Objets détectés</div>
                      <div className="text-3xl font-bold text-green-900">
                        {(() => {
                          let count = 0;
                          currentRoom.photos.forEach(photo => {
                            if (photo.analysis?.items) {
                              photo.analysis.items.forEach((item: any, idx: number) => {
                                if (isObjectSelected(photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`, idx)) {
                                  count += item.quantity || 1;
                                }
                              });
                            }
                          });
                          return count;
                        })()}
                      </div>
                      <div className="text-xs text-green-600 mt-1">articles sélectionnés</div>
                    </div>

                    {/* Volume brut */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                      <div className="text-sm text-blue-700 font-medium mb-1">Volume brut</div>
                      <div className="text-3xl font-bold text-blue-900">
                        {(() => {
                          let totalVolume = 0;
                          currentRoom.photos.forEach(photo => {
                            if (photo.analysis?.items) {
                              photo.analysis.items.forEach((item: any, idx: number) => {
                                if (isObjectSelected(photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`, idx)) {
                                  totalVolume += (item.volume_m3 || 0) * (item.quantity || 1);
                                }
                              });
                            }
                          });
                          return totalVolume.toFixed(1);
                        })()} m³
                      </div>
                      <div className="text-xs text-blue-600 mt-1">avant emballage et démontage</div>
                    </div>

                    {/* Volume emballé */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
                      <div className="text-sm text-orange-700 font-medium mb-1">Volume emballé</div>
                      <div className="text-3xl font-bold text-orange-900">
                        {(() => {
                          let totalPackagedVolume = 0;
                          currentRoom.photos.forEach(photo => {
                            if (photo.analysis?.items) {
                              photo.analysis.items.forEach((item: any, idx: number) => {
                                if (isObjectSelected(photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`, idx)) {
                                  totalPackagedVolume += (item.packaged_volume_m3 || item.volume_m3 || 0) * (item.quantity || 1);
                                }
                              });
                            }
                          });
                          return totalPackagedVolume.toFixed(1);
                        })()} m³
                      </div>
                      <div className="text-xs text-orange-600 mt-1">avec emballage et démontage</div>
                    </div>
                  </div>

                  {/* Liste détaillée des objets par catégorie */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h5 className="font-semibold text-gray-900 mb-3 text-sm">📊 Répartition par catégorie</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      {(() => {
                        // Regrouper par catégorie avec liste d'objets
                        const categories: { 
                          [key: string]: { 
                            count: number; 
                            volume: number; 
                            volumeEmballe: number;
                            items: Array<{ label: string; quantity: number; volumeEmballe: number }>;
                          } 
                        } = {};
                        
                        currentRoom.photos.forEach(photo => {
                          if (photo.analysis?.items) {
                            photo.analysis.items.forEach((item: any, idx: number) => {
                              if (isObjectSelected(photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`, idx)) {
                                const cat = getNewCategory(item);
                                if (!categories[cat]) categories[cat] = { count: 0, volume: 0, volumeEmballe: 0, items: [] };
                                categories[cat].count += item.quantity || 1;
                                categories[cat].volume += (item.volume_m3 || 0) * (item.quantity || 1);
                                categories[cat].volumeEmballe += (item.packaged_volume_m3 || item.volume_m3 || 0) * (item.quantity || 1);
                                categories[cat].items.push({
                                  label: item.label,
                                  quantity: item.quantity || 1,
                                  volumeEmballe: (item.packaged_volume_m3 || item.volume_m3 || 0) * (item.quantity || 1)
                                });
                              }
                            });
                          }
                        });
                        
                        // Ordre d'affichage : Meubles, Mobilier fragile, Cartons
                        const orderedCategories = ['Meubles', 'Mobilier fragile', 'Cartons'];
                        
                        return orderedCategories
                          .filter(cat => categories[cat] && categories[cat].count > 0)
                          .map(cat => {
                            const data = categories[cat];
                            
                            // Affichage selon la catégorie
                            if (cat === 'Meubles') {
                              // MEUBLES : affichage simple sans flèche
                              return (
                                <div key={cat} className="rounded-lg p-4 border-2 border-blue-300 bg-blue-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <span className="text-2xl mr-2">🪑</span>
                                      <div className="font-semibold text-gray-900">{cat}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-blue-900">{data.volumeEmballe.toFixed(2)} m³</div>
                                      <div className="text-xs text-blue-700">volume emballé</div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {data.count} objet{data.count > 1 ? 's' : ''}
                                  </div>
                                </div>
                              );
                            } else if (cat === 'Cartons') {
                              // CARTONS : nombre de cartons complets + volume
                              const CARTON_STANDARD_M3 = 0.06;
                              const nbCartons = Math.ceil(data.volumeEmballe / CARTON_STANDARD_M3);
                              return (
                                <div key={cat} className="rounded-lg p-4 border-2 border-green-300 bg-green-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <span className="text-2xl mr-2">📦</span>
                                      <div className="font-semibold text-gray-900">{cat}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-green-900">{nbCartons} carton{nbCartons > 1 ? 's' : ''}</div>
                                      <div className="text-xs text-green-700">{data.volumeEmballe.toFixed(2)} m³</div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {data.count} objet{data.count > 1 ? 's' : ''} • {CARTON_STANDARD_M3} m³/carton
                                  </div>
                                </div>
                              );
                            } else {
                              // MOBILIER FRAGILE : affichage simple sans flèche
                              return (
                                <div key={cat} className="rounded-lg p-4 border-2 border-orange-300 bg-orange-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <span className="text-2xl mr-2">⚠️</span>
                                      <div className="font-semibold text-gray-900">{cat}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-orange-900">{data.volumeEmballe.toFixed(2)} m³</div>
                                      <div className="text-xs text-orange-700">volume total</div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {data.count} objet{data.count > 1 ? 's' : ''}
                                  </div>
                                </div>
                              );
                            }
                          });
                      })()}
                    </div>
                    
                    {/* Bouton Détails global */}
                    <button
                      onClick={() => setIsCategoryDetailsExpanded(!isCategoryDetailsExpanded)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      <span className="font-semibold text-gray-700">Détails</span>
                      <svg 
                        className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isCategoryDetailsExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Panel de détails expandable */}
                    <AnimatePresence>
                      {isCategoryDetailsExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {(() => {
                              // Regrouper par catégorie avec données complètes
                              const categories: { 
                                [key: string]: { 
                                  count: number; 
                                  volume: number; 
                                  volumeEmballe: number;
                                  items: Array<{ photoId: string; itemIndex: number; item: any; roomName: string }>;
                                } 
                              } = {};
                              
                              currentRoom.photos.forEach(photo => {
                                if (photo.analysis?.items) {
                                  const roomName = photo.roomName || 'Pièce non identifiée';
                                  photo.analysis.items.forEach((item: any, idx: number) => {
                                    if (isObjectSelected(photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`, idx)) {
                                      const cat = getNewCategory(item);
                                      if (!categories[cat]) categories[cat] = { count: 0, volume: 0, volumeEmballe: 0, items: [] };
                                      categories[cat].count += item.quantity || 1;
                                      categories[cat].volume += (item.volume_m3 || 0) * (item.quantity || 1);
                                      categories[cat].volumeEmballe += (item.packaged_volume_m3 || item.volume_m3 || 0) * (item.quantity || 1);
                                      categories[cat].items.push({
                                        photoId: photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`,
                                        itemIndex: idx,
                                        item: item,
                                        roomName: roomName
                                      });
                                    }
                                  });
                                }
                              });
                              
                              // Préparer les données pour les deux colonnes
                              const meublesData = categories['Meubles'] || { count: 0, volume: 0, volumeEmballe: 0, items: [] };
                              const fragilesData = categories['Mobilier fragile'] || { count: 0, volume: 0, volumeEmballe: 0, items: [] };
                              
                              // Regrouper les items par pièce pour chaque catégorie
                              const meublesItemsByRoom: { [roomName: string]: typeof meublesData.items } = {};
                              meublesData.items.forEach(itemData => {
                                if (!meublesItemsByRoom[itemData.roomName]) {
                                  meublesItemsByRoom[itemData.roomName] = [];
                                }
                                meublesItemsByRoom[itemData.roomName].push(itemData);
                              });
                              
                              const fragilesItemsByRoom: { [roomName: string]: typeof fragilesData.items } = {};
                              fragilesData.items.forEach(itemData => {
                                if (!fragilesItemsByRoom[itemData.roomName]) {
                                  fragilesItemsByRoom[itemData.roomName] = [];
                                }
                                fragilesItemsByRoom[itemData.roomName].push(itemData);
                              });
                              
                              return (
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Colonne gauche : Meubles (non-fragiles) */}
                                  <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300">
                                    <h6 className="font-semibold text-blue-900 mb-2 flex flex-col gap-1">
                                      <div className="flex items-center">
                                        <span className="text-base mr-1">🪑</span>
                                        <span className="text-sm">Meubles standards</span>
                                      </div>
                                      <span className="text-xs font-normal text-blue-700">
                                        {meublesData.count} objet{meublesData.count > 1 ? 's' : ''}
                                      </span>
                                    </h6>
                                    <div className="text-[10px] text-gray-600 mb-2 italic px-1.5 py-1 bg-blue-100 rounded leading-tight">
                                      💡 Cliquez → pour marquer fragile
                                    </div>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                      {Object.keys(meublesItemsByRoom).length > 0 ? (
                                        Object.entries(meublesItemsByRoom).map(([roomName, items]) => (
                                          <div key={roomName} className="space-y-0.5">
                                            <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide px-1 sticky top-0 bg-blue-50">
                                              {roomName}
                                            </div>
                                            {items.map((itemData, displayIdx) => (
                                              <div key={displayIdx} className="flex justify-between items-center text-[11px] bg-white rounded px-1.5 py-1 hover:bg-blue-100 transition-all duration-200 group">
                                                <span className="text-gray-900 font-medium flex-1 truncate pr-1">
                                                  {itemData.item.quantity > 1 && `${itemData.item.quantity}× `}{itemData.item.label}
                                                </span>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFragileToggle(itemData.photoId, itemData.itemIndex, true);
                                                  }}
                                                  className="ml-1 px-2 py-0.5 text-orange-600 hover:bg-orange-100 rounded transition-colors font-bold text-sm opacity-60 group-hover:opacity-100 flex-shrink-0"
                                                  title="Marquer comme fragile →"
                                                >
                                                  →
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-center text-gray-500 text-xs py-6 italic">
                                          Aucun meuble standard
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Colonne droite : Mobilier fragile */}
                                  <div className="bg-orange-50 rounded-lg p-3 border-2 border-orange-300">
                                    <h6 className="font-semibold text-orange-900 mb-2 flex flex-col gap-1">
                                      <div className="flex items-center">
                                        <span className="text-base mr-1">⚠️</span>
                                        <span className="text-sm">Mobilier fragile</span>
                                      </div>
                                      <span className="text-xs font-normal text-orange-700">
                                        {fragilesData.count} objet{fragilesData.count > 1 ? 's' : ''}
                                      </span>
                                    </h6>
                                    <div className="text-[10px] text-gray-600 mb-2 italic px-1.5 py-1 bg-orange-100 rounded leading-tight">
                                      💡 Cliquez ← pour retirer fragile
                                    </div>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                      {Object.keys(fragilesItemsByRoom).length > 0 ? (
                                        Object.entries(fragilesItemsByRoom).map(([roomName, items]) => (
                                          <div key={roomName} className="space-y-0.5">
                                            <div className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide px-1 sticky top-0 bg-orange-50">
                                              {roomName}
                                            </div>
                                            {items.map((itemData, displayIdx) => (
                                              <div key={displayIdx} className="flex justify-between items-center text-[11px] bg-white rounded px-1.5 py-1 hover:bg-orange-100 transition-all duration-200 group">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFragileToggle(itemData.photoId, itemData.itemIndex, false);
                                                  }}
                                                  className="mr-1 px-2 py-0.5 text-blue-600 hover:bg-blue-100 rounded transition-colors font-bold text-sm opacity-60 group-hover:opacity-100 flex-shrink-0"
                                                  title="← Retirer le statut fragile"
                                                >
                                                  ←
                                                </button>
                                                <span className="text-gray-900 font-medium flex-1 truncate">
                                                  {itemData.item.quantity > 1 && `${itemData.item.quantity}× `}{itemData.item.label}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-center text-gray-500 text-xs py-6 italic">
                                          Aucun mobilier fragile
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {/* Section Cartons (en dessous des deux colonnes) */}
                            {(() => {
                              const categories: { 
                                [key: string]: { 
                                  count: number; 
                                  volume: number; 
                                  volumeEmballe: number;
                                  items: Array<{ photoId: string; itemIndex: number; item: any; roomName: string }>;
                                } 
                              } = {};
                              
                              currentRoom.photos.forEach(photo => {
                                if (photo.analysis?.items) {
                                  const roomName = photo.roomName || 'Pièce non identifiée';
                                  photo.analysis.items.forEach((item: any, idx: number) => {
                                    if (isObjectSelected(photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`, idx)) {
                                      const cat = getNewCategory(item);
                                      if (!categories[cat]) categories[cat] = { count: 0, volume: 0, volumeEmballe: 0, items: [] };
                                      categories[cat].count += item.quantity || 1;
                                      categories[cat].volume += (item.volume_m3 || 0) * (item.quantity || 1);
                                      categories[cat].volumeEmballe += (item.packaged_volume_m3 || item.volume_m3 || 0) * (item.quantity || 1);
                                      categories[cat].items.push({
                                        photoId: photo.photoId || `photo-${currentRoom.photos.indexOf(photo)}`,
                                        itemIndex: idx,
                                        item: item,
                                        roomName: roomName
                                      });
                                    }
                                  });
                                }
                              });
                              
                              const cartonsData = categories['Cartons'];
                              
                              if (cartonsData && cartonsData.count > 0) {
                                // Regrouper les items par pièce
                                const itemsByRoom: { [roomName: string]: typeof cartonsData.items } = {};
                                cartonsData.items.forEach(itemData => {
                                  if (!itemsByRoom[itemData.roomName]) {
                                    itemsByRoom[itemData.roomName] = [];
                                  }
                                  itemsByRoom[itemData.roomName].push(itemData);
                                });
                                
                                return (
                                  <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-300">
                                    <h6 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                                      <div className="flex items-center">
                                        <span className="text-lg mr-2">📦</span>
                                        <span>Cartons</span>
                                      </div>
                                      <span className="text-sm font-normal text-gray-700">
                                        {cartonsData.count} carton{cartonsData.count > 1 ? 's' : ''}
                                      </span>
                                    </h6>
                                    <div className="space-y-3">
                                      {Object.entries(itemsByRoom).map(([roomName, items]) => (
                                        <div key={roomName} className="space-y-1">
                                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide px-2">
                                            {roomName}
                                          </div>
                                          {items.map((itemData, displayIdx) => (
                                            <div key={displayIdx} className="flex justify-between items-center text-xs bg-white rounded px-2 py-1.5">
                                              <span className="text-gray-900 font-medium">
                                                {itemData.item.quantity > 1 && `${itemData.item.quantity}× `}{itemData.item.label}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Section 2 : Détails du Déménagement */}
                {quoteFormData && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      🚚 Détails du Déménagement
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Départ */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-3 flex items-center">
                          <span className="text-xl mr-2">🏠</span>
                          Adresse de départ
                        </h5>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div><span className="font-medium">Ville :</span> {quoteFormData.departureCity}</div>
                          <div><span className="font-medium">Code postal :</span> {quoteFormData.departurePostalCode}</div>
                          {quoteFormData.departureFloor && (
                            <div><span className="font-medium">Étage :</span> {quoteFormData.departureFloor}</div>
                          )}
                          {quoteFormData.departureElevator && (
                            <div className="text-green-600 text-xs">✓ Ascenseur disponible</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrivée */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                        <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                          <span className="text-xl mr-2">🎯</span>
                          Adresse d'arrivée
                        </h5>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div><span className="font-medium">Ville :</span> {quoteFormData.arrivalCity}</div>
                          <div><span className="font-medium">Code postal :</span> {quoteFormData.arrivalPostalCode}</div>
                          {quoteFormData.arrivalFloor && (
                            <div><span className="font-medium">Étage :</span> {quoteFormData.arrivalFloor}</div>
                          )}
                          {quoteFormData.arrivalElevator && (
                            <div className="text-green-600 text-xs">✓ Ascenseur disponible</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Date et offre */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700 mb-1">📅 Date de déménagement</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {new Date(quoteFormData.movingDate).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700 mb-1">💼 Offre choisie</div>
                        <div className="text-lg font-semibold text-gray-900 capitalize">
                          {quoteFormData.selectedOffer}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 my-8"></div>

                {/* Section 3 : CTA Principaux */}
                {quoteFormData && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      🚚 Détails du Déménagement
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Départ */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-3 flex items-center">
                          <span className="text-xl mr-2">🏠</span>
                          Adresse de départ
                        </h5>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div><span className="font-medium">Ville :</span> {quoteFormData.departureCity}</div>
                          <div><span className="font-medium">Code postal :</span> {quoteFormData.departurePostalCode}</div>
                          {quoteFormData.departureFloor && (
                            <div><span className="font-medium">Étage :</span> {quoteFormData.departureFloor}</div>
                          )}
                          {quoteFormData.departureArea && (
                            <div><span className="font-medium">Superficie :</span> {quoteFormData.departureArea}</div>
                          )}
                          <div className="pt-2 border-t border-green-200">
                            <div className="flex flex-wrap gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                quoteFormData.departureElevator 
                                  ? 'bg-white text-green-700' 
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {quoteFormData.departureElevator ? '✓' : '✗'} Ascenseur
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                quoteFormData.departureTruckAccess 
                                  ? 'bg-white text-green-700' 
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {quoteFormData.departureTruckAccess ? '✓' : '✗'} Accès camion
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                quoteFormData.departureMonteCharge 
                                  ? 'bg-white text-green-700' 
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {quoteFormData.departureMonteCharge ? '✓' : '✗'} Monte-charge
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Arrivée */}
                      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-200">
                        <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                          <span className="text-xl mr-2">🎯</span>
                          Adresse d'arrivée
                        </h5>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div><span className="font-medium">Ville :</span> {quoteFormData.arrivalCity}</div>
                          <div><span className="font-medium">Code postal :</span> {quoteFormData.arrivalPostalCode}</div>
                          {quoteFormData.arrivalFloor && (
                            <div><span className="font-medium">Étage :</span> {quoteFormData.arrivalFloor}</div>
                          )}
                          {quoteFormData.arrivalArea && (
                            <div><span className="font-medium">Superficie :</span> {quoteFormData.arrivalArea}</div>
                          )}
                          <div className="pt-2 border-t border-blue-200">
                            <div className="flex flex-wrap gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                quoteFormData.arrivalElevator 
                                  ? 'bg-white text-blue-700' 
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {quoteFormData.arrivalElevator ? '✓' : '✗'} Ascenseur
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                quoteFormData.arrivalTruckAccess 
                                  ? 'bg-white text-blue-700' 
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {quoteFormData.arrivalTruckAccess ? '✓' : '✗'} Accès camion
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                quoteFormData.arrivalMonteCharge 
                                  ? 'bg-white text-blue-700' 
                                  : 'bg-gray-200 text-gray-500'
                              }`}>
                                {quoteFormData.arrivalMonteCharge ? '✓' : '✗'} Monte-charge
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informations complémentaires */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">📅 Date souhaitée</div>
                        <div className="font-semibold text-gray-900">
                          {new Date(quoteFormData.movingDate).toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Dates flexibles : <span className="font-medium">{quoteFormData.flexibleDate ? 'Oui (± 3 jours)' : 'Non'}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">🕐 Heure préférée</div>
                        <div className="font-semibold text-gray-900">{quoteFormData.movingTime}</div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">📦 Formule choisie</div>
                        <div className="font-semibold text-gray-900 capitalize mb-1">{quoteFormData.selectedOffer}</div>
                        <div className="text-xs text-gray-600">
                          {quoteFormData.selectedOffer === 'economique' && 'Transport simple A → B'}
                          {quoteFormData.selectedOffer === 'standard' && 'Avec démontage et cartons'}
                          {quoteFormData.selectedOffer === 'premium' && 'Clé en main complet'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3 : Informations Client */}
                {quoteFormData && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      👤 Vos Informations
                    </h4>
                    
                    <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {quoteFormData.email && (
                          <div>
                            <div className="text-purple-700 font-medium mb-1">📧 Email</div>
                            <div className="text-gray-900">{quoteFormData.email}</div>
                          </div>
                        )}
                        {quoteFormData.phone && (
                          <div>
                            <div className="text-purple-700 font-medium mb-1">📱 Téléphone</div>
                            <div className="text-gray-900">{quoteFormData.phone}</div>
                          </div>
                        )}
                        {(quoteFormData.firstName || quoteFormData.lastName) && (
                          <div>
                            <div className="text-purple-700 font-medium mb-1">👤 Nom</div>
                            <div className="text-gray-900">{quoteFormData.firstName} {quoteFormData.lastName}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 my-8"></div>

                {/* Section 4 : CTA Principaux */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 text-center mb-6">
                    Que souhaitez-vous faire maintenant ?
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CTA 1 : Télécharger mon dossier */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border-2 border-blue-300 hover:border-blue-400 transition-all duration-200 hover:shadow-lg">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Télécharger mon dossier</h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Récupérez l'inventaire complet au format PDF, Excel ou CSV
                        </p>
                        <div className="space-y-2">
                          <button
                            onClick={handleDownloadPDF}
                            disabled={loading || !quoteFormData}
                            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? '⏳ Génération...' : '📄 PDF Complet'}
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implémenter l'export Excel
                              alert('Export Excel en cours de développement');
                            }}
                            className="w-full px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors border-2 border-blue-200"
                          >
                            📊 Excel
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implémenter l'export CSV
                              alert('Export CSV en cours de développement');
                            }}
                            className="w-full px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors border-2 border-blue-200"
                          >
                            📋 CSV
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CTA 2 : Demander des devis (gratuit) */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 border-2 border-green-300 hover:border-green-400 transition-all duration-200 hover:shadow-lg">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Demander des devis
                          <span className="ml-2 inline-block px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                            GRATUIT
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Recevez jusqu'à 5 devis de déménageurs professionnels
                        </p>
                        
                        {/* Explication détaillée du service */}
                        <div className="bg-white rounded-xl p-4 mb-6 text-left border border-green-200">
                          <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Ce qui va se passer ensuite :
                          </h4>
                          <div className="space-y-2 text-xs text-gray-700">
                            <div className="flex items-start">
                              <span className="font-bold text-green-600 mr-2">✓</span>
                              <span>Votre dossier envoyé <strong>100% anonyme</strong> aux pros</span>
                            </div>
                            <div className="flex items-start">
                              <span className="font-bold text-green-600 mr-2">✓</span>
                              <span>Entre <strong>3 et 5 devis personnalisés</strong> collectés</span>
                            </div>
                            <div className="flex items-start">
                              <span className="font-bold text-green-600 mr-2">✓</span>
                              <span><strong>Vous choisissez</strong> le meilleur pour vous</span>
                            </div>
                            <div className="flex items-start">
                              <span className="font-bold text-green-600 mr-2">✓</span>
                              <span><strong>Aucun engagement</strong> de votre part</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-green-100">
                            <div className="flex items-start bg-green-50 rounded-lg p-2 -mx-1 mb-2">
                              <span className="font-bold text-green-600 mr-2">⏱️</span>
                              <span className="font-semibold"><strong>3 à 5 jours</strong> en moyenne (max 7j)</span>
                            </div>
                            <div className="flex items-start bg-blue-50 rounded-lg p-2 -mx-1">
                              <span className="font-bold text-blue-600 mr-2">🛡️</span>
                              <span className="font-semibold text-blue-900"><strong>Zéro effort</strong> de votre côté !</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            // TODO: Implémenter l'envoi de demande de devis
                            alert('Envoi de la demande de devis en cours de développement');
                          }}
                          className="w-full px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          📨 Envoyer ma demande
                        </button>
                        <p className="text-xs text-gray-500 mt-4">
                          ✓ Sans engagement • ✓ Réponse sous 24h • ✓ Déménageurs certifiés
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info supplémentaire */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-sm">Vos données sont sauvegardées automatiquement. Vous pouvez revenir à tout moment.</span>
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        if (confirm('🗑️ Supprimer toutes les photos ? Cette action est irréversible.')) {
                          try {
                            const response = await fetch('/api/photos/reset', { method: 'POST' });
                            if (response.ok) {
                              const result = await response.json();
                              alert(`✅ ${result.deletedCount} photos supprimées`);
                              // Recharger la page pour un état propre
                              window.location.reload();
                            } else {
                              alert('❌ Erreur lors de la suppression');
                            }
                          } catch (error) {
                            alert('❌ Erreur de connexion');
                          }
                        }
                      }}
                      className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full hover:bg-red-200 transition-colors"
                      title="Supprimer toutes les photos (reset complet)"
                    >
                      🗑️ Reset
                    </button>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-400">
                        Last update: {currentTime ? currentTime.toLocaleTimeString('fr-FR') : '--:--:--'}
                      </span>
                    </div>
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
                {currentStep < 5 && (
                  <button
                    onClick={() => {
                      const nextStep = currentStep + 1;
                      console.log('🎯 Bouton "Étape suivante" cliqué, passage à l\'étape', nextStep);
                      setCurrentStep(nextStep);
                    }}
                    disabled={
                      (currentStep === 1 && currentRoom.photos.length === 0) ||
                      (currentStep === 2 && roomGroups.length === 0) ||
                      (currentStep === 3 && !currentRoom.photos.some(p => p.status === 'completed')) ||
                      (currentStep === 4 && !quoteFormData)
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

      {/* Modal de continuation */}
      <ContinuationModal
        isOpen={showContinuationModal}
        onClose={() => setShowContinuationModal(false)}
        onSend={handleSendContinuationLink}
        projectId={currentProjectId || 'temp-project-id'}
      />
    </main>
  );
}