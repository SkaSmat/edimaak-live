import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Liste complète des villes de France et d'Algérie
const CITIES_FRANCE = [
  // Grandes villes
  "Paris", "Lyon", "Marseille", "Lille", "Toulouse", "Nice", "Bordeaux", "Nantes", 
  "Strasbourg", "Montpellier", "Rennes", "Reims", "Le Havre", "Saint-Étienne", 
  "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Clermont-Ferrand",
  "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens", "Limoges", "Annecy",
  "Perpignan", "Boulogne-Billancourt", "Metz", "Besançon", "Orléans", "Rouen",
  "Mulhouse", "Caen", "Nancy", "Saint-Denis", "Argenteuil", "Montreuil",
  // Villes moyennes
  "Avignon", "Poitiers", "Dunkerque", "Valence", "Cannes", "Antibes", "La Rochelle",
  "Colmar", "Chambéry", "Lorient", "Pau", "Bayonne", "Troyes", "Calais", "Ajaccio",
  "Bastia", "Quimper", "Vannes", "Saint-Malo", "Saint-Nazaire", "Tarbes", "Albi",
  "Carcassonne", "Arles", "Fréjus", "Béziers", "Sète", "Montauban", "Agen", "Angoulême",
  "Chartres", "Bourges", "Châteauroux", "Niort", "La Roche-sur-Yon", "Cholet",
  "Saint-Brieuc", "Laval", "Blois", "Auxerre", "Épinal", "Thionville", "Forbach",
  "Chalon-sur-Saône", "Mâcon", "Bourg-en-Bresse", "Belfort", "Montbéliard", "Roanne",
  "Saint-Chamond", "Vienne", "Romans-sur-Isère", "Valence", "Gap", "Digne-les-Bains",
  "Manosque", "Draguignan", "Hyères", "La Seyne-sur-Mer", "Six-Fours-les-Plages",
  "Grasse", "Menton", "Monaco", "Villefranche-sur-Mer", "Cagnes-sur-Mer",
  // Île-de-France
  "Versailles", "Saint-Germain-en-Laye", "Mantes-la-Jolie", "Poissy", "Sartrouville",
  "Maisons-Laffitte", "Conflans-Sainte-Honorine", "Cergy", "Pontoise", "Évry",
  "Corbeil-Essonnes", "Massy", "Palaiseau", "Savigny-sur-Orge", "Créteil", "Vitry-sur-Seine",
  "Ivry-sur-Seine", "Saint-Maur-des-Fossés", "Champigny-sur-Marne", "Noisy-le-Grand",
  "Bondy", "Aulnay-sous-Bois", "Drancy", "Bobigny", "Pantin", "Aubervilliers",
  "Saint-Ouen", "Colombes", "Asnières-sur-Seine", "Courbevoie", "Nanterre", "Suresnes",
  "Rueil-Malmaison", "Issy-les-Moulineaux", "Boulogne-Billancourt", "Neuilly-sur-Seine"
];

const CITIES_ALGERIA = [
  // Toutes les wilayas (capitales de wilaya)
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif", "Djelfa",
  "Biskra", "Sidi Bel Abbès", "Tébessa", "El Oued", "Skikda", "Tiaret", "Béjaïa",
  "Tlemcen", "Béchar", "Ouargla", "Mostaganem", "Bordj Bou Arréridj", "Chlef",
  "Médéa", "Tizi Ouzou", "Bouira", "Mascara", "Msila", "Jijel", "Relizane",
  "Saïda", "Guelma", "Ghardaïa", "El Bayadh", "Laghouat", "Oum El Bouaghi",
  "Tamanghasset", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla",
  "Naâma", "Aïn Témouchent", "Adrar", "Illizi", "Tindouf", "Tissemsilt",
  "Boumerdès", "El Tarf", "Bordj Badji Mokhtar", "Djanet", "In Salah", 
  "In Guezzam", "Touggourt", "El M'Ghair", "El Meniaa", "Ouled Djellal",
  // Grandes villes et communes importantes
  "Bab El Oued", "El Harrach", "Hussein Dey", "Kouba", "Bir Mourad Raïs",
  "Bouzareah", "Chéraga", "Draria", "Bir Khadem", "Bab Ezzouar", "Dar El Beïda",
  "Rouiba", "Réghaïa", "Aïn Taya", "Bordj El Kiffan", "El Biar", "Hydra",
  "Ben Aknoun", "Dély Ibrahim", "Staoueli", "Zéralda", "Douéra",
  // Autres villes importantes
  "Hassi Messaoud", "Aïn Oussera", "Khemis Miliana", "Aflou", "Ksar El Boukhari",
  "Bou Saâda", "Aïn M'lila", "Chelghoum Laïd", "Akbou", "Amizour", "El Kseur",
  "Sidi Aïch", "Draa El Mizan", "Aïn El Hammam", "Azeffoun", "Tigzirt", "Azazga",
  "Boghni", "Tizi Rached", "Larbaâ Nath Irathen", "Maâtkas", "Aïn El Turk",
  "Es Sénia", "Bir El Djir", "Mers El Kébir", "Arzew", "Aïn El Bya", "Gdyel",
  "Hassi Bounif", "Bethioua", "El Kerma", "Oued Tlélat", "Sig", "Ain Sefra",
  "Mecheria", "Bou Hanifia", "Mohammadia", "Beni Saf", "El Malah", "Hennaya",
  "Maghnia", "Nedroma", "Remchi", "Sabra", "El Aricha", "Hammam Boughrara",
  "El Khroub", "Hamma Bouziane", "Didouche Mourad", "Aïn Smara", "Zighoud Youcef",
  "Aïn Abid", "Ibn Badis", "El Milia", "Taher", "Ziama Mansouriah",
  "El Hadjar", "Berrahal", "Chetaïbi", "Séraïdi", "Aïn El Berda",
  "Dréan", "Besbes", "El Kala", "Bouteldja", "Ben M'hidi", "Bouhadjar",
  "Collo", "Azzaba", "Ramdane Djamel", "El Harrouch", "Tamalous", "Oued Zenati",
  "Hammam Debagh", "Ain Fakroun", "Ain Beïda", "Ain Kercha", "Barika", "N'Gaous",
  "Arris", "Merouana", "Tazoult", "Batna", "Timgad", "Ain Touta", "Chemora",
  "Bir El Ater", "Ouenza", "El Aouinet", "Chéria", "Morsott", "El Ma El Abiod",
  "Khanguet Sidi Nadji", "Sidi Okba", "Zeribet El Oued", "El Feidh", "Tolga", "Ouled Djellal",
  "El Oued", "Guemar", "Robbah", "Bayadha", "Hassi Khalifa", "Debila", "Magrane",
  "Reguiba", "Taleb Larbi", "El M'Ghair", "Djamâa", "Touggourt", "Témacine", "Zaouia El Abidia",
  "Ghardaïa", "El Atteuf", "Bounoura", "Dhaïa Ben Dahoua", "Metlili", "Guerrara", "Zelfana",
  "El Meniaa", "Hassi R'Mel", "Berriane", "Ouargla", "Hassi Messaoud", "Touggourt", "N'Goussa",
  "Ain Beida", "Rouissat", "Sidi Khouiled", "El Hadjira", "Taibet", "Timimoun", "Aoulef",
  "Reggane", "Zaouiet Kounta", "Fenoughil", "Charouine", "Djanet", "Illizi", "In Amenas",
  "Bordj El Houasse", "Debdeb", "In Salah", "In Ghar", "Foggaret Ezzaouia", "Tamanghasset",
  "Abalessa", "In Guezzam", "Tinzaouatine", "In Amguel", "Silet", "Tazrouk", "Ideles"
];

const CITIES = [...CITIES_FRANCE, ...CITIES_ALGERIA];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CityAutocomplete = ({
  value,
  onChange,
  placeholder,
  className,
}: CityAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim().length >= 1) {
      const search = value.toLowerCase().trim();
      // Priorité aux villes qui commencent par la recherche
      const startsWithMatches = CITIES.filter((city) =>
        city.toLowerCase().startsWith(search)
      );
      const containsMatches = CITIES.filter(
        (city) =>
          city.toLowerCase().includes(search) &&
          !city.toLowerCase().startsWith(search)
      );
      const filtered = [...startsWithMatches, ...containsMatches].slice(0, 10);
      setFilteredCities(filtered);
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(-1);
    } else {
      setFilteredCities([]);
      setIsOpen(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city: string) => {
    onChange(city);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredCities.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCities.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCities.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredCities[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (filteredCities.length > 0) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground",
          className
        )}
        autoComplete="off"
      />
      {isOpen && filteredCities.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filteredCities.map((city, index) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              className={cn(
                "w-full px-4 py-2.5 text-left text-sm text-foreground transition-colors first:rounded-t-lg last:rounded-b-lg",
                highlightedIndex === index
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50"
              )}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
