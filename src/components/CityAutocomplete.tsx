import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Listes complètes pour le filtrage strict
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

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  // NOUVEAU : Permet de forcer une liste de pays spécifique
  limitToCountry?: "France" | "Algérie" | null;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Sélectionner une ville...",
  className,
  limitToCountry = null,
}: CityAutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  // Détermination de la liste à afficher
  let cities: string[] = [];

  if (limitToCountry === "France") {
    cities = CITIES_FRANCE;
  } else if (limitToCountry === "Algérie") {
    cities = CITIES_ALGERIA;
  } else {
    // Si pas de limite stricte (ex: barre de recherche accueil), on essaie de deviner ou on met tout
    const isFranceContext =
      placeholder?.toLowerCase().includes("paris") ||
      placeholder?.toLowerCase().includes("france") ||
      placeholder?.toLowerCase().includes("départ");
    const isAlgeriaContext =
      placeholder?.toLowerCase().includes("alger") ||
      placeholder?.toLowerCase().includes("algérie") ||
      placeholder?.toLowerCase().includes("arrivée");

    if (isFranceContext) cities = CITIES_FRANCE;
    else if (isAlgeriaContext) cities = CITIES_ALGERIA;
    else cities = [...CITIES_FRANCE, ...CITIES_ALGERIA].sort();
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
          <CommandInput
            placeholder={limitToCountry ? `Rechercher en ${limitToCountry}...` : "Rechercher une ville..."}
          />
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
                    // On recupère la vraie casse depuis la liste
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
