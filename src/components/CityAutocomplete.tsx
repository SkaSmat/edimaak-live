import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  "Calgary",
  "Edmonton",
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
].sort();

export const CITIES_BELGIUM = [
  "Bruxelles",
  "Anvers",
  "Gand",
  "Charleroi",
  "Liège",
  "Bruges",
  "Namur",
  "Louvain",
  "Mons",
  "Ostende",
  "Courtrai",
  "Malines",
  "Hasselt",
  "Tournai",
  "Arlon",
].sort();

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  // On accepte n'importe quelle string pour être flexible
  limitToCountry?: string | null;
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
    case "Belgique":
      cities = CITIES_BELGIUM;
      break;
    default:
      cities = [...CITIES_ALGERIA, ...CITIES_FRANCE, ...CITIES_SPAIN, ...CITIES_BELGIUM].sort();
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
          <CommandInput placeholder={limitToCountry ? `Ville (${limitToCountry})...` : "Rechercher..."} />
          <CommandList>
            <CommandEmpty>Ville introuvable.</CommandEmpty>
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
