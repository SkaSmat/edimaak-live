// Region mapping for geographic proximity matching
// Cities in the same region are considered "close" (~100km)

export interface RegionInfo {
  name: string;
  cities: string[];
}

// Region mappings by country code
export const REGIONS_BY_COUNTRY: Record<string, RegionInfo[]> = {
  // Algeria - Grouped by geographic regions
  DZ: [
    { name: "Région d'Alger", cities: ["Alger", "Blida", "Boumerdès", "Tipaza", "Médéa", "Chlef"] },
    { name: "Kabylie", cities: ["Tizi Ouzou", "Béjaïa", "Bouira", "Bordj Bou Arreridj"] },
    { name: "Région de Constantine", cities: ["Constantine", "Mila", "Jijel", "Skikda", "Oum El Bouaghi"] },
    { name: "Région d'Annaba", cities: ["Annaba", "El Tarf", "Guelma", "Souk Ahras"] },
    { name: "Région d'Oran", cities: ["Oran", "Aïn Témouchent", "Mostaganem", "Mascara", "Sidi Bel Abbès", "Relizane"] },
    { name: "Région de Tlemcen", cities: ["Tlemcen", "Saïda"] },
    { name: "Région de Sétif", cities: ["Sétif", "Bordj Bou Arréridj", "M'Sila"] },
    { name: "Région de Batna", cities: ["Batna", "Khenchela", "Tébessa", "Biskra"] },
    { name: "Sud algérien", cities: ["Ouargla", "Ghardaïa", "El Oued", "Laghouat", "Béchar", "Djelfa", "Adrar", "Tamanrasset"] },
  ],

  // France - Grouped by regions
  FR: [
    { name: "Île-de-France", cities: ["Paris", "Versailles", "Saint-Denis", "Argenteuil", "Montreuil", "Créteil", "Nanterre", "Boulogne-Billancourt"] },
    { name: "Provence-Alpes-Côte d'Azur", cities: ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Cannes", "Antibes"] },
    { name: "Auvergne-Rhône-Alpes", cities: ["Lyon", "Saint-Étienne", "Grenoble", "Villeurbanne", "Clermont-Ferrand", "Annecy", "Valence"] },
    { name: "Nouvelle-Aquitaine", cities: ["Bordeaux", "Limoges", "Poitiers", "Pau", "La Rochelle", "Bayonne", "Angoulême"] },
    { name: "Occitanie", cities: ["Toulouse", "Montpellier", "Nîmes", "Perpignan", "Béziers", "Narbonne", "Carcassonne"] },
    { name: "Hauts-de-France", cities: ["Lille", "Amiens", "Roubaix", "Tourcoing", "Dunkerque", "Calais", "Valenciennes"] },
    { name: "Grand Est", cities: ["Strasbourg", "Reims", "Metz", "Nancy", "Mulhouse", "Colmar", "Troyes"] },
    { name: "Pays de la Loire", cities: ["Nantes", "Angers", "Le Mans", "Saint-Nazaire", "Laval"] },
    { name: "Bretagne", cities: ["Rennes", "Brest", "Quimper", "Lorient", "Vannes", "Saint-Malo", "Saint-Brieuc"] },
    { name: "Normandie", cities: ["Rouen", "Le Havre", "Caen", "Cherbourg", "Évreux", "Dieppe"] },
    { name: "Centre-Val de Loire", cities: ["Tours", "Orléans", "Bourges", "Blois", "Chartres"] },
    { name: "Bourgogne-Franche-Comté", cities: ["Dijon", "Besançon", "Chalon-sur-Saône", "Auxerre", "Mâcon"] },
  ],

  // Belgium
  BE: [
    { name: "Bruxelles-Capitale", cities: ["Bruxelles", "Schaerbeek", "Anderlecht", "Ixelles", "Molenbeek"] },
    { name: "Région flamande", cities: ["Anvers", "Gand", "Bruges", "Louvain", "Malines", "Courtrai", "Ostende", "Hasselt"] },
    { name: "Wallonie", cities: ["Charleroi", "Liège", "Namur", "Mons", "La Louvière", "Tournai", "Verviers", "Arlon"] },
  ],

  // Morocco
  MA: [
    { name: "Grand Casablanca", cities: ["Casablanca", "Mohammedia", "El Jadida"] },
    { name: "Rabat-Salé-Kénitra", cities: ["Rabat", "Salé", "Kénitra", "Témara"] },
    { name: "Fès-Meknès", cities: ["Fès", "Meknès"] },
    { name: "Marrakech-Safi", cities: ["Marrakech", "Safi", "Essaouira"] },
    { name: "Tanger-Tétouan", cities: ["Tanger", "Tétouan", "Chefchaouen"] },
    { name: "Oriental", cities: ["Oujda", "Nador", "Berkane"] },
    { name: "Souss-Massa", cities: ["Agadir", "Taroudant", "Tiznit"] },
  ],

  // Tunisia
  TN: [
    { name: "Grand Tunis", cities: ["Tunis", "Ariana", "Ben Arous", "La Marsa", "La Goulette"] },
    { name: "Nord-Est", cities: ["Bizerte", "Nabeul", "Hammamet", "Sousse", "Monastir", "Mahdia"] },
    { name: "Centre", cities: ["Sfax", "Kairouan", "Kasserine", "Gafsa"] },
    { name: "Sud", cities: ["Gabès", "Médenine", "Djerba", "Tozeur", "Kébili"] },
  ],

  // Germany
  DE: [
    { name: "Berlin-Brandenburg", cities: ["Berlin", "Potsdam"] },
    { name: "Rhein-Ruhr", cities: ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Duisbourg", "Bochum", "Wuppertal"] },
    { name: "Munich", cities: ["Munich", "Augsbourg", "Ingolstadt"] },
    { name: "Francfort-Rhin-Main", cities: ["Francfort", "Wiesbaden", "Mayence", "Darmstadt"] },
    { name: "Hambourg", cities: ["Hambourg", "Brême", "Kiel", "Lübeck"] },
    { name: "Stuttgart", cities: ["Stuttgart", "Karlsruhe", "Mannheim", "Heidelberg"] },
  ],

  // Spain
  ES: [
    { name: "Madrid", cities: ["Madrid", "Alcalá de Henares", "Getafe", "Leganés", "Móstoles"] },
    { name: "Catalogne", cities: ["Barcelone", "Terrassa", "Badalona", "Sabadell", "Tarragone", "Gérone"] },
    { name: "Andalousie", cities: ["Séville", "Málaga", "Cordoue", "Grenade", "Cadix", "Almería", "Jerez"] },
    { name: "Valence", cities: ["Valence", "Alicante", "Elche", "Castellón"] },
    { name: "Pays Basque", cities: ["Bilbao", "Vitoria", "Saint-Sébastien"] },
  ],

  // Italy
  IT: [
    { name: "Lombardie", cities: ["Milan", "Brescia", "Bergame", "Monza", "Côme"] },
    { name: "Latium", cities: ["Rome", "Latina", "Viterbe"] },
    { name: "Campanie", cities: ["Naples", "Salerne", "Caserte"] },
    { name: "Piémont", cities: ["Turin", "Novare", "Alexandrie", "Asti"] },
    { name: "Vénétie", cities: ["Venise", "Vérone", "Padoue", "Vicence", "Trévise"] },
    { name: "Émilie-Romagne", cities: ["Bologne", "Parme", "Modène", "Reggio d'Émilie", "Ravenne"] },
    { name: "Toscane", cities: ["Florence", "Pise", "Livourne", "Sienne", "Prato"] },
    { name: "Sicile", cities: ["Palerme", "Catane", "Messine", "Syracuse"] },
  ],

  // United Kingdom
  GB: [
    { name: "Grand Londres", cities: ["Londres", "Westminster", "Camden", "Greenwich", "Croydon"] },
    { name: "Midlands", cities: ["Birmingham", "Coventry", "Nottingham", "Leicester", "Derby"] },
    { name: "Nord-Ouest", cities: ["Manchester", "Liverpool", "Sheffield", "Leeds", "Bradford"] },
    { name: "Écosse centrale", cities: ["Glasgow", "Édimbourg", "Dundee", "Aberdeen"] },
    { name: "Sud-Ouest", cities: ["Bristol", "Bath", "Exeter", "Plymouth"] },
  ],

  // Netherlands
  NL: [
    { name: "Randstad", cities: ["Amsterdam", "Rotterdam", "La Haye", "Utrecht", "Haarlem", "Leyde"] },
    { name: "Nord", cities: ["Groningue", "Leeuwarden", "Assen"] },
    { name: "Est", cities: ["Arnhem", "Nimègue", "Enschede", "Apeldoorn"] },
    { name: "Sud", cities: ["Eindhoven", "Tilburg", "Breda", "Maastricht"] },
  ],

  // United States - Major metro areas
  US: [
    { name: "New York Metro", cities: ["New York", "Newark", "Jersey City", "Yonkers", "Stamford"] },
    { name: "Los Angeles Metro", cities: ["Los Angeles", "Long Beach", "Anaheim", "Santa Ana", "Riverside", "San Bernardino"] },
    { name: "Chicago Metro", cities: ["Chicago", "Aurora", "Naperville", "Joliet", "Elgin"] },
    { name: "San Francisco Bay", cities: ["San Francisco", "Oakland", "San Jose", "Fremont", "Berkeley"] },
    { name: "Washington DC Metro", cities: ["Washington", "Baltimore", "Arlington", "Alexandria"] },
    { name: "Miami Metro", cities: ["Miami", "Fort Lauderdale", "West Palm Beach", "Hollywood"] },
    { name: "Dallas-Fort Worth", cities: ["Dallas", "Fort Worth", "Arlington", "Plano", "Irving"] },
    { name: "Boston Metro", cities: ["Boston", "Cambridge", "Worcester", "Providence"] },
  ],

  // Canada
  CA: [
    { name: "Grand Toronto", cities: ["Toronto", "Mississauga", "Brampton", "Hamilton", "Oshawa"] },
    { name: "Grand Montréal", cities: ["Montréal", "Laval", "Longueuil", "Gatineau"] },
    { name: "Grand Vancouver", cities: ["Vancouver", "Surrey", "Burnaby", "Richmond", "Coquitlam"] },
    { name: "Alberta", cities: ["Calgary", "Edmonton", "Red Deer"] },
    { name: "Ottawa-Gatineau", cities: ["Ottawa", "Gatineau"] },
  ],

  // Turkey
  TR: [
    { name: "Istanbul", cities: ["Istanbul", "Kocaeli", "Bursa", "Sakarya"] },
    { name: "Ankara", cities: ["Ankara", "Konya", "Eskişehir"] },
    { name: "Côte égéenne", cities: ["Izmir", "Antalya", "Denizli", "Aydın"] },
    { name: "Sud-Est", cities: ["Gaziantep", "Diyarbakır", "Şanlıurfa", "Adana", "Mersin"] },
  ],

  // UAE
  AE: [
    { name: "Dubaï-Sharjah", cities: ["Dubaï", "Charjah", "Ajman"] },
    { name: "Abu Dhabi", cities: ["Abu Dhabi", "Al-Aïn"] },
  ],

  // Saudi Arabia
  SA: [
    { name: "Riyad", cities: ["Riyad", "Al Kharj"] },
    { name: "Région Ouest", cities: ["Djeddah", "La Mecque", "Médine", "Taëf"] },
    { name: "Région Est", cities: ["Dammam", "Al Khobar", "Jubail", "Dhahran"] },
  ],
};

// Normalize city name for comparison (lowercase, remove accents, trim)
const normalizeCity = (city: string): string => {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim();
};

// Find the region for a given city and country
export const findRegionForCity = (city: string, countryCode: string): RegionInfo | null => {
  const regions = REGIONS_BY_COUNTRY[countryCode];
  if (!regions) return null;

  const normalizedCity = normalizeCity(city);
  
  for (const region of regions) {
    const normalizedRegionCities = region.cities.map(normalizeCity);
    if (normalizedRegionCities.some(c => c.includes(normalizedCity) || normalizedCity.includes(c))) {
      return region;
    }
  }
  
  return null;
};

// Check if two cities are in the same region
export const areCitiesInSameRegion = (
  city1: string,
  country1: string,
  city2: string,
  country2: string
): boolean => {
  // Must be same country
  if (country1.toLowerCase() !== country2.toLowerCase()) return false;
  
  // Find country code
  const countryCode = getCountryCode(country1);
  if (!countryCode) return false;
  
  const region1 = findRegionForCity(city1, countryCode);
  const region2 = findRegionForCity(city2, countryCode);
  
  if (!region1 || !region2) return false;
  
  return region1.name === region2.name;
};

// Get country code from country name
const getCountryCode = (countryName: string): string | null => {
  const countryMap: Record<string, string> = {
    "algérie": "DZ", "algeria": "DZ",
    "france": "FR",
    "belgique": "BE", "belgium": "BE",
    "maroc": "MA", "morocco": "MA",
    "tunisie": "TN", "tunisia": "TN",
    "allemagne": "DE", "germany": "DE",
    "espagne": "ES", "spain": "ES",
    "italie": "IT", "italy": "IT",
    "royaume-uni": "GB", "united kingdom": "GB", "uk": "GB",
    "pays-bas": "NL", "netherlands": "NL",
    "états-unis": "US", "united states": "US", "usa": "US",
    "canada": "CA",
    "turquie": "TR", "turkey": "TR",
    "émirats arabes unis": "AE", "uae": "AE",
    "arabie saoudite": "SA", "saudi arabia": "SA",
  };
  
  return countryMap[countryName.toLowerCase()] || null;
};

// Get the region name for display
export const getRegionName = (city: string, country: string): string | null => {
  const countryCode = getCountryCode(country);
  if (!countryCode) return null;
  
  const region = findRegionForCity(city, countryCode);
  return region?.name || null;
};

// Calculate date difference in days
export const getDateDifferenceInDays = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if a trip date is within flexible range of shipment dates
export const isDateFlexiblyCompatible = (
  tripDate: string,
  earliestDate: string,
  latestDate: string,
  toleranceDays: number = 3
): { isCompatible: boolean; isExact: boolean; daysDifference: number } => {
  const trip = new Date(tripDate);
  const earliest = new Date(earliestDate);
  const latest = new Date(latestDate);
  
  // Extend the range by tolerance days
  const extendedEarliest = new Date(earliest);
  extendedEarliest.setDate(extendedEarliest.getDate() - toleranceDays);
  
  const extendedLatest = new Date(latest);
  extendedLatest.setDate(extendedLatest.getDate() + toleranceDays);
  
  // Check exact match first
  const isExact = trip >= earliest && trip <= latest;
  
  // Check flexible match (within tolerance)
  const isWithinFlexibleRange = trip >= extendedEarliest && trip <= extendedLatest;
  
  // Calculate days difference from nearest date boundary
  let daysDifference = 0;
  if (!isExact && isWithinFlexibleRange) {
    if (trip < earliest) {
      daysDifference = getDateDifferenceInDays(tripDate, earliestDate);
    } else if (trip > latest) {
      daysDifference = getDateDifferenceInDays(tripDate, latestDate);
    }
  }
  
  return {
    isCompatible: isWithinFlexibleRange,
    isExact,
    daysDifference
  };
};

// Types for match quality
export type MatchType = 'exact' | 'flexible_date' | 'flexible_location' | 'flexible_both';

export interface FlexibleMatchInfo {
  matchType: MatchType;
  isExactDate: boolean;
  isExactLocation: boolean;
  dateDifference: number; // Days
  regionName?: string;
}

// Determine match type and info
export const getFlexibleMatchInfo = (
  tripDate: string,
  tripToCity: string,
  tripToCountry: string,
  shipmentEarliestDate: string,
  shipmentLatestDate: string,
  shipmentToCity: string,
  shipmentToCountry: string
): FlexibleMatchInfo | null => {
  // Check date compatibility
  const dateCheck = isDateFlexiblyCompatible(tripDate, shipmentEarliestDate, shipmentLatestDate);
  if (!dateCheck.isCompatible) return null;
  
  // Check location compatibility
  const normalizedTripCity = tripToCity.toLowerCase().trim();
  const normalizedShipmentCity = shipmentToCity.toLowerCase().trim();
  const isSameCountry = tripToCountry.toLowerCase() === shipmentToCountry.toLowerCase();
  
  if (!isSameCountry) return null;
  
  const isExactCity = normalizedTripCity.includes(normalizedShipmentCity) || 
                      normalizedShipmentCity.includes(normalizedTripCity);
  const isSameRegion = !isExactCity && areCitiesInSameRegion(
    tripToCity, tripToCountry, 
    shipmentToCity, shipmentToCountry
  );
  
  if (!isExactCity && !isSameRegion) return null;
  
  // Determine match type
  let matchType: MatchType;
  if (dateCheck.isExact && isExactCity) {
    matchType = 'exact';
  } else if (!dateCheck.isExact && !isExactCity) {
    matchType = 'flexible_both';
  } else if (!dateCheck.isExact) {
    matchType = 'flexible_date';
  } else {
    matchType = 'flexible_location';
  }
  
  return {
    matchType,
    isExactDate: dateCheck.isExact,
    isExactLocation: isExactCity,
    dateDifference: dateCheck.daysDifference,
    regionName: isSameRegion ? getRegionName(shipmentToCity, shipmentToCountry) || undefined : undefined
  };
};
