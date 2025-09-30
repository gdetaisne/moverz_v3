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
  'Aix-en-Provence', 'Albi', 'Alfortville', 'Amiens', 'Angers', 'Antibes', 'Antony', 'Argenteuil',
  'Asnières-sur-Seine', 'Aubervilliers', 'Avignon', 'Bayonne', 'Beauvais', 'Belfort', 'Béziers',
  'Bordeaux', 'Boulogne-Billancourt', 'Boulogne-sur-Mer', 'Brest', 'Caen', 'Cannes', 'Cayenne',
  'Châlons-en-Champagne', 'Chalon-sur-Saône', 'Champigny-sur-Marne', 'Charleville-Mézières',
  'Châteauroux', 'Chelles', 'Cholet', 'Clermont-Ferrand', 'Clichy', 'Colmar', 'Colombes',
  'Corbeil-Essonnes', 'Courbevoie', 'Créteil', 'Dijon', 'Douai', 'Drancy', 'Dunkirk', 'Épinay-sur-Seine',
  'Évry', 'Fort-de-France', 'Gap', 'Gennevilliers', 'Grenoble', 'Haguenau', 'Hyères', 'Issy-les-Moulineaux',
  'La Courneuve', 'La Rochelle', 'La Seyne-sur-Mer', 'Le Cannet', 'Le Havre', 'Le Lamentin', 'Le Mans',
  'Le Perreux-sur-Marne', 'Le Tampon', 'Levallois-Perret', 'Lille', 'Limoges', 'Lorient', 'Lyon',
  'Mamoudzou', 'Marseille', 'Martigues', 'Massy', 'Maisons-Alfort', 'Mamoudzou', 'Marseille', 'Martigues',
  'Massy', 'Meudon', 'Montauban', 'Montluçon', 'Montpellier', 'Montreuil', 'Montrouge', 'Mulhouse',
  'Nancy', 'Nanterre', 'Nantes', 'Neuilly-sur-Seine', 'Nice', 'Niort', 'Nîmes', 'Nogent-sur-Marne',
  'Noisy-le-Grand', 'Noisy-le-Sec', 'Orléans', 'Pantin', 'Paris', 'Perpignan', 'Pessac', 'Poitiers',
  'Puteaux', 'Reims', 'Rennes', 'Roanne', 'Roubaix', 'Rouen', 'Rueil-Malmaison', 'Saint-Benoît',
  'Saint-Denis', 'Saint-Laurent-du-Var', 'Saint-Maur-des-Fossés', 'Saint-Nazaire', 'Saint-Ouen',
  'Saint-Pierre', 'Saint-Priest', 'Sainte-Geneviève-des-Bois', 'Sainte-Marie', 'Sarcelles', 'Sevran',
  'Sète', 'Strasbourg', 'Tarbes', 'Thionville', 'Toulon', 'Toulouse', 'Tourcoing', 'Tours', 'Troyes',
  'Valence', 'Vénissieux', 'Versailles', 'Villejuif', 'Villeurbanne', 'Vincennes', 'Vitry-sur-Seine',
  'Wattrelos'
])).sort();

export default function QuoteForm({ onNext, onPrevious, initialData = {} }: QuoteFormProps) {
  // console.log('🔄 [QUOTEFORM] Composant rendu avec props:', { onNext: !!onNext, onPrevious: !!onPrevious, initialData });
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
  const [postalCodeSuggestions, setPostalCodeSuggestions] = useState<{
    departure: string[];
    arrival: string[];
  }>({ departure: [], arrival: [] });
  const [showSuggestions, setShowSuggestions] = useState<{
    departure: boolean;
    arrival: boolean;
  }>({ departure: false, arrival: false });

  // Mettre à jour le formulaire quand initialData change (persistance)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    const savedFormData = localStorage.getItem('moverz_form_data');
    if (savedFormData) {
      try {
        const data = JSON.parse(savedFormData);
        setFormData(prev => ({
          ...prev,
          ...data
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des données du formulaire:', error);
      }
    }
  }, []);

  // Sauvegarder automatiquement les données du formulaire
  useEffect(() => {
    // Sauvegarder dans localStorage toutes les 2 secondes
    const interval = setInterval(() => {
      localStorage.setItem('moverz_form_data', JSON.stringify(formData));
    }, 2000);

    // Sauvegarder immédiatement
    localStorage.setItem('moverz_form_data', JSON.stringify(formData));

    return () => clearInterval(interval);
  }, [formData]);

  // Fonction pour récupérer les codes postaux basés sur la ville
  const getPostalCodesForCity = async (city: string, type: 'departure' | 'arrival') => {
    if (!city || city.length < 2) {
      setPostalCodeSuggestions(prev => ({
        ...prev,
        [type]: []
      }));
      return;
    }

    try {
      // Utiliser l'API gouvernementale française pour les codes postaux
      const response = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(city)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        const postalCodes = data.map((commune: any) => commune.codesPostaux).flat();
        setPostalCodeSuggestions(prev => ({
          ...prev,
          [type]: postalCodes
        }));
        // Afficher les suggestions automatiquement
        setShowSuggestions(prev => ({
          ...prev,
          [type]: postalCodes.length > 0
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des codes postaux:', error);
      // Fallback avec quelques codes postaux courants pour les grandes villes
      const fallbackCodes: { [key: string]: string[] } = {
        'paris': ['75001', '75002', '75003', '75004', '75005', '75006', '75007', '75008', '75009', '75010', '75011', '75012', '75013', '75014', '75015', '75016', '75017', '75018', '75019', '75020'],
        'lyon': ['69001', '69002', '69003', '69004', '69005', '69006', '69007', '69008', '69009'],
        'marseille': ['13001', '13002', '13003', '13004', '13005', '13006', '13007', '13008', '13009', '13010', '13011', '13012', '13013', '13014', '13015', '13016'],
        'toulouse': ['31000', '31100', '31200', '31300', '31400', '31500'],
        'nice': ['06000', '06100', '06200', '06300'],
        'nantes': ['44000', '44100', '44200', '44300'],
        'strasbourg': ['67000', '67100', '67200'],
        'montpellier': ['34000', '34070', '34080', '34090'],
        'bordeaux': ['33000', '33100', '33200', '33300', '33400', '33500'],
        'lille': ['59000', '59100', '59200', '59300', '59400', '59500', '59600', '59700', '59800']
      };
      
      const cityKey = city.toLowerCase().replace(/[^a-z]/g, '');
      const fallbackPostalCodes = fallbackCodes[cityKey] || [];
      
      setPostalCodeSuggestions(prev => ({
        ...prev,
        [type]: fallbackPostalCodes
      }));
      // Afficher les suggestions automatiquement
      setShowSuggestions(prev => ({
        ...prev,
        [type]: fallbackPostalCodes.length > 0
      }));
    }
  };

  // Effet pour récupérer les codes postaux quand la ville change
  useEffect(() => {
    if (formData.departureCity) {
      getPostalCodesForCity(formData.departureCity, 'departure');
    }
  }, [formData.departureCity]);

  useEffect(() => {
    if (formData.arrivalCity) {
      getPostalCodesForCity(formData.arrivalCity, 'arrival');
    }
  }, [formData.arrivalCity]);

  // Effet pour masquer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.postal-code-field')) {
        setShowSuggestions({ departure: false, arrival: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
    const estimatedDistance = Math.abs(departureSize - arrivalSize) + 100;
    
    // Si les villes ne sont pas reconnues, utiliser une distance par défaut de 200km
    // (plus réaliste que 100km pour un déménagement inter-villes)
    return estimatedDistance > 50 ? estimatedDistance : 200;
  };

  // Mise à jour du volume et de la distance quand les données changent
  useEffect(() => {
    const departureArea = formData.departureArea;
    const departureCity = formData.departureCity;
    const arrivalCity = formData.arrivalCity;
    
    let newVolume = 0;
    let newDistance = 0;
    
    // Le volume est calculé uniquement à partir de la superficie de départ
    if (departureArea) {
      newVolume = calculateVolume(departureArea);
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
  }, [formData.departureArea, formData.departureCity, formData.arrivalCity]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    console.log('🔍 [VALIDATION] Début de la validation...');

    // Validation des champs obligatoires
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
      console.log('❌ [VALIDATION] Email manquant');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
      console.log('❌ [VALIDATION] Email invalide:', formData.email);
    } else {
      console.log('✅ [VALIDATION] Email OK:', formData.email);
    }
    
    if (!formData.departureCity.trim()) {
      newErrors.departureCity = 'La ville de départ est requise';
      console.log('❌ [VALIDATION] Ville de départ manquante');
    } else {
      console.log('✅ [VALIDATION] Ville de départ OK:', formData.departureCity);
    }
    
    if (!formData.departurePostalCode.trim()) {
      newErrors.departurePostalCode = 'Le code postal de départ est requis';
      console.log('❌ [VALIDATION] Code postal départ manquant');
    } else {
      console.log('✅ [VALIDATION] Code postal départ OK:', formData.departurePostalCode);
    }
    
    if (!formData.arrivalCity.trim()) {
      newErrors.arrivalCity = 'La ville d\'arrivée est requise';
      console.log('❌ [VALIDATION] Ville d\'arrivée manquante');
    } else {
      console.log('✅ [VALIDATION] Ville d\'arrivée OK:', formData.arrivalCity);
    }
    
    if (!formData.arrivalPostalCode.trim()) {
      newErrors.arrivalPostalCode = 'Le code postal d\'arrivée est requis';
      console.log('❌ [VALIDATION] Code postal arrivée manquant');
    } else {
      console.log('✅ [VALIDATION] Code postal arrivée OK:', formData.arrivalPostalCode);
    }
    
    if (!formData.movingDate) {
      newErrors.movingDate = 'La date de déménagement est requise';
      console.log('❌ [VALIDATION] Date de déménagement manquante');
    } else {
      console.log('✅ [VALIDATION] Date de déménagement OK:', formData.movingDate);
    }
    
    if (!formData.selectedOffer) {
      newErrors.selectedOffer = 'Veuillez choisir une offre';
      console.log('❌ [VALIDATION] Offre non sélectionnée');
    } else {
      console.log('✅ [VALIDATION] Offre OK:', formData.selectedOffer);
    }

    console.log('📊 [VALIDATION] Résultat final:', {
      erreurs: Object.keys(newErrors),
      valide: Object.keys(newErrors).length === 0
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 [DEBUG] Bouton Continuer cliqué');
    console.log('📋 [DEBUG] Données actuelles:', formData);
    
    const isValid = validateForm();
    console.log('✅ [DEBUG] Formulaire valide:', isValid);
    console.log('❌ [DEBUG] Erreurs détectées:', errors);
    
    if (isValid) {
      console.log('🚀 [DEBUG] Appel de onNext...');
      onNext(formData);
    } else {
      console.log('🛑 [DEBUG] Formulaire invalide - soumission bloquée');
      console.log('📝 [DEBUG] Champs manquants:', Object.keys(errors));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* En-tête supprimé - on sait pourquoi on est là */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg text-base ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="votre@email.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Adresse de départ */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏠 Adresse de départ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <select
                value={formData.departureCity}
                onChange={(e) => handleInputChange('departureCity', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg text-base ${
                  errors.departureCity ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionnez une ville</option>
                {FRENCH_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.departureCity && <p className="text-red-500 text-sm mt-1">{errors.departureCity}</p>}
            </div>
            
            <div className="relative postal-code-field">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code postal *
              </label>
              <input
                type="text"
                value={formData.departurePostalCode}
                onChange={(e) => handleInputChange('departurePostalCode', e.target.value)}
                onFocus={() => setShowSuggestions(prev => ({ ...prev, departure: true }))}
                className={`w-full px-3 py-3 border rounded-lg text-base ${
                  errors.departurePostalCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="33000"
                list="departure-postal-codes"
              />
              <datalist id="departure-postal-codes">
                {postalCodeSuggestions.departure.map((code, index) => (
                  <option key={index} value={code} />
                ))}
              </datalist>
              {showSuggestions.departure && postalCodeSuggestions.departure.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                  {postalCodeSuggestions.departure.slice(0, 5).map((code, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        handleInputChange('departurePostalCode', code);
                        setShowSuggestions(prev => ({ ...prev, departure: false }));
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
              {errors.departurePostalCode && <p className="text-red-500 text-sm mt-1">{errors.departurePostalCode}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Étage
              </label>
              <input
                type="text"
                value={formData.departureFloor}
                onChange={(e) => handleInputChange('departureFloor', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
                placeholder="RDC, 1er, 2ème..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Superficie
              </label>
              <select
                value={formData.departureArea}
                onChange={(e) => handleInputChange('departureArea', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
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
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="departureElevator"
                checked={formData.departureElevator}
                onChange={(e) => handleInputChange('departureElevator', e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <label htmlFor="departureElevator" className="ml-3 text-sm text-gray-700">
                Ascenseur disponible
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="departureTruckAccess"
                checked={formData.departureTruckAccess}
                onChange={(e) => handleInputChange('departureTruckAccess', e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <label htmlFor="departureTruckAccess" className="ml-3 text-sm text-gray-700">
                Accessible camion
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="departureMonteCharge"
                checked={formData.departureMonteCharge}
                onChange={(e) => handleInputChange('departureMonteCharge', e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <label htmlFor="departureMonteCharge" className="ml-3 text-sm text-gray-700">
                Prévoir monte-charge
              </label>
            </div>
          </div>
        </div>

        {/* Adresse d'arrivée */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Adresse d'arrivée</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <select
                value={formData.arrivalCity}
                onChange={(e) => handleInputChange('arrivalCity', e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg text-base ${
                  errors.arrivalCity ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionnez une ville</option>
                {FRENCH_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.arrivalCity && <p className="text-red-500 text-sm mt-1">{errors.arrivalCity}</p>}
            </div>
            
            <div className="relative postal-code-field">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code postal *
              </label>
              <input
                type="text"
                value={formData.arrivalPostalCode}
                onChange={(e) => handleInputChange('arrivalPostalCode', e.target.value)}
                onFocus={() => setShowSuggestions(prev => ({ ...prev, arrival: true }))}
                className={`w-full px-3 py-3 border rounded-lg text-base ${
                  errors.arrivalPostalCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="33600"
                list="arrival-postal-codes"
              />
              <datalist id="arrival-postal-codes">
                {postalCodeSuggestions.arrival.map((code, index) => (
                  <option key={index} value={code} />
                ))}
              </datalist>
              {showSuggestions.arrival && postalCodeSuggestions.arrival.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                  {postalCodeSuggestions.arrival.slice(0, 5).map((code, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        handleInputChange('arrivalPostalCode', code);
                        setShowSuggestions(prev => ({ ...prev, arrival: false }));
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
              {errors.arrivalPostalCode && <p className="text-red-500 text-sm mt-1">{errors.arrivalPostalCode}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Étage
              </label>
              <input
                type="text"
                value={formData.arrivalFloor}
                onChange={(e) => handleInputChange('arrivalFloor', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
                placeholder="RDC, 1er, 2ème..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Superficie
              </label>
              <select
                value={formData.arrivalArea}
                onChange={(e) => handleInputChange('arrivalArea', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
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
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="arrivalElevator"
                checked={formData.arrivalElevator}
                onChange={(e) => handleInputChange('arrivalElevator', e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <label htmlFor="arrivalElevator" className="ml-3 text-sm text-gray-700">
                Ascenseur disponible
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="arrivalTruckAccess"
                checked={formData.arrivalTruckAccess}
                onChange={(e) => handleInputChange('arrivalTruckAccess', e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <label htmlFor="arrivalTruckAccess" className="ml-3 text-sm text-gray-700">
                Accessible camion
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="arrivalMonteCharge"
                checked={formData.arrivalMonteCharge}
                onChange={(e) => handleInputChange('arrivalMonteCharge', e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
              <label htmlFor="arrivalMonteCharge" className="ml-3 text-sm text-gray-700">
                Prévoir monte-charge
              </label>
            </div>
          </div>
        </div>

        {/* Détails du déménagement */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Détails du déménagement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date souhaitée *
              </label>
              <input
                type="date"
                value={formData.movingDate}
                onChange={(e) => handleInputChange('movingDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-3 border rounded-lg text-base ${
                  errors.movingDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.movingDate && <p className="text-red-500 text-sm mt-1">{errors.movingDate}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure préférée
              </label>
              <select
                value={formData.movingTime}
                onChange={(e) => handleInputChange('movingTime', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
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
              className="h-5 w-5 text-blue-600 rounded"
            />
            <label htmlFor="flexibleDate" className="ml-3 text-sm text-gray-700">
              Dates flexibles (± 3 jours)
            </label>
          </div>
        </div>

        {/* Choix de l'offre */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Choisissez votre offre</h3>
          
          <div className="space-y-3">
            {/* Offre Économique */}
            <div className={`border-2 rounded-lg p-4 cursor-pointer ${
              formData.selectedOffer === 'economique' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="offer-economique"
                  name="selectedOffer"
                  value="economique"
                  checked={formData.selectedOffer === 'economique'}
                  onChange={(e) => handleInputChange('selectedOffer', e.target.value)}
                  className="h-5 w-5 text-blue-600"
                />
                <div className="flex-1">
                  <label htmlFor="offer-economique" className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Économique</h4>
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
                          <div className="text-xs text-gray-500">TTC</div>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <p className="font-medium">Transport simple A → B</p>
                      <ul className="text-xs mt-1 space-y-1">
                        <li>• Transport de vos objets personnels</li>
                        <li>• Équipe de déménageurs professionnels</li>
                        <li>• Véhicule adapté au volume</li>
                        <li>• Assurance transport de base</li>
                      </ul>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Offre Standard */}
            <div className={`border-2 rounded-lg p-4 cursor-pointer ${
              formData.selectedOffer === 'standard' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="offer-standard"
                  name="selectedOffer"
                  value="standard"
                  checked={formData.selectedOffer === 'standard'}
                  onChange={(e) => handleInputChange('selectedOffer', e.target.value)}
                  className="h-5 w-5 text-blue-600"
                />
                <div className="flex-1">
                  <label htmlFor="offer-standard" className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Standard</h4>
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
                          <div className="text-xs text-gray-500">TTC</div>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <p className="font-medium">Avec démontage et cartons</p>
                      <ul className="text-xs mt-1 space-y-1">
                        <li>• Tout de l'offre Économique</li>
                        <li>• Démontage/remontage mobilier</li>
                        <li>• Fourniture de cartons et matériel</li>
                        <li>• Emballage des objets fragiles</li>
                        <li>• Assurance transport étendue</li>
                      </ul>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Offre Premium */}
            <div className={`border-2 rounded-lg p-4 cursor-pointer ${
              formData.selectedOffer === 'premium' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="offer-premium"
                  name="selectedOffer"
                  value="premium"
                  checked={formData.selectedOffer === 'premium'}
                  onChange={(e) => handleInputChange('selectedOffer', e.target.value)}
                  className="h-5 w-5 text-blue-600"
                />
                <div className="flex-1">
                  <label htmlFor="offer-premium" className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Premium</h4>
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
                          <div className="text-xs text-gray-500">TTC</div>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <p className="font-medium">Clé en main complet</p>
                      <ul className="text-xs mt-1 space-y-1">
                        <li>• Tout de l'offre Standard</li>
                        <li>• Déballage et rangement</li>
                        <li>• Installation électroménager</li>
                        <li>• Nettoyage après déménagement</li>
                        <li>• Assurance tous risques</li>
                        <li>• Service client prioritaire</li>
                      </ul>
                    </div>
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

        {/* Boutons de navigation */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-base font-medium"
          >
            ← Précédent
          </button>
          
          <button
            type="submit"
            onClick={() => console.log('🖱️ [DEBUG] Bouton Continuer cliqué directement')}
            className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
          >
            Continuer →
          </button>
        </div>
      </form>
    </div>
  );
}
