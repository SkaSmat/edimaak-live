import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CITIES = [
  // France
  "Paris",
  "Lyon",
  "Marseille",
  "Lille",
  "Toulouse",
  "Nice",
  "Bordeaux",
  "Nantes",
  "Strasbourg",
  "Montpellier",
  // Algérie
  "Alger",
  "Oran",
  "Constantine",
  "Annaba",
  "Tlemcen",
  "Sétif",
  "Béjaïa",
  "Blida",
  "Batna",
  "Djelfa",
];

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim()) {
      const search = value.toLowerCase().trim();
      const filtered = CITIES.filter((city) =>
        city.toLowerCase().includes(search)
      );
      setFilteredCities(filtered);
      setIsOpen(filtered.length > 0);
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
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (filteredCities.length > 0) setIsOpen(true);
        }}
        className={cn(
          "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground",
          className
        )}
      />
      {isOpen && filteredCities.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filteredCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};