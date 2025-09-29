"use client";

import { useState, useEffect } from "react";
// import SocialAuth from "./SocialAuth"; // Désactivé

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'google' | 'facebook';
}

interface QuoteFormData {
  // Informations personnelles (remplis automatiquement par l'auth sociale)
  user?: User;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Adresses
  departureCity: string;
  departurePostalCode: string;
  departureFloor: string;
  departureElevator: boolean;
  departureArea: string;
  departureTruckAccess: boolean;
  departureMonteCharge: boolean;
  departureNarrowStairs: boolean;
  departureTimeRestrictions: boolean;
  
  arrivalCity: string;
  arrivalPostalCode: string;
  arrivalFloor: string;
  arrivalElevator: boolean;
  arrivalArea: string;
  arrivalTruckAccess: boolean;
  arrivalMonteCharge: boolean;
  arrivalNarrowStairs: boolean;
  arrivalTimeRestrictions: boolean;
  
  // Détails du déménagement
  movingDate: string;
  movingTime: string;
  flexibleDate: boolean;
  
  // Offre choisie
  selectedOffer: 'economique' | 'standard' | 'premium' | '';
  
  
  
  // Préférences de contact
  preferredContactMethod: 'email' | 'phone' | 'sms';
  contactTime: string;
}

interface QuoteFormProps {
  onNext: (formData: QuoteFormData) => void;
  onPrevious: () => void;
  initialData?: Partial<QuoteFormData>;
}

// Liste des villes françaises principales
const FRENCH_CITIES = Array.from(new Set([
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier',
  'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble',
  'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Saint-Denis', 'Le Mans', 'Aix-en-Provence',
  'Clermont-Ferrand', 'Brest', 'Tours', 'Amiens', 'Limoges', 'Annecy', 'Perpignan',
  'Boulogne-Billancourt', 'Orléans', 'Mulhouse', 'Rouen', 'Caen', 'Nancy', 'Saint-Denis',
  'Argenteuil', 'Montreuil', 'Roubaix', 'Tourcoing', 'Nanterre', 'Avignon', 'Créteil',
  'Dunkirk', 'Poitiers', 'Asnières-sur-Seine', 'Versailles', 'Courbevoie', 'Vitry-sur-Seine',
  'Colombes', 'Aulnay-sous-Bois', 'La Rochelle', 'Champigny-sur-Marne', 'Rueil-Malmaison',
  'Antibes', 'Saint-Maur-des-Fossés', 'Cannes', 'Aubervilliers', 'Béziers', 'Colmar',
  'Drancy', 'Mérignac', 'Saint-Nazaire', 'Issy-les-Moulineaux', 'Noisy-le-Grand', 'Évry',
  'Cergy', 'Pessac', 'Vénissieux', 'Troyes', 'Clichy', 'Antony', 'Levallois-Perret',
  'Neuilly-sur-Seine', 'Montauban', 'Sarcelles', 'Niort', 'Villejuif', 'Hyères', 'Cholet',
  'Narbonne', 'Lorient', 'Beauvais', 'Maisons-Alfort', 'Meudon', 'Châteauroux', 'Chelles',
  'Haguenau', 'Épinay-sur-Seine', 'Laval', 'Tarbes', 'Charleville-Mézières', 'Saint-Ouen',
  'Sète', 'Roanne', 'Pantin', 'Lens', 'Évreux', 'Livry-Gargan', 'Belfort', 'La Courneuve',
  'Sevran', 'Albi', 'Martigues', 'Corbeil-Essonnes', 'Bayonne', 'Gap', 'Massy', 'Vincennes',
  'Boulogne-sur-Mer', 'Montrouge', 'Saint-Priest', 'Noisy-le-Sec', 'Wattrelos', 'Alfortville',
  'Puteaux', 'Rosny-sous-Bois', 'Saint-Laurent-du-Var', 'Le Perreux-sur-Marne', 'Haguenau',
  'Sainte-Geneviève-des-Bois', 'Gennevilliers', 'Le Cannet', 'Valence', 'La Seyne-sur-Mer',
  'Thionville', 'Montluçon', 'Sarcelles', 'Châlons-en-Champagne', 'Chalon-sur-Saône',
  'Douai', 'Troyes', 'Nogent-sur-Marne', 'Les Abymes', 'Cayenne', 'Fort-de-France',
  'Saint-Pierre', 'Le Tampon', 'Mamoudzou', 'Saint-Benoît', 'Sainte-Marie', 'Le Lamentin'
]));

export default function QuoteForm({ onNext, onPrevious, initialData = {} }: QuoteFormProps) {
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const [user, setUser] = useState<User | null>(null);
  // const [authError, setAuthError] = useState<string | null>(null);
  
  // États pour le calcul de prix
  const [volume, setVolume] = useState(0);
  const [distance, setDistance] = useState(0);
  const [prices, setPrices] = useState({ economique: 0, standard: 0, premium: 0 });
  
  const [formData, setFormData] = useState<QuoteFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departureCity: '',
    departurePostalCode: '',
    departureFloor: '',
    departureElevator: false,
    departureArea: '',
    departureTruckAccess: false,
    departureMonteCharge: false,
    departureNarrowStairs: false,
    departureTimeRestrictions: false,
    arrivalCity: '',
    arrivalPostalCode: '',
    arrivalFloor: '',
    arrivalElevator: false,
    arrivalArea: '',
    arrivalTruckAccess: false,
    arrivalMonteCharge: false,
    arrivalNarrowStairs: false,
    arrivalTimeRestrictions: false,
    movingDate: '',
    movingTime: '09:00',
    flexibleDate: false,
    selectedOffer: '',
    preferredContactMethod: 'email',
    contactTime: '09:00-18:00',
    ...initialData
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Gestion de l'authentification sociale (désactivée)
  // const handleAuthSuccess = (authenticatedUser: User) => {
  //   setUser(authenticatedUser);
  //   setIsAuthenticated(true);
  //   setAuthError(null);
  //   
  //   // Pré-remplir les champs avec les données de l'utilisateur
  //   const nameParts = authenticatedUser.name.split(' ');
  //   setFormData(prev => ({
  //     ...prev,
  //     user: authenticatedUser,
  //     firstName: nameParts[0] || '',
  //     lastName: nameParts.slice(1).join(' ') || '',
  //     email: authenticatedUser.email || '',
  //   }));
  // };

  // const handleAuthError = (error: string) => {
  //   setAuthError(error);
  // };

  const handleInputChange = (field: keyof QuoteFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fonction pour calculer le volume basé sur la superficie
  const calculateVolume = (area: string): number => {
    // Conversion : 1 m² d'habitation = 0,3 m³ à déménager
    const areaMap: { [key: string]: number } = {
      'studio': 25,    // < 30m2 -> 25m2 * 0,3 = 7,5m3
      't2': 37,        // 30-45m2 -> 37m2 * 0,3 = 11,1m3
      't3': 57,        // 45-70m2 -> 57m2 * 0,3 = 17,1m3
      't4': 85,        // 70-100m2 -> 85m2 * 0,3 = 25,5m3
      't5': 115,       // 100-130m2 -> 115m2 * 0,3 = 34,5m3
      't6': 150,       // > 130m2 -> 150m2 * 0,3 = 45m3
      'maison': 200,   // Maison individuelle -> 200m2 * 0,3 = 60m3
      'autre': 100     // Autre (estimation moyenne) -> 100m2 * 0,3 = 30m3
    };
    
    const superficieM2 = areaMap[area] || 0;
    return Math.round(superficieM2 * 0.3 * 10) / 10; // Arrondi à 1 décimale
  };

  // Fonction pour calculer les prix selon le barème
  const calculatePrices = (volume: number, distance: number) => {
    // Vérifications de sécurité
    if (!volume || volume <= 0 || !distance || distance < 0) {
      return {
        economique: 0,
        standard: 0,
        premium: 0
      };
    }
    
    let rateEconomique = 0;
    let rateStandard = 0;
    let ratePremium = 0;
    
    if (distance < 100) {
      rateEconomique = 35;
      rateStandard = 40;
      ratePremium = 65;
    } else if (distance <= 500) {
      rateEconomique = 60;
      rateStandard = 95;
      ratePremium = 130;
    } else {
      rateEconomique = 110;
      rateStandard = 140;
      ratePremium = 160;
    }
    
    return {
      economique: Math.round(volume * rateEconomique * 100) / 100,
      standard: Math.round(volume * rateStandard * 100) / 100,
      premium: Math.round(volume * ratePremium * 100) / 100
    };
  };

  // Fonction pour calculer la distance entre deux villes (simulation)
  const calculateDistance = (departureCity: string, arrivalCity: string): number => {
    // Simulation basée sur des distances typiques en France
    if (!departureCity || !arrivalCity) return 0;
    
    // Distances approximatives entre grandes villes françaises
    const cityDistances: { [key: string]: { [key: string]: number } } = {
      'Paris': { 'Lyon': 460, 'Marseille': 775, 'Toulouse': 680, 'Bordeaux': 580, 'Lille': 220, 'Nantes': 380, 'Strasbourg': 490, 'La Rochelle': 470 },
      'Lyon': { 'Paris': 460, 'Marseille': 315, 'Toulouse': 540, 'Bordeaux': 550, 'Lille': 700, 'Nantes': 650, 'Strasbourg': 490, 'La Rochelle': 600 },
      'Marseille': { 'Paris': 775, 'Lyon': 315, 'Toulouse': 400, 'Bordeaux': 520, 'Lille': 900, 'Nantes': 800, 'Strasbourg': 700, 'La Rochelle': 650 },
      'Toulouse': { 'Paris': 680, 'Lyon': 540, 'Marseille': 400, 'Bordeaux': 250, 'Lille': 850, 'Nantes': 600, 'Strasbourg': 750, 'La Rochelle': 300 },
      'Bordeaux': { 'Paris': 580, 'Lyon': 550, 'Marseille': 520, 'Toulouse': 250, 'Lille': 700, 'Nantes': 350, 'Strasbourg': 800, 'La Rochelle': 200 },
      'Lille': { 'Paris': 220, 'Lyon': 700, 'Marseille': 900, 'Toulouse': 850, 'Bordeaux': 700, 'Nantes': 400, 'Strasbourg': 500, 'La Rochelle': 650 },
      'Nantes': { 'Paris': 380, 'Lyon': 650, 'Marseille': 800, 'Toulouse': 600, 'Bordeaux': 350, 'Lille': 400, 'Strasbourg': 700, 'La Rochelle': 150 },
      'Strasbourg': { 'Paris': 490, 'Lyon': 490, 'Marseille': 700, 'Toulouse': 750, 'Bordeaux': 800, 'Lille': 500, 'Nantes': 700, 'La Rochelle': 750 },
      'La Rochelle': { 'Paris': 470, 'Lyon': 600, 'Marseille': 650, 'Toulouse': 300, 'Bordeaux': 200, 'Lille': 650, 'Nantes': 150, 'Strasbourg': 750 }
    };

    // Normaliser les noms de villes (enlever accents, espaces, etc.)
    const normalizeCity = (city: string) => {
      return city.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
        .replace(/\s+/g, ' ') // Normaliser les espaces
        .trim();
    };
    
    const departure = normalizeCity(departureCity);
    const arrival = normalizeCity(arrivalCity);
    
    // Recherche exacte d'abord
    if (cityDistances[departure] && cityDistances[departure][arrival]) {
      return cityDistances[departure][arrival];
    }
    
    // Recherche inverse
    if (cityDistances[arrival] && cityDistances[arrival][departure]) {
      return cityDistances[arrival][departure];
    }
    
    // Estimation par défaut basée sur la taille des villes
    const citySizes: { [key: string]: number } = {
      'paris': 1000, 'lyon': 500, 'marseille': 400, 'toulouse': 300, 'bordeaux': 250, 'lille': 200, 'nantes': 200, 'strasbourg': 150, 'la rochelle': 120
    };
    
    const departureSize = citySizes[departure] || 100;
    const arrivalSize = citySizes[arrival] || 100;
    
    // Distance approximative basée sur la taille des villes
    return Math.abs(departureSize - arrivalSize) + 100;
  };

  // Mise à jour du volume et de la distance quand les données changent
  useEffect(() => {
    const departureArea = formData.departureArea;
    const arrivalArea = formData.arrivalArea;
    const departureCity = formData.departureCity;
    const arrivalCity = formData.arrivalCity;
    
    let newVolume = 0;
    let newDistance = 0;
    
    if (departureArea && arrivalArea) {
      const departureVolume = calculateVolume(departureArea);
      const arrivalVolume = calculateVolume(arrivalArea);
      newVolume = Math.max(departureVolume, arrivalVolume); // Prendre le plus grand
      setVolume(newVolume);
    }
    
    if (departureCity && arrivalCity) {
      newDistance = calculateDistance(departureCity, arrivalCity);
      setDistance(newDistance);
    }
    
    // Calculer les prix si on a volume et distance
    if (newVolume > 0 && newDistance > 0) {
      const newPrices = calculatePrices(newVolume, newDistance);
      setPrices(newPrices);
    }
  }, [formData.departureArea, formData.arrivalArea, formData.departureCity, formData.arrivalCity]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validation des champs obligatoires
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    
    if (!formData.departureCity.trim()) newErrors.departureCity = 'La ville de départ est requise';
    if (!formData.departurePostalCode.trim()) newErrors.departurePostalCode = 'Le code postal de départ est requis';
    
    if (!formData.arrivalCity.trim()) newErrors.arrivalCity = 'La ville d\'arrivée est requise';
    if (!formData.arrivalPostalCode.trim()) newErrors.arrivalPostalCode = 'Le code postal d\'arrivée est requis';
    
    if (!formData.movingDate) newErrors.movingDate = 'La date de déménagement est requise';
    
    if (!formData.selectedOffer) newErrors.selectedOffer = 'Veuillez choisir une offre';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Formulaire complet - plus d'authentification sociale */}
      <div>
          {/* En-tête du formulaire */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              📋 Remplissez votre demande de devis
            </h3>
            <p className="text-blue-600 text-sm">
              Tous les champs marqués d'un * sont obligatoires
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations personnelles */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">👤</span>
            Informations personnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre prénom"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre nom"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="votre@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="06 12 34 56 78"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Adresse de départ */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">🏠</span>
            Adresse de départ
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville *
                </label>
                <select
                  value={formData.departureCity}
                  onChange={(e) => handleInputChange('departureCity', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.departureCity ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez une ville</option>
                  {FRENCH_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.departureCity && <p className="text-red-500 text-xs mt-1">{errors.departureCity}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal *
                </label>
                <input
                  type="text"
                  value={formData.departurePostalCode}
                  onChange={(e) => handleInputChange('departurePostalCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.departurePostalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="33000"
                />
                {errors.departurePostalCode && <p className="text-red-500 text-xs mt-1">{errors.departurePostalCode}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Étage
                </label>
                <input
                  type="text"
                  value={formData.departureFloor}
                  onChange={(e) => handleInputChange('departureFloor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="RDC, 1er, 2ème..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Superficie
                </label>
                <select
                  value={formData.departureArea}
                  onChange={(e) => handleInputChange('departureArea', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner...</option>
                  <option value="studio">Studio (&lt; 30m2)</option>
                  <option value="t2">T2 (30-45m2)</option>
                  <option value="t3">T3 (45-70m2)</option>
                  <option value="t4">T4 (70-100m2)</option>
                  <option value="t5">T5 (100-130m2)</option>
                  <option value="t6">T6+ (&gt; 130m2)</option>
                  <option value="maison">Maison individuelle</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="departureElevator"
              checked={formData.departureElevator}
              onChange={(e) => handleInputChange('departureElevator', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="departureElevator" className="ml-2 text-sm text-gray-700">
              Ascenseur disponible
            </label>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Spécificités d'accès
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="departureTruckAccess"
                  checked={formData.departureTruckAccess}
                  onChange={(e) => handleInputChange('departureTruckAccess', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="departureTruckAccess" className="ml-2 text-sm text-gray-700">
                  🚛 Accessible camion
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="departureMonteCharge"
                  checked={formData.departureMonteCharge}
                  onChange={(e) => handleInputChange('departureMonteCharge', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="departureMonteCharge" className="ml-2 text-sm text-gray-700">
                  🛗 Prévoir monte-charge
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="departureNarrowStairs"
                  checked={formData.departureNarrowStairs}
                  onChange={(e) => handleInputChange('departureNarrowStairs', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="departureNarrowStairs" className="ml-2 text-sm text-gray-700">
                  🪜 Escalier étroit
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="departureTimeRestrictions"
                  checked={formData.departureTimeRestrictions}
                  onChange={(e) => handleInputChange('departureTimeRestrictions', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="departureTimeRestrictions" className="ml-2 text-sm text-gray-700">
                  ⏰ Horaires spécifiques
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Adresse d'arrivée */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">🎯</span>
            Adresse d'arrivée
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville *
                </label>
                <select
                  value={formData.arrivalCity}
                  onChange={(e) => handleInputChange('arrivalCity', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.arrivalCity ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez une ville</option>
                  {FRENCH_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.arrivalCity && <p className="text-red-500 text-xs mt-1">{errors.arrivalCity}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal *
                </label>
                <input
                  type="text"
                  value={formData.arrivalPostalCode}
                  onChange={(e) => handleInputChange('arrivalPostalCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.arrivalPostalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="33600"
                />
                {errors.arrivalPostalCode && <p className="text-red-500 text-xs mt-1">{errors.arrivalPostalCode}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Étage
                </label>
                <input
                  type="text"
                  value={formData.arrivalFloor}
                  onChange={(e) => handleInputChange('arrivalFloor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="RDC, 1er, 2ème..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Superficie
                </label>
                <select
                  value={formData.arrivalArea}
                  onChange={(e) => handleInputChange('arrivalArea', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner...</option>
                  <option value="studio">Studio (&lt; 30m2)</option>
                  <option value="t2">T2 (30-45m2)</option>
                  <option value="t3">T3 (45-70m2)</option>
                  <option value="t4">T4 (70-100m2)</option>
                  <option value="t5">T5 (100-130m2)</option>
                  <option value="t6">T6+ (&gt; 130m2)</option>
                  <option value="maison">Maison individuelle</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="arrivalElevator"
              checked={formData.arrivalElevator}
              onChange={(e) => handleInputChange('arrivalElevator', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="arrivalElevator" className="ml-2 text-sm text-gray-700">
              Ascenseur disponible
            </label>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Spécificités d'accès
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="arrivalTruckAccess"
                  checked={formData.arrivalTruckAccess}
                  onChange={(e) => handleInputChange('arrivalTruckAccess', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="arrivalTruckAccess" className="ml-2 text-sm text-gray-700">
                  🚛 Accessible camion
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="arrivalMonteCharge"
                  checked={formData.arrivalMonteCharge}
                  onChange={(e) => handleInputChange('arrivalMonteCharge', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="arrivalMonteCharge" className="ml-2 text-sm text-gray-700">
                  🛗 Prévoir monte-charge
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="arrivalNarrowStairs"
                  checked={formData.arrivalNarrowStairs}
                  onChange={(e) => handleInputChange('arrivalNarrowStairs', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="arrivalNarrowStairs" className="ml-2 text-sm text-gray-700">
                  🪜 Escalier étroit
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="arrivalTimeRestrictions"
                  checked={formData.arrivalTimeRestrictions}
                  onChange={(e) => handleInputChange('arrivalTimeRestrictions', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="arrivalTimeRestrictions" className="ml-2 text-sm text-gray-700">
                  ⏰ Horaires spécifiques
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Détails du déménagement */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">📅</span>
            Détails du déménagement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date souhaitée *
              </label>
              <input
                type="date"
                value={formData.movingDate}
                onChange={(e) => handleInputChange('movingDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.movingDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.movingDate && <p className="text-red-500 text-xs mt-1">{errors.movingDate}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure préférée
              </label>
              <select
                value={formData.movingTime}
                onChange={(e) => handleInputChange('movingTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="08:00">8h00 - 10h00</option>
                <option value="09:00">9h00 - 11h00</option>
                <option value="10:00">10h00 - 12h00</option>
                <option value="13:00">13h00 - 15h00</option>
                <option value="14:00">14h00 - 16h00</option>
                <option value="15:00">15h00 - 17h00</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="flexibleDate"
              checked={formData.flexibleDate}
              onChange={(e) => handleInputChange('flexibleDate', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="flexibleDate" className="ml-2 text-sm text-gray-700">
              Dates flexibles (± 3 jours)
            </label>
          </div>
        </div>

        {/* Choix de l'offre */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">📦</span>
            Choisissez votre offre
          </h3>
          <p className="text-gray-600 mb-6">
            Sélectionnez la formule qui correspond le mieux à vos besoins
          </p>
          
          <div className="space-y-4">
        {/* Offre Économique */}
        <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          formData.selectedOffer === 'economique' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}>
          <div className="flex items-start space-x-3">
            <input
              type="radio"
              id="offer-economique"
              name="selectedOffer"
              value="economique"
              checked={formData.selectedOffer === 'economique'}
              onChange={(e) => handleInputChange('selectedOffer', e.target.value)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <label htmlFor="offer-economique" className="cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">1. Économique</h4>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">💰</span>
                    {prices.economique > 0 && !isNaN(prices.economique) && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(Math.round(prices.economique * 0.9))} - {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(Math.round(prices.economique * 1.25))}
                        </div>
                        <div className="text-xs text-gray-500">estimation TTC</div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Transport simple du point A au point B
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  <li>✅ Chargement et déchargement par les déménageurs</li>
                  <li>❌ Pas de démontage ni remontage de meubles</li>
                  <li>❌ Pas de fourniture de cartons</li>
                  <li>❌ Pas d'emballage des affaires par l'équipe</li>
                </ul>
                <p className="text-xs text-blue-600 font-medium">
                  👉 Adapté aux clients qui préparent eux-mêmes cartons et meubles, et veulent réduire les coûts.
                </p>
              </label>
            </div>
          </div>
        </div>

            {/* Offre Standard */}
            <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              formData.selectedOffer === 'standard' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="offer-standard"
                  name="selectedOffer"
                  value="standard"
                  checked={formData.selectedOffer === 'standard'}
                  onChange={(e) => handleInputChange('selectedOffer', e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <label htmlFor="offer-standard" className="cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">2. Standard</h4>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">⭐</span>
                        {prices.standard > 0 && !isNaN(prices.standard) && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(Math.round(prices.standard * 0.9))} - {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(Math.round(prices.standard * 1.25))}
                            </div>
                            <div className="text-xs text-gray-500">estimation TTC</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Tous les services de la formule Économique
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-3">
                      <li>✅ Démontage et remontage basique des meubles standards</li>
                      <li>✅ Fourniture d'un lot de cartons classiques</li>
                      <li>✅ Aide à l'emballage des objets fragiles uniquement</li>
                    </ul>
                    <p className="text-xs text-blue-600 font-medium">
                      👉 Adapté aux familles ou particuliers qui veulent un accompagnement partiel.
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Offre Premium */}
            <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              formData.selectedOffer === 'premium' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="offer-premium"
                  name="selectedOffer"
                  value="premium"
                  checked={formData.selectedOffer === 'premium'}
                  onChange={(e) => handleInputChange('selectedOffer', e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <label htmlFor="offer-premium" className="cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">3. Premium</h4>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">👑</span>
                        {prices.premium > 0 && !isNaN(prices.premium) && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(Math.round(prices.premium * 0.9))} - {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(Math.round(prices.premium * 1.25))}
                            </div>
                            <div className="text-xs text-gray-500">estimation TTC</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Tous les services de la formule Standard
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-3">
                      <li>✅ Fourniture complète de tout le matériel d'emballage</li>
                      <li>✅ Emballage intégral des affaires par l'équipe</li>
                      <li>✅ Déballage et remise en place à l'arrivée</li>
                      <li>✅ Gestion des objets spéciaux incluse</li>
                    </ul>
                    <p className="text-xs text-blue-600 font-medium">
                      👉 Adapté aux clients qui veulent un déménagement clé en main, sans effort.
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {errors.selectedOffer && (
            <p className="text-red-500 text-sm mt-3">{errors.selectedOffer}</p>
          )}
          
      {/* Information sur le calcul des prix */}
      {volume > 0 && distance > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">ℹ️</span> Fourchettes calculées selon le barème officiel France : 
            <span className="font-semibold"> {volume}m³ × {prices.economique > 0 && volume > 0 ? Math.round(prices.economique / volume) : 0}€/m³</span> 
            (distance {distance}km). <br/>
            <span className="text-xs text-blue-600">
              💡 Conversion : 1m² d'habitation = 0,3m³ à déménager
            </span><br/>
            Les prix peuvent varier selon : étages/ascenseur, accès camion, saison, week-end, objets spéciaux.
          </p>
        </div>
      )}
        </div>




        {/* Préférences de contact */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">📞</span>
            Préférences de contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Méthode de contact préférée
              </label>
              <select
                value={formData.preferredContactMethod}
                onChange={(e) => handleInputChange('preferredContactMethod', e.target.value as 'email' | 'phone' | 'sms')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="email">Email</option>
                <option value="phone">Téléphone</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure de contact préférée
              </label>
              <select
                value={formData.contactTime}
                onChange={(e) => handleInputChange('contactTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="09:00-12:00">Matin (9h-12h)</option>
                <option value="09:00-18:00">Journée (9h-18h)</option>
                <option value="14:00-18:00">Après-midi (14h-18h)</option>
                <option value="18:00-20:00">Soirée (18h-20h)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Boutons de navigation */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Précédent
          </button>
          
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continuer vers la validation →
          </button>
        </div>
      </form>
    </div>
  </div>
);
}
