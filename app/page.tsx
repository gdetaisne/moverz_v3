"use client";
import { useState } from "react";
import BackOffice from "@/components/BackOffice";

interface ProcessingFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
}

interface RoomData {
  id: string;
  name: string;
  photos: {
    file: File;
    analysis?: any;
    status: 'pending' | 'processing' | 'completed' | 'error';
    error?: string;
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

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setLoading(true);
    
    // Initialiser les photos pour la pièce actuelle
    const newPhotos = files.map(file => ({
      file,
      status: 'pending' as const
    }));
    
    setCurrentRoom(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
    
    // Traiter chaque photo
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoIndex = currentRoom.photos.length + i;
      
      // Marquer comme en cours de traitement
      setCurrentRoom(prev => ({
        ...prev,
        photos: prev.photos.map((photo, idx) => 
          idx === photoIndex ? { ...photo, status: 'processing' } : photo
        )
      }));
      
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/photos/analyze", { method: "POST", body: fd });
        const result = await res.json();
        
        if (res.ok) {
          // Marquer comme terminé avec le résultat
          setCurrentRoom(prev => ({
            ...prev,
            photos: prev.photos.map((photo, idx) => 
              idx === photoIndex ? { ...photo, status: 'completed', analysis: result } : photo
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
            idx === photoIndex ? { ...photo, status: 'error', error: errorMsg } : photo
          )
        }));
      }
    }
    
    setLoading(false);
  }


  const getTotalVolumeSelected = () => {
    let totalVolume = 0;
    let totalItems = 0;

    currentRoom.photos.forEach(photo => {
      if (photo.status === 'completed' && photo.analysis?.items) {
        photo.analysis.items.forEach((item: any) => {
          totalVolume += (item.volume_m3 || 0) * (item.quantity || 1);
          totalItems += item.quantity || 1;
        });
      }
    });

    return { totalVolume: Number(totalVolume.toFixed(3)), totalItems };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
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

  const enrichDescription = (item: any) => {
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
      <div className="flex justify-between items-center mb-8 p-6 bg-white rounded-xl shadow-sm border">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Analyse IA — Inventaire Déménagement</h1>
          <p className="text-lg text-gray-600">Détection automatique des objets pour votre déménagement</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-xl font-bold text-blue-600">{currentRoom.name}</div>
            <div className="text-sm text-gray-700">{currentRoom.photos.length} photo(s) ajoutée(s)</div>
          </div>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={onUpload}
            className="block text-base text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-base file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors"
          />
        </div>
      </div>

      {loading && (
        <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin text-blue-600 text-xl">🔄</div>
            <div>
              <h4 className="text-lg font-semibold text-blue-800">Analyse en cours...</h4>
              <p className="text-base text-blue-600">
                {currentRoom.photos.filter(p => p.status === 'completed').length}/{currentRoom.photos.length} photo(s) analysée(s)
              </p>
            </div>
          </div>
        </div>
      )}

        {/* Volume total de tous les objets */}
        {currentRoom.photos.some(p => p.status === 'completed') && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">📦 Volume Total Détecté</h3>
                <p className="text-blue-100">Somme des volumes de tous les objets détectés</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold mb-1">{getTotalVolumeSelected().totalVolume}</div>
                <div className="text-lg font-semibold text-blue-200">m³</div>
                <div className="text-sm text-blue-100 mt-1">
                  {getTotalVolumeSelected().totalItems} objet(s) détecté(s)
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Interface principale par pièce */}
      <div className="space-y-8">
        {currentRoom.photos.map((photo, photoIndex) => (
          <div key={photoIndex} className="border rounded-xl p-6 bg-white shadow-sm">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Côté gauche - Image */}
              <div className="xl:col-span-1 space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {photo.status === 'completed' ? (
                    <img 
                      src={URL.createObjectURL(photo.file)} 
                      alt={`Photo ${photoIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="text-4xl mb-2">{getStatusIcon(photo.status)}</div>
                      <div className="text-sm text-gray-600">
                        {photo.status === 'pending' && 'En attente...'}
                        {photo.status === 'processing' && 'Analyse en cours...'}
                        {photo.status === 'error' && photo.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Côté droit - Tableau de données */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-xl font-bold text-gray-800">Objets détectés</h3>
                  {photo.status === 'completed' && (
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {photo.analysis?.items?.length || 0} objet(s) détecté(s)
                      </span>
                    </div>
                  )}
                </div>

                {photo.status === 'completed' && photo.analysis ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-base border-collapse bg-white rounded-lg shadow-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left p-3 font-semibold text-gray-700 w-24">Type</th>
                          <th className="text-left p-3 font-semibold text-gray-700 min-w-40">Description</th>
                          <th className="text-left p-3 font-semibold text-gray-700 w-32">Mesures</th>
                          <th className="text-left p-3 font-semibold text-gray-700 w-20">m³</th>
                          <th className="text-left p-3 font-semibold text-gray-700 w-32">Notes</th>
                          <th className="text-left p-3 font-semibold text-gray-700 w-24">Confiance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {photo.analysis.items?.map((item: any, itemIndex: number) => {
                          // Générer les notes avec fragile si applicable
                          let notes = item.notes || '';
                          if (item.fragile && !notes.toLowerCase().includes('fragile')) {
                            notes = notes ? `${notes} | Fragile !` : 'Fragile !';
                          }
                          
                          return (
                            <tr key={itemIndex} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
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
                                <span className="text-sm font-bold text-blue-600">{item.volume_m3 || 0}</span>
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
                      </tbody>
                    </table>
                  </div>
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
                          {photo.status === 'pending' ? 'En attente d\'analyse...' : 'Analyse en cours...'}
                        </h4>
                        <p className="text-base text-gray-600 mt-1">
                          {photo.status === 'pending' ? 'L\'image sera analysée automatiquement' : 'L\'IA détecte les objets...'}
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
                    {getTotalVolumeSelected().totalItems}
                  </div>
                  <div className="text-sm text-green-700">Quantité totale</div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {getTotalVolumeSelected().totalVolume}
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
      {/* Navigation par onglets */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('tests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🧪 Tests
            </button>
            <button
              onClick={() => setActiveTab('backoffice')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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