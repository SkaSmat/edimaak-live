import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// --- BASES DE DONNÉES VILLES (Exportées pour être utilisées dans les formulaires) ---

export const CITIES_FRANCE = [
  "Paris",
  "Marseille",
  "Lyon",
  "Toulouse",
  "Nice",
  "Nantes",
  "Montpellier",
  "Strasbourg",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Reims",
  "Saint-Étienne",
  "Le Havre",
  "Toulon",
  "Grenoble",
  "Dijon",
  "Angers",
  "Nîmes",
  "Villeurbanne",
  "Saint-Denis",
  "Le Mans",
  "Aix-en-Provence",
  "Clermont-Ferrand",
  "Brest",
  "Limoges",
  "Tours",
  "Amiens",
  "Perpignan",
  "Metz",
  "Besançon",
  "Boulogne-Billancourt",
  "Orléans",
  "Mulhouse",
  "Rouen",
  "Caen",
  "Nancy",
  "Argenteuil",
  "Montreuil",
  "Roubaix",
  "Dunkerque",
  "Tourcoing",
  "Avignon",
  "Nanterre",
  "Poitiers",
  "Créteil",
  "Versailles",
  "Courbevoie",
  "Pau",
].sort();

export const CITIES_ALGERIA = [
  "Alger",
  "Oran",
  "Constantine",
  "Annaba",
  "Blida",
  "Batna",
  "Djelfa",
  "Sétif",
  "Sidi Bel Abbès",
  "Biskra",
  "Tébessa",
  "El Oued",
  "Skikda",
  "Tiaret",
  "Béjaïa",
  "Tlemcen",
  "Ouargla",
  "Béchar",
  "Mostaganem",
  "Bordj Bou Arreridj",
  "Chlef",
  "Souk Ahras",
  "Médéa",
  "El Eulma",
  "Touggourt",
  "Ghardaïa",
  "Saïda",
  "Laghouat",
  "M'Sila",
  "Jijel",
  "Relizane",
  "Guelma",
  "Ain Beida",
  "Khenchela",
  "Bousaada",
  "Mascara",
  "Tindouf",
  "Tizi Ouzou",
].sort();

export const CITIES_CANADA = [
  "Montréal",
  "Québec",
  "Ottawa",
  "Toronto",
  "Vancouver",
  "Gatineau",
  "Laval",
  "Longueuil",
  "Sherbrooke",
  "Saguenay",
  "Lévis",
  "Trois-Rivières",
  "Terrebonne",
  "Saint-Jean-sur-Richelieu",
  "Repentigny",
  "Drummondville",
  "Saint-Jérôme",
  "Granby",
  "Blainville",
  "Saint-Hyacinthe",
  "Calgary",
  "Edmonton",
  "Winnipeg",
  "Halifax",
  "Mississauga",
].sort();

export const CITIES_SPAIN = [
  "Madrid",
  "Barcelone",
  "Valence",
  "Séville",
  "Saragosse",
  "Málaga",
  "Murcie",
  "Palma",
  "Las Palmas",
  "Bilbao",
  "Alicante",
  "Cordoue",
  "Valladolid",
  "Vigo",
  "Gijón",
  "L'Hospitalet",
  "La Corogne",
  "Grenade",
  "Vitoria-Gasteiz",
  "Elche",
  "Oviedo",
  "Badalone",
  "Carthagène",
  "Terrassa",
  "Jerez de la Frontera",
  "Sabadell",
  "Santa Cruz de Tenerife",
].sort();

export const CITIES_UK = [
  "Londres",
  "Birmingham",
  "Manchester",
  "Glasgow",
  "Newcastle",
  "Sheffield",
  "Liverpool",
  "Leeds",
  "Bristol",
  "Édimbourg",
  "Leicester",
  "Coventry",
  "Bradford",
  "Cardiff",
  "Belfast",
  "Nottingham",
  "Kingston-upon-Hull",
  "Stoke-on-Trent",
  "Southampton",
  "Reading",
  "Derby",
  "Portsmouth",
  "Luton",
  "Wolverhampton",
  "Plymouth",
  "Norwich",
].sort();

// Liste combinée pour "Le reste du monde" (Hors Algérie)
export const CITIES_INTERNATIONAL = [...CITIES_FRANCE, ...CITIES_CANADA, ...CITIES_SPAIN, ...CITIES_UK].sort();

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  // On ajoute les nouveaux pays au type
  limitToCountry?: "France" | "Algérie" | "Canada" | "Espagne" | "Royaume-Uni" | "International" | null;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Sélectionner une ville...",
  className,
  limitToCountry = null,
}: CityAutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  let cities: string[] = [];

  // Logique de sélection de la liste
  switch (limitToCountry) {
    case "France":
      cities = CITIES_FRANCE;
      break;
    case "Algérie":
      cities = CITIES_ALGERIA;
      break;
    case "Canada":
      cities = CITIES_CANADA;
      break;
    case "Espagne":
      cities = CITIES_SPAIN;
      break;
    case "Royaume-Uni":
      cities = CITIES_UK;
      break;
    case "International":
      cities = CITIES_INTERNATIONAL;
      break; // Tous sauf Algérie
    default:
      cities = [...CITIES_ALGERIA, ...CITIES_INTERNATIONAL].sort(); // Absolument tout
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={limitToCountry ? `Ville (${limitToCountry})...` : "Rechercher une ville..."} />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 px-4 text-sm text-muted-foreground">Ville introuvable.</div>
            </CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={(currentValue) => {
                    const realValue = cities.find((c) => c.toLowerCase() === currentValue) || currentValue;
                    onChange(realValue);
                    setOpen(false);
                  }}
                >
                  <MapPin className={cn("mr-2 h-4 w-4", value === city ? "text-primary" : "text-muted-foreground")} />
                  {city}
                  <Check className={cn("ml-auto h-4 w-4", value === city ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
