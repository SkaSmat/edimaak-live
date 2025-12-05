import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Listes étendues pour couvrir un maximum de cas
const CITIES_FRANCE = [
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
  "Saint-Denis",
  "Caen",
  "Argenteuil",
  "Saint-Paul",
  "Montreuil",
  "Nancy",
  "Roubaix",
  "Tourcoing",
  "Nanterre",
  "Avignon",
  "Vitry-sur-Seine",
  "Créteil",
  "Dunkerque",
  "Poitiers",
  "Asnières-sur-Seine",
].sort();

const CITIES_ALGERIA = [
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
  "Aïn Béïda",
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
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Sélectionner une ville...",
  className,
}: CityAutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  // Détection automatique du pays selon le placeholder ou le contexte
  // Si le placeholder parle de "Paris" ou "France", on charge les villes FR. Sinon DZ.
  // Par défaut, on peut aussi combiner les deux si on veut être large.
  const isFranceContext =
    placeholder?.toLowerCase().includes("paris") ||
    placeholder?.toLowerCase().includes("france") ||
    placeholder?.toLowerCase().includes("départ");
  const isAlgeriaContext =
    placeholder?.toLowerCase().includes("alger") ||
    placeholder?.toLowerCase().includes("algérie") ||
    placeholder?.toLowerCase().includes("arrivée");

  let cities = [];
  if (isFranceContext) cities = CITIES_FRANCE;
  else if (isAlgeriaContext) cities = CITIES_ALGERIA;
  else cities = [...CITIES_FRANCE, ...CITIES_ALGERIA].sort(); // Fallback : tout

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
          <CommandInput placeholder="Rechercher une ville..." />
          <CommandList>
            <CommandEmpty>
              {/* Si la ville n'est pas dans la liste, on propose de l'utiliser quand même */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-accent"
                onClick={() => {
                  // On prend ce qui a été tapé dans l'input (c'est un hack accessible via le DOM local si besoin,
                  // mais ici on simplifie : on laisse l'utilisateur cliquer sur une suggestion ou taper)
                  // Pour une vraie saisie libre dans un combobox, c'est plus complexe.
                  // Ici on reste sur la liste stricte pour éviter les fautes.
                }}
              >
                Ville non trouvée ? Vérifiez l'orthographe.
              </button>
            </CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={(currentValue) => {
                    // On utilise la vraie casse de la ville (Pas en minuscule)
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
