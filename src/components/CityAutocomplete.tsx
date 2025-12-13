import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCitiesForCountry, getAllCities } from "@/lib/worldData";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
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

  // Get cities based on country - uses the new world data
  const cities = React.useMemo(() => {
    if (limitToCountry) {
      const countryCities = getCitiesForCountry(limitToCountry);
      // If country has cities, use them; otherwise allow manual input
      return countryCities.length > 0 ? countryCities : [];
    }
    return getAllCities();
  }, [limitToCountry]);

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
      <PopoverContent className="w-[300px] p-0 bg-popover border shadow-lg z-50" align="start">
        <Command>
          <CommandInput 
            placeholder={limitToCountry ? `Ville (${limitToCountry})...` : "Rechercher une ville..."} 
            onValueChange={(search) => {
              // Allow typing custom city if search doesn't match existing ones
              if (search && !cities.some(c => c.toLowerCase() === search.toLowerCase())) {
                // Will be handled on selection
              }
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-2 px-3 text-sm">
                <p className="text-muted-foreground mb-2">Ville introuvable dans la liste.</p>
                {value !== "" && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    Utiliser la saisie actuelle
                  </Button>
                )}
              </div>
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

// Legacy exports for backward compatibility
export const CITIES_FRANCE = getCitiesForCountry("France");
export const CITIES_ALGERIA = getCitiesForCountry("Algérie");
export const CITIES_CANADA = getCitiesForCountry("Canada");
export const CITIES_SPAIN = getCitiesForCountry("Espagne");
export const CITIES_UK = getCitiesForCountry("Royaume-Uni");
export const CITIES_BELGIUM = getCitiesForCountry("Belgique");
