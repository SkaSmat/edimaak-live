// Complete world countries and cities data with intelligent search
// Organized by regions for better performance

export interface Country {
  code: string;
  name: string;
  emoji: string;
  searchTerms: string;
}

export interface City {
  name: string;
  country: string;
}

// All world countries with emoji flags
export const WORLD_COUNTRIES: Country[] = [
  // Europe
  { code: "FR", name: "France", emoji: "🇫🇷", searchTerms: "france fr" },
  { code: "DE", name: "Allemagne", emoji: "🇩🇪", searchTerms: "allemagne germany de deutschland" },
  { code: "ES", name: "Espagne", emoji: "🇪🇸", searchTerms: "espagne spain es españa" },
  { code: "IT", name: "Italie", emoji: "🇮🇹", searchTerms: "italie italy it italia" },
  { code: "GB", name: "Royaume-Uni", emoji: "🇬🇧", searchTerms: "royaume uni uk united kingdom angleterre england" },
  { code: "PT", name: "Portugal", emoji: "🇵🇹", searchTerms: "portugal pt" },
  { code: "NL", name: "Pays-Bas", emoji: "🇳🇱", searchTerms: "pays bas netherlands hollande holland nl" },
  { code: "BE", name: "Belgique", emoji: "🇧🇪", searchTerms: "belgique belgium be" },
  { code: "CH", name: "Suisse", emoji: "🇨🇭", searchTerms: "suisse switzerland ch schweiz" },
  { code: "AT", name: "Autriche", emoji: "🇦🇹", searchTerms: "autriche austria at österreich" },
  { code: "PL", name: "Pologne", emoji: "🇵🇱", searchTerms: "pologne poland pl polska" },
  { code: "CZ", name: "Tchéquie", emoji: "🇨🇿", searchTerms: "tchequie czechia czech republic cz" },
  { code: "SE", name: "Suède", emoji: "🇸🇪", searchTerms: "suede sweden se sverige" },
  { code: "NO", name: "Norvège", emoji: "🇳🇴", searchTerms: "norvege norway no norge" },
  { code: "DK", name: "Danemark", emoji: "🇩🇰", searchTerms: "danemark denmark dk danmark" },
  { code: "FI", name: "Finlande", emoji: "🇫🇮", searchTerms: "finlande finland fi suomi" },
  { code: "IE", name: "Irlande", emoji: "🇮🇪", searchTerms: "irlande ireland ie eire" },
  { code: "GR", name: "Grèce", emoji: "🇬🇷", searchTerms: "grece greece gr" },
  { code: "RO", name: "Roumanie", emoji: "🇷🇴", searchTerms: "roumanie romania ro" },
  { code: "HU", name: "Hongrie", emoji: "🇭🇺", searchTerms: "hongrie hungary hu magyarorszag" },
  { code: "SK", name: "Slovaquie", emoji: "🇸🇰", searchTerms: "slovaquie slovakia sk" },
  { code: "HR", name: "Croatie", emoji: "🇭🇷", searchTerms: "croatie croatia hr hrvatska" },
  { code: "BG", name: "Bulgarie", emoji: "🇧🇬", searchTerms: "bulgarie bulgaria bg" },
  { code: "RS", name: "Serbie", emoji: "🇷🇸", searchTerms: "serbie serbia rs" },
  { code: "SI", name: "Slovénie", emoji: "🇸🇮", searchTerms: "slovenie slovenia si" },
  { code: "LT", name: "Lituanie", emoji: "🇱🇹", searchTerms: "lituanie lithuania lt" },
  { code: "LV", name: "Lettonie", emoji: "🇱🇻", searchTerms: "lettonie latvia lv" },
  { code: "EE", name: "Estonie", emoji: "🇪🇪", searchTerms: "estonie estonia ee" },
  { code: "LU", name: "Luxembourg", emoji: "🇱🇺", searchTerms: "luxembourg lu" },
  { code: "MT", name: "Malte", emoji: "🇲🇹", searchTerms: "malte malta mt" },
  { code: "CY", name: "Chypre", emoji: "🇨🇾", searchTerms: "chypre cyprus cy" },
  { code: "IS", name: "Islande", emoji: "🇮🇸", searchTerms: "islande iceland is" },
  { code: "AL", name: "Albanie", emoji: "🇦🇱", searchTerms: "albanie albania al" },
  { code: "MK", name: "Macédoine du Nord", emoji: "🇲🇰", searchTerms: "macedoine north macedonia mk" },
  { code: "ME", name: "Monténégro", emoji: "🇲🇪", searchTerms: "montenegro me" },
  { code: "BA", name: "Bosnie-Herzégovine", emoji: "🇧🇦", searchTerms: "bosnie herzegovine bosnia ba" },
  { code: "MD", name: "Moldavie", emoji: "🇲🇩", searchTerms: "moldavie moldova md" },
  { code: "UA", name: "Ukraine", emoji: "🇺🇦", searchTerms: "ukraine ua" },
  { code: "BY", name: "Biélorussie", emoji: "🇧🇾", searchTerms: "bielorussie belarus by" },
  { code: "RU", name: "Russie", emoji: "🇷🇺", searchTerms: "russie russia ru" },

  // North Africa & Middle East
  { code: "DZ", name: "Algérie", emoji: "🇩🇿", searchTerms: "algerie algeria dz" },
  { code: "MA", name: "Maroc", emoji: "🇲🇦", searchTerms: "maroc morocco ma" },
  { code: "TN", name: "Tunisie", emoji: "🇹🇳", searchTerms: "tunisie tunisia tn" },
  { code: "EG", name: "Égypte", emoji: "🇪🇬", searchTerms: "egypte egypt eg" },
  { code: "LY", name: "Libye", emoji: "🇱🇾", searchTerms: "libye libya ly" },
  { code: "TR", name: "Turquie", emoji: "🇹🇷", searchTerms: "turquie turkey tr" },
  { code: "SA", name: "Arabie Saoudite", emoji: "🇸🇦", searchTerms: "arabie saoudite saudi arabia sa" },
  { code: "AE", name: "Émirats Arabes Unis", emoji: "🇦🇪", searchTerms: "emirats arabes unis uae dubai abu dhabi ae" },
  { code: "QA", name: "Qatar", emoji: "🇶🇦", searchTerms: "qatar qa doha" },
  { code: "KW", name: "Koweït", emoji: "🇰🇼", searchTerms: "koweit kuwait kw" },
  { code: "BH", name: "Bahreïn", emoji: "🇧🇭", searchTerms: "bahrein bahrain bh" },
  { code: "OM", name: "Oman", emoji: "🇴🇲", searchTerms: "oman om" },
  { code: "YE", name: "Yémen", emoji: "🇾🇪", searchTerms: "yemen ye" },
  { code: "JO", name: "Jordanie", emoji: "🇯🇴", searchTerms: "jordanie jordan jo" },
  { code: "LB", name: "Liban", emoji: "🇱🇧", searchTerms: "liban lebanon lb" },
  { code: "SY", name: "Syrie", emoji: "🇸🇾", searchTerms: "syrie syria sy" },
  { code: "IQ", name: "Irak", emoji: "🇮🇶", searchTerms: "irak iraq iq" },
  { code: "IR", name: "Iran", emoji: "🇮🇷", searchTerms: "iran ir" },
  { code: "IL", name: "Israël", emoji: "🇮🇱", searchTerms: "israel il" },
  { code: "PS", name: "Palestine", emoji: "🇵🇸", searchTerms: "palestine ps gaza" },

  // Sub-Saharan Africa
  { code: "SN", name: "Sénégal", emoji: "🇸🇳", searchTerms: "senegal sn dakar" },
  { code: "CI", name: "Côte d'Ivoire", emoji: "🇨🇮", searchTerms: "cote d ivoire ivory coast ci abidjan" },
  { code: "ML", name: "Mali", emoji: "🇲🇱", searchTerms: "mali ml bamako" },
  { code: "BF", name: "Burkina Faso", emoji: "🇧🇫", searchTerms: "burkina faso bf" },
  { code: "NE", name: "Niger", emoji: "🇳🇪", searchTerms: "niger ne" },
  { code: "NG", name: "Nigeria", emoji: "🇳🇬", searchTerms: "nigeria ng lagos" },
  { code: "GH", name: "Ghana", emoji: "🇬🇭", searchTerms: "ghana gh accra" },
  { code: "CM", name: "Cameroun", emoji: "🇨🇲", searchTerms: "cameroun cameroon cm" },
  { code: "CD", name: "RD Congo", emoji: "🇨🇩", searchTerms: "congo rd drc cd kinshasa" },
  { code: "CG", name: "Congo", emoji: "🇨🇬", searchTerms: "congo cg brazzaville" },
  { code: "GA", name: "Gabon", emoji: "🇬🇦", searchTerms: "gabon ga" },
  { code: "KE", name: "Kenya", emoji: "🇰🇪", searchTerms: "kenya ke nairobi" },
  { code: "TZ", name: "Tanzanie", emoji: "🇹🇿", searchTerms: "tanzanie tanzania tz" },
  { code: "UG", name: "Ouganda", emoji: "🇺🇬", searchTerms: "ouganda uganda ug" },
  { code: "RW", name: "Rwanda", emoji: "🇷🇼", searchTerms: "rwanda rw kigali" },
  { code: "ET", name: "Éthiopie", emoji: "🇪🇹", searchTerms: "ethiopie ethiopia et" },
  { code: "ZA", name: "Afrique du Sud", emoji: "🇿🇦", searchTerms: "afrique du sud south africa za johannesburg cape town" },
  { code: "MG", name: "Madagascar", emoji: "🇲🇬", searchTerms: "madagascar mg" },
  { code: "MU", name: "Maurice", emoji: "🇲🇺", searchTerms: "maurice mauritius mu" },
  { code: "AO", name: "Angola", emoji: "🇦🇴", searchTerms: "angola ao luanda" },
  { code: "MZ", name: "Mozambique", emoji: "🇲🇿", searchTerms: "mozambique mz" },
  { code: "ZW", name: "Zimbabwe", emoji: "🇿🇼", searchTerms: "zimbabwe zw" },
  { code: "BJ", name: "Bénin", emoji: "🇧🇯", searchTerms: "benin bj cotonou" },
  { code: "TG", name: "Togo", emoji: "🇹🇬", searchTerms: "togo tg lome" },
  { code: "GN", name: "Guinée", emoji: "🇬🇳", searchTerms: "guinee guinea gn conakry" },
  { code: "MR", name: "Mauritanie", emoji: "🇲🇷", searchTerms: "mauritanie mauritania mr" },

  // Americas
  { code: "US", name: "États-Unis", emoji: "🇺🇸", searchTerms: "etats unis usa united states amerique america us" },
  { code: "CA", name: "Canada", emoji: "🇨🇦", searchTerms: "canada ca" },
  { code: "MX", name: "Mexique", emoji: "🇲🇽", searchTerms: "mexique mexico mx" },
  { code: "BR", name: "Brésil", emoji: "🇧🇷", searchTerms: "bresil brazil br" },
  { code: "AR", name: "Argentine", emoji: "🇦🇷", searchTerms: "argentine argentina ar" },
  { code: "CO", name: "Colombie", emoji: "🇨🇴", searchTerms: "colombie colombia co" },
  { code: "CL", name: "Chili", emoji: "🇨🇱", searchTerms: "chili chile cl" },
  { code: "PE", name: "Pérou", emoji: "🇵🇪", searchTerms: "perou peru pe" },
  { code: "VE", name: "Venezuela", emoji: "🇻🇪", searchTerms: "venezuela ve" },
  { code: "EC", name: "Équateur", emoji: "🇪🇨", searchTerms: "equateur ecuador ec" },
  { code: "BO", name: "Bolivie", emoji: "🇧🇴", searchTerms: "bolivie bolivia bo" },
  { code: "PY", name: "Paraguay", emoji: "🇵🇾", searchTerms: "paraguay py" },
  { code: "UY", name: "Uruguay", emoji: "🇺🇾", searchTerms: "uruguay uy" },
  { code: "CR", name: "Costa Rica", emoji: "🇨🇷", searchTerms: "costa rica cr" },
  { code: "PA", name: "Panama", emoji: "🇵🇦", searchTerms: "panama pa" },
  { code: "CU", name: "Cuba", emoji: "🇨🇺", searchTerms: "cuba cu havane" },
  { code: "DO", name: "République Dominicaine", emoji: "🇩🇴", searchTerms: "republique dominicaine dominican republic do" },
  { code: "HT", name: "Haïti", emoji: "🇭🇹", searchTerms: "haiti ht" },
  { code: "JM", name: "Jamaïque", emoji: "🇯🇲", searchTerms: "jamaique jamaica jm" },
  { code: "GT", name: "Guatemala", emoji: "🇬🇹", searchTerms: "guatemala gt" },
  { code: "HN", name: "Honduras", emoji: "🇭🇳", searchTerms: "honduras hn" },
  { code: "SV", name: "Salvador", emoji: "🇸🇻", searchTerms: "salvador el salvador sv" },
  { code: "NI", name: "Nicaragua", emoji: "🇳🇮", searchTerms: "nicaragua ni" },
  { code: "PR", name: "Porto Rico", emoji: "🇵🇷", searchTerms: "porto rico puerto rico pr" },
  { code: "GP", name: "Guadeloupe", emoji: "🇬🇵", searchTerms: "guadeloupe gp" },
  { code: "MQ", name: "Martinique", emoji: "🇲🇶", searchTerms: "martinique mq" },
  { code: "GF", name: "Guyane", emoji: "🇬🇫", searchTerms: "guyane french guiana gf" },
  { code: "RE", name: "La Réunion", emoji: "🇷🇪", searchTerms: "reunion re" },

  // Asia
  { code: "CN", name: "Chine", emoji: "🇨🇳", searchTerms: "chine china cn beijing shanghai" },
  { code: "JP", name: "Japon", emoji: "🇯🇵", searchTerms: "japon japan jp tokyo" },
  { code: "KR", name: "Corée du Sud", emoji: "🇰🇷", searchTerms: "coree du sud south korea kr seoul" },
  { code: "IN", name: "Inde", emoji: "🇮🇳", searchTerms: "inde india in delhi mumbai" },
  { code: "ID", name: "Indonésie", emoji: "🇮🇩", searchTerms: "indonesie indonesia id jakarta bali" },
  { code: "TH", name: "Thaïlande", emoji: "🇹🇭", searchTerms: "thailande thailand th bangkok" },
  { code: "VN", name: "Vietnam", emoji: "🇻🇳", searchTerms: "vietnam vn hanoi" },
  { code: "PH", name: "Philippines", emoji: "🇵🇭", searchTerms: "philippines ph manila" },
  { code: "MY", name: "Malaisie", emoji: "🇲🇾", searchTerms: "malaisie malaysia my kuala lumpur" },
  { code: "SG", name: "Singapour", emoji: "🇸🇬", searchTerms: "singapour singapore sg" },
  { code: "PK", name: "Pakistan", emoji: "🇵🇰", searchTerms: "pakistan pk" },
  { code: "BD", name: "Bangladesh", emoji: "🇧🇩", searchTerms: "bangladesh bd dhaka" },
  { code: "LK", name: "Sri Lanka", emoji: "🇱🇰", searchTerms: "sri lanka lk" },
  { code: "NP", name: "Népal", emoji: "🇳🇵", searchTerms: "nepal np" },
  { code: "MM", name: "Myanmar", emoji: "🇲🇲", searchTerms: "myanmar birmanie burma mm" },
  { code: "KH", name: "Cambodge", emoji: "🇰🇭", searchTerms: "cambodge cambodia kh" },
  { code: "LA", name: "Laos", emoji: "🇱🇦", searchTerms: "laos la" },
  { code: "HK", name: "Hong Kong", emoji: "🇭🇰", searchTerms: "hong kong hk" },
  { code: "TW", name: "Taïwan", emoji: "🇹🇼", searchTerms: "taiwan tw taipei" },
  { code: "MN", name: "Mongolie", emoji: "🇲🇳", searchTerms: "mongolie mongolia mn" },
  { code: "KZ", name: "Kazakhstan", emoji: "🇰🇿", searchTerms: "kazakhstan kz" },
  { code: "UZ", name: "Ouzbékistan", emoji: "🇺🇿", searchTerms: "ouzbekistan uzbekistan uz" },
  { code: "AZ", name: "Azerbaïdjan", emoji: "🇦🇿", searchTerms: "azerbaidjan azerbaijan az" },
  { code: "GE", name: "Géorgie", emoji: "🇬🇪", searchTerms: "georgie georgia ge" },
  { code: "AM", name: "Arménie", emoji: "🇦🇲", searchTerms: "armenie armenia am" },
  { code: "AF", name: "Afghanistan", emoji: "🇦🇫", searchTerms: "afghanistan af" },

  // Oceania
  { code: "AU", name: "Australie", emoji: "🇦🇺", searchTerms: "australie australia au sydney melbourne" },
  { code: "NZ", name: "Nouvelle-Zélande", emoji: "🇳🇿", searchTerms: "nouvelle zelande new zealand nz auckland" },
  { code: "FJ", name: "Fidji", emoji: "🇫🇯", searchTerms: "fidji fiji fj" },
  { code: "PF", name: "Polynésie Française", emoji: "🇵🇫", searchTerms: "polynesie francaise french polynesia pf tahiti" },
  { code: "NC", name: "Nouvelle-Calédonie", emoji: "🇳🇨", searchTerms: "nouvelle caledonie new caledonia nc noumea" },
].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

// Cities by country code - major cities for each country
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  // France
  FR: [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", 
    "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Saint-Étienne", 
    "Le Havre", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne",
    "Clermont-Ferrand", "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens",
    "Limoges", "Perpignan", "Metz", "Besançon", "Orléans", "Rouen", "Mulhouse",
    "Caen", "Nancy", "Saint-Denis", "Argenteuil", "Montreuil", "Roubaix"
  ].sort(),

  // Algeria
  DZ: [
    "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Djelfa", 
    "Sétif", "Sidi Bel Abbès", "Biskra", "Tébessa", "El Oued", "Skikda", 
    "Tiaret", "Béjaïa", "Tlemcen", "Ouargla", "Béchar", "Mostaganem", 
    "Bordj Bou Arreridj", "Chlef", "Médéa", "Tizi Ouzou", "El Khroub",
    "Aïn Beïda", "Relizane", "Oum El Bouaghi", "Laghouat", "Khenchela",
    "Saïda", "Mascara", "Ghardaïa", "Souk Ahras", "M'Sila", "Jijel"
  ].sort(),

  // Morocco
  MA: [
    "Casablanca", "Rabat", "Fès", "Marrakech", "Tanger", "Agadir", "Meknès",
    "Oujda", "Kénitra", "Tétouan", "Safi", "El Jadida", "Nador", "Mohammedia",
    "Béni Mellal", "Khouribga", "Essaouira", "Ouarzazate", "Laâyoune", "Dakhla"
  ].sort(),

  // Tunisia
  TN: [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana",
    "Gafsa", "Monastir", "La Marsa", "Ben Arous", "Nabeul", "Médenine",
    "Hammamet", "Djerba", "Mahdia", "Kasserine", "Tozeur", "Kébili"
  ].sort(),

  // Belgium
  BE: [
    "Bruxelles", "Anvers", "Gand", "Charleroi", "Liège", "Bruges", "Namur",
    "Louvain", "Mons", "Ostende", "Courtrai", "Malines", "Hasselt", "Tournai",
    "Arlon", "La Louvière", "Mouscron", "Verviers", "Seraing"
  ].sort(),

  // Germany
  DE: [
    "Berlin", "Hambourg", "Munich", "Cologne", "Francfort", "Stuttgart",
    "Düsseldorf", "Dortmund", "Essen", "Leipzig", "Brême", "Dresde",
    "Hanovre", "Nuremberg", "Duisbourg", "Bochum", "Wuppertal", "Bielefeld"
  ].sort(),

  // Spain
  ES: [
    "Madrid", "Barcelone", "Valence", "Séville", "Saragosse", "Málaga",
    "Murcie", "Palma", "Las Palmas", "Bilbao", "Alicante", "Cordoue",
    "Valladolid", "Vigo", "Gijón", "Grenade", "La Corogne", "Vitoria"
  ].sort(),

  // Italy
  IT: [
    "Rome", "Milan", "Naples", "Turin", "Palerme", "Gênes", "Bologne",
    "Florence", "Bari", "Catane", "Venise", "Vérone", "Messine", "Padoue",
    "Trieste", "Tarente", "Brescia", "Parme", "Modène", "Prato"
  ].sort(),

  // United Kingdom
  GB: [
    "Londres", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds",
    "Sheffield", "Édimbourg", "Bristol", "Leicester", "Coventry", "Bradford",
    "Nottingham", "Kingston-upon-Hull", "Newcastle", "Stoke-on-Trent", "Southampton"
  ].sort(),

  // Netherlands
  NL: [
    "Amsterdam", "Rotterdam", "La Haye", "Utrecht", "Eindhoven", "Tilburg",
    "Groningue", "Almere", "Breda", "Nimègue", "Apeldoorn", "Enschede",
    "Haarlem", "Arnhem", "Amersfoort", "Zaanstad", "Maastricht"
  ].sort(),

  // Portugal
  PT: [
    "Lisbonne", "Porto", "Vila Nova de Gaia", "Amadora", "Braga", "Setúbal",
    "Coimbra", "Funchal", "Queluz", "Almada", "Aveiro", "Faro", "Évora"
  ].sort(),

  // Switzerland
  CH: [
    "Zurich", "Genève", "Bâle", "Lausanne", "Berne", "Winterthour", "Lucerne",
    "Saint-Gall", "Lugano", "Bienne", "Thoune", "Fribourg", "Neuchâtel"
  ].sort(),

  // Austria
  AT: [
    "Vienne", "Graz", "Linz", "Salzbourg", "Innsbruck", "Klagenfurt",
    "Villach", "Wels", "Sankt Pölten", "Dornbirn"
  ].sort(),

  // Poland
  PL: [
    "Varsovie", "Cracovie", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin",
    "Bydgoszcz", "Lublin", "Białystok", "Katowice", "Gdynia", "Częstochowa"
  ].sort(),

  // United States
  US: [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphie",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "Indianapolis", "Charlotte", "San Francisco",
    "Seattle", "Denver", "Washington", "Boston", "Nashville", "Detroit",
    "Portland", "Las Vegas", "Memphis", "Baltimore", "Milwaukee", "Miami",
    "Atlanta", "Honolulu", "Minneapolis", "Cleveland", "St. Louis", "Pittsburgh"
  ].sort(),

  // Canada
  CA: [
    "Toronto", "Montréal", "Vancouver", "Calgary", "Edmonton", "Ottawa",
    "Winnipeg", "Québec", "Hamilton", "Kitchener", "London", "Victoria",
    "Halifax", "Oshawa", "Windsor", "Saskatoon", "Regina", "Gatineau"
  ].sort(),

  // Brazil
  BR: [
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza",
    "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre",
    "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís"
  ].sort(),

  // Argentina
  AR: [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "San Miguel de Tucumán",
    "La Plata", "Mar del Plata", "Salta", "Santa Fe", "San Juan"
  ].sort(),

  // Mexico
  MX: [
    "Mexico", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León",
    "Ciudad Juárez", "Zapopan", "Mérida", "Cancún", "Acapulco", "Querétaro"
  ].sort(),

  // Egypt
  EG: [
    "Le Caire", "Alexandrie", "Gizeh", "Charm el-Cheikh", "Louxor", "Assouan",
    "Port-Saïd", "Suez", "Hurghada", "Tanta", "Mansoura", "Zagazig"
  ].sort(),

  // Turkey
  TR: [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Gaziantep",
    "Konya", "Mersin", "Diyarbakır", "Kayseri", "Samsun", "Denizli"
  ].sort(),

  // Saudi Arabia
  SA: [
    "Riyad", "Djeddah", "La Mecque", "Médine", "Dammam", "Tabuk", "Taëf",
    "Al Khobar", "Abha", "Khamis Mushait", "Najran", "Jubail"
  ].sort(),

  // UAE
  AE: [
    "Dubaï", "Abu Dhabi", "Charjah", "Ajman", "Ras el-Khaïmah", "Fujairah",
    "Oumm al-Qaïwaïn", "Al-Aïn"
  ].sort(),

  // China
  CN: [
    "Shanghai", "Pékin", "Canton", "Shenzhen", "Tianjin", "Wuhan", "Chengdu",
    "Hangzhou", "Chongqing", "Nankin", "Xi'an", "Harbin", "Suzhou", "Qingdao"
  ].sort(),

  // Japan
  JP: [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobé",
    "Kyoto", "Kawasaki", "Saitama", "Hiroshima", "Sendai", "Kitakyushu"
  ].sort(),

  // South Korea
  KR: [
    "Séoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Ulsan",
    "Suwon", "Changwon", "Goyang", "Seongnam"
  ].sort(),

  // India
  IN: [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
    "Ahmedabad", "Pune", "Surat", "Jaipur", "Lucknow", "Kanpur"
  ].sort(),

  // Australia
  AU: [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adélaïde", "Canberra",
    "Hobart", "Darwin", "Newcastle", "Gold Coast", "Cairns"
  ].sort(),

  // New Zealand
  NZ: [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
    "Dunedin", "Palmerston North", "Napier", "Nelson", "Queenstown"
  ].sort(),

  // Senegal
  SN: [
    "Dakar", "Thiès", "Rufisque", "Kaolack", "Saint-Louis", "Ziguinchor",
    "Mbour", "Touba", "Diourbel", "Tambacounda"
  ].sort(),

  // Ivory Coast
  CI: [
    "Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "Korhogo", "San-Pédro",
    "Divo", "Man", "Gagnoa", "Anyama"
  ].sort(),

  // Cameroon
  CM: [
    "Douala", "Yaoundé", "Bamenda", "Bafoussam", "Garoua", "Maroua",
    "Ngaoundéré", "Bertoua", "Kribi", "Limbé"
  ].sort(),

  // Nigeria
  NG: [
    "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City",
    "Kaduna", "Maiduguri", "Zaria", "Aba", "Jos", "Ilorin"
  ].sort(),

  // South Africa
  ZA: [
    "Johannesburg", "Le Cap", "Durban", "Pretoria", "Port Elizabeth",
    "Bloemfontein", "East London", "Nelspruit", "Polokwane", "Kimberley"
  ].sort(),

  // Kenya
  KE: [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi"
  ].sort(),

  // Russia
  RU: [
    "Moscou", "Saint-Pétersbourg", "Novossibirsk", "Iekaterinbourg",
    "Kazan", "Nijni Novgorod", "Samara", "Omsk", "Rostov-sur-le-Don"
  ].sort(),

  // Ukraine
  UA: [
    "Kiev", "Kharkiv", "Odessa", "Dnipro", "Donetsk", "Zaporijjia",
    "Lviv", "Kryvyi Rih", "Mykolaïv", "Marioupol"
  ].sort(),

  // Colombia
  CO: [
    "Bogota", "Medellín", "Cali", "Barranquilla", "Carthagène",
    "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta"
  ].sort(),

  // Thailand
  TH: [
    "Bangkok", "Nonthaburi", "Nakhon Ratchasima", "Chiang Mai", "Pattaya",
    "Hat Yai", "Udon Thani", "Khon Kaen", "Phuket", "Krabi"
  ].sort(),

  // Indonesia
  ID: [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar",
    "Palembang", "Tangerang", "Depok", "Bali"
  ].sort(),

  // Vietnam
  VN: [
    "Hô Chi Minh-Ville", "Hanoï", "Hải Phòng", "Đà Nẵng", "Cần Thơ",
    "Biên Hòa", "Nha Trang", "Huế"
  ].sort(),

  // Philippines
  PH: [
    "Manille", "Quezon City", "Davao", "Cebu", "Zamboanga", "Antipolo",
    "Taguig", "Pasig", "Cagayan de Oro"
  ].sort(),

  // Malaysia
  MY: [
    "Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam",
    "Petaling Jaya", "Kota Kinabalu", "Kuching", "Melaka"
  ].sort(),

  // Singapore
  SG: ["Singapour"],

  // Qatar
  QA: ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal"],

  // Kuwait
  KW: ["Koweït City", "Hawalli", "Salmiya", "Jahra", "Farwaniya"],

  // Bahrain
  BH: ["Manama", "Muharraq", "Riffa", "Hamad Town"],

  // Jordan
  JO: ["Amman", "Zarqa", "Irbid", "Aqaba", "Salt", "Madaba"],

  // Lebanon
  LB: ["Beyrouth", "Tripoli", "Sidon", "Tyr", "Jounieh", "Byblos"],

  // Ireland
  IE: ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda"],

  // Greece
  GR: ["Athènes", "Thessalonique", "Le Pirée", "Patras", "Héraklion", "Larissa"],

  // Czech Republic
  CZ: ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc"],

  // Romania
  RO: ["Bucarest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova"],

  // Hungary
  HU: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr"],

  // Sweden
  SE: ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", "Örebro"],

  // Norway
  NO: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Tromsø"],

  // Denmark
  DK: ["Copenhague", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers"],

  // Finland
  FI: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku"],

  // Croatia
  HR: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Pula"],

  // Serbia
  RS: ["Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica"],

  // Chile
  CL: ["Santiago", "Valparaíso", "Concepción", "Antofagasta", "Viña del Mar"],

  // Peru
  PE: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco"],

  // Cuba
  CU: ["La Havane", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara"],

  // Venezuela
  VE: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay"],
};

// Get country options for select dropdown
export const getWorldCountryOptions = () =>
  WORLD_COUNTRIES.map((c) => ({
    value: c.name,
    label: `${c.emoji} ${c.name}`,
    searchTerms: c.searchTerms,
  }));

// Get cities for a specific country
export const getCitiesForCountry = (countryName: string): string[] => {
  const country = WORLD_COUNTRIES.find((c) => c.name === countryName);
  if (!country) return [];
  return CITIES_BY_COUNTRY[country.code] || [];
};

// Get all cities (for fallback or global search)
export const getAllCities = (): string[] => {
  const allCities: string[] = [];
  Object.values(CITIES_BY_COUNTRY).forEach((cities) => {
    allCities.push(...cities);
  });
  return [...new Set(allCities)].sort();
};
