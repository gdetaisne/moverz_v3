"use client";
import { useState, useMemo } from "react";
import BackOffice from "@/components/BackOffice";
import { getBuildInfo } from "@/lib/buildInfo";
import { TInventoryItem } from "@/lib/schemas";
import { clearCache } from "@/lib/cache";

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
  }[];
}


export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<RoomData>({
    id: 'room-1',
    name: 'Pièce 1',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'backoffice'>('tests');

  // Fonction utilitaire pour arrondir les m³ à 2 chiffres avec arrondi supérieur
  const roundUpVolume = (volume: number): number => {
    return Math.ceil(volume * 100) / 100;
  };

  // Fonction pour générer un ID unique
  const generatePhotoId = () => {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Fonction de traitement asynchrone d'une photo
  const processPhotoAsync = async (photoIndex: number, file: File, photoId: string) => {
    try {
      // Marquer comme en cours de traitement
      setCurrentRoom(prev => ({
        ...prev,
        photos: prev.photos.map((photo, idx) => 
          idx === photoIndex ? { 
            ...photo, 
            status: 'processing',
            progress: 10
          } : photo
        )
      }));

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

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setLoading(true);
    
    // Initialiser les photos avec statut 'uploaded' immédiatement
    const newPhotos = files.map(file => {
      const photoId = generatePhotoId();
      return {
        file,
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
      processPhotoAsync(photoIndex, file, photoId);
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
      case 'fragile': return 'Fragile';
      case 'box': return 'Carton';
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
    } else if (item.category === 'fragile') {
      description += ' (objet délicat)';
    }
    
    return description;
  };

  const renderTestsInterface = () => (
    <>
        <div className="mb-8 p-4 lg:p-6 bg-white rounded-xl shadow-sm border">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Analyse IA — Inventaire Déménagement</h1>
              <p className="text-base lg:text-lg text-gray-600">Détection automatique des objets pour votre déménagement</p>
            </div>
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
              <div className="text-left lg:text-right">
                <div className="text-lg lg:text-xl font-bold text-blue-600">{currentRoom.name}</div>
                <div className="text-sm text-gray-700">{currentRoom.photos.length} photo(s) ajoutée(s)</div>
              </div>
              <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-4">
                <button
                  onClick={clearAnalysisCache}
                  className="text-xs bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  🗑️ Vider le cache IA
                </button>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={onUpload}
                  className="block text-sm lg:text-base text-gray-500 file:mr-4 file:py-2 lg:file:py-3 file:px-4 lg:file:px-6 file:rounded-full file:border-0 file:text-sm lg:file:text-base file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

      {currentRoom.photos.some(p => p.status === 'processing') && (
        <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin text-blue-600 text-xl">🔄</div>
            <div>
              <h4 className="text-lg font-semibold text-blue-800">Traitement en cours...</h4>
              <p className="text-base text-blue-600">
                {currentRoom.photos.filter(p => p.status === 'completed').length}/{currentRoom.photos.length} photo(s) analysée(s)
              </p>
              <p className="text-sm text-blue-500 mt-1">
                {currentRoom.photos.filter(p => p.status === 'processing').length} photo(s) en cours d'analyse
              </p>
            </div>
          </div>
        </div>
      )}

        {/* Volume total de tous les objets */}
        {currentRoom.photos.some(p => p.status === 'completed') && (
          <div className="mb-6 p-4 lg:p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <h3 className="text-xl lg:text-2xl font-bold mb-2">📦 Volume Total Sélectionné</h3>
                <p className="text-blue-100 text-sm lg:text-base">Somme des volumes des objets sélectionnés</p>
              </div>
              <div className="text-left lg:text-right">
                <div className="text-3xl lg:text-4xl font-bold mb-1">{totalVolumeSelected.totalVolume}</div>
                <div className="text-base lg:text-lg font-semibold text-blue-200">m³</div>
                <div className="text-sm text-blue-100 mt-1">
                  {totalVolumeSelected.totalItems} objet(s) sélectionné(s)
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Interface principale par pièce */}
      <div className="space-y-8">
        {currentRoom.photos.map((photo, photoIndex) => (
          <div key={photoIndex} className="border rounded-xl p-6 bg-white shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Côté gauche - Image */}
                <div className="lg:col-span-1 space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {photo.status === 'completed' ? (
                    <img 
                      src={photo.fileUrl || URL.createObjectURL(photo.file)} 
                      alt={`Photo ${photoIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="text-4xl mb-2">{getStatusIcon(photo.status)}</div>
                      <div className="text-sm text-gray-600 mb-3">
                        {photo.status === 'uploaded' && 'Photo uploadée'}
                        {photo.status === 'processing' && 'Analyse en cours...'}
                        {photo.status === 'error' && photo.error}
                      </div>
                      
                      {/* Barre de progression pour le statut processing */}
                      {photo.status === 'processing' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${photo.progress || 0}%` }}
                          ></div>
                        </div>
                      )}
                      
                      {/* Texte de progression */}
                      {photo.status === 'processing' && (
                        <div className="text-xs text-blue-600 font-medium">
                          {Math.round(photo.progress || 0)}% terminé
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Côté droit - Tableau de données */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold text-gray-800">Objets détectés</h3>
                  {photo.status === 'completed' && (
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => selectAllItems(photoIndex)}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                        >
                          Tout sélectionner
                        </button>
                        <button
                          onClick={() => deselectAllItems(photoIndex)}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                        >
                          Tout désélectionner
                        </button>
                      </div>
                      <span className="text-base font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {photo.analysis?.items?.length || 0} objet(s) détecté(s)
                      </span>
                    </div>
                  )}
                </div>

                {photo.status === 'completed' && photo.analysis ? (
                  <>
                    {/* Version desktop - Tableau */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full text-base border-collapse bg-white rounded-lg shadow-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-200 bg-gray-50">
                            <th className="text-center p-3 font-semibold text-gray-700 w-16">Sélectionner</th>
                            <th className="text-left p-3 font-semibold text-gray-700 w-24">Type</th>
                            <th className="text-left p-3 font-semibold text-gray-700 min-w-40">Description</th>
                            <th className="text-left p-3 font-semibold text-gray-700 w-32">Mesures</th>
                            <th className="text-left p-3 font-semibold text-gray-700 w-20">m³</th>
                            <th className="text-left p-3 font-semibold text-gray-700 w-32">Notes</th>
                            <th className="text-left p-3 font-semibold text-gray-700 w-24">Confiance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {photo.analysis.items?.map((item: TInventoryItem, itemIndex: number) => {
                            // Générer les notes avec fragile si applicable
                            const notes = getEnrichedNotes(item);
                            
                            // Vérifier si l'objet est sélectionné
                            const isSelected = isItemSelected(photo, itemIndex);
                            
                            return (
                              <tr key={itemIndex} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${!isSelected ? 'opacity-50 bg-gray-50' : ''}`}>
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleItemSelection(photoIndex, itemIndex)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                  />
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    item.category === 'furniture' ? 'bg-blue-100 text-blue-800' :
                                    item.category === 'appliance' ? 'bg-green-100 text-green-800' :
                                    item.category === 'fragile' ? 'bg-red-100 text-red-800' :
                                    item.category === 'box' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {translateCategory(item.category)}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold text-gray-900 text-sm">{enrichDescription(item)}</span>
                                </td>
                                <td className="p-3">
                                  {item.dimensions_cm && (
                                    <span className="text-xs text-gray-700 font-mono">
                                      {[item.dimensions_cm.length, item.dimensions_cm.width, item.dimensions_cm.height]
                                        .filter(Boolean)
                                        .join(' × ')} cm
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className="text-sm font-bold text-blue-600">{roundUpVolume(item.volume_m3 || 0)}</span>
                                </td>
                                <td className="p-3">
                                  <span className="text-xs text-gray-600">{notes || '-'}</span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${(item.confidence || 0) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{Math.round((item.confidence || 0) * 100)}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Ligne pour "autres objets" s'ils existent */}
                          {photo.analysis.special_rules?.autres_objets?.present && (
                            <tr className="border-b border-gray-100 hover:bg-orange-50 transition-colors bg-orange-50">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={true} // Par défaut sélectionné
                                  onChange={() => {}} // Pas de toggle pour l'instant
                                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                                />
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                  Divers
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="font-semibold text-gray-900 text-sm">
                                  Autres objets ({photo.analysis.special_rules.autres_objets.listed_items?.length || 0} items)
                                </span>
                                <div className="text-xs text-orange-600 mt-1">
                                  {photo.analysis.special_rules.autres_objets.listed_items?.join(', ') || 'Aucun objet listé'}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-xs text-gray-700 font-mono">
                                  Regroupés
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-sm font-bold text-orange-600">{roundUpVolume(photo.analysis.special_rules.autres_objets.volume_m3 || 0)}</span>
                              </td>
                              <td className="p-3">
                                <span className="text-xs text-orange-600">Objets petits regroupés</span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: '85%' }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">85%</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Version mobile - Cards */}
                    <div className="lg:hidden space-y-4">
                      {photo.analysis.items?.map((item: TInventoryItem, itemIndex: number) => {
                        // Générer les notes avec fragile si applicable
                        const notes = getEnrichedNotes(item);
                        
                        // Vérifier si l'objet est sélectionné
                        const isSelected = isItemSelected(photo, itemIndex);
                        
                        return (
                          <div key={itemIndex} className={`bg-white p-4 rounded-lg border shadow-sm ${!isSelected ? 'opacity-50 bg-gray-50' : ''}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start space-x-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleItemSelection(photoIndex, itemIndex)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    item.category === 'furniture' ? 'bg-blue-100 text-blue-800' :
                                    item.category === 'appliance' ? 'bg-green-100 text-green-800' :
                                    item.category === 'fragile' ? 'bg-red-100 text-red-800' :
                                    item.category === 'box' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {translateCategory(item.category)}
                                  </span>
                                    <span className="text-sm font-bold text-blue-600">{roundUpVolume(item.volume_m3 || 0)} m³</span>
                                  </div>
                                  <h4 className="font-semibold text-gray-900 text-base mb-1">{enrichDescription(item)}</h4>
                                  {item.dimensions_cm && (
                                    <p className="text-sm text-gray-600 font-mono mb-2">
                                      {[item.dimensions_cm.length, item.dimensions_cm.width, item.dimensions_cm.height]
                                        .filter(Boolean)
                                        .join(' × ')} cm
                                    </p>
                                  )}
                                  {notes && (
                                    <p className="text-sm text-gray-600 mb-2">{notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${(item.confidence || 0) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{Math.round((item.confidence || 0) * 100)}%</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Card pour "autres objets" s'ils existent */}
                      {photo.analysis.special_rules?.autres_objets?.present && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3 flex-1">
                              <input
                                type="checkbox"
                                checked={true} // Par défaut sélectionné
                                onChange={() => {}} // Pas de toggle pour l'instant
                                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                    Divers
                                  </span>
                                  <span className="text-sm font-bold text-orange-600">{roundUpVolume(photo.analysis.special_rules.autres_objets.volume_m3 || 0)} m³</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 text-base mb-1">
                                  Autres objets ({photo.analysis.special_rules.autres_objets.listed_items?.length || 0} items)
                                </h4>
                                <p className="text-sm text-orange-600 mb-2">
                                  {photo.analysis.special_rules.autres_objets.listed_items?.join(', ') || 'Aucun objet listé'}
                                </p>
                                <p className="text-xs text-orange-500">Objets petits regroupés</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: '85%' }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">85%</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </>
                ) : photo.status === 'error' ? (
                  <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">❌</span>
                      <div>
                        <h4 className="text-lg font-semibold text-red-800">Erreur d'analyse</h4>
                        <p className="text-base text-red-600 mt-1">{photo.error}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <span className="text-4xl">{getStatusIcon(photo.status)}</span>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700">
                          {photo.status === 'uploaded' ? 'Photo uploadée' : 
                           photo.status === 'processing' ? 'Analyse en cours...' : 
                           'En attente d\'analyse...'}
                        </h4>
                        <p className="text-base text-gray-600 mt-1">
                          {photo.status === 'uploaded' ? 'L\'image sera analysée automatiquement' :
                           photo.status === 'processing' ? 'L\'IA détecte les objets...' :
                           'L\'image sera analysée automatiquement'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

        {/* Résumé des détections */}
        {currentRoom.photos.some(p => p.status === 'completed') && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-xl font-bold text-blue-800 mb-4">📋 Résumé des détections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {totalVolumeSelected.totalItems}
                  </div>
                  <div className="text-sm text-green-700">Quantité totale</div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {totalVolumeSelected.totalVolume}
                  </div>
                  <div className="text-sm text-purple-700">Volume total (m³)</div>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Version info - discrète en haut */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="text-xs text-gray-500 text-center">
            v {getBuildInfo()}
          </div>
        </div>
      </div>
      
      {/* Navigation par onglets */}
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

      {/* Contenu selon l'onglet actif */}
      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'tests' ? renderTestsInterface() : <BackOffice />}
      </div>
    </main>
  );
}