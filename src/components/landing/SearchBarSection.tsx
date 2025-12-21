import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { Search, ArrowRightLeft, ChevronDown } from "lucide-react";

interface SearchBarSectionProps {
  fromCountry: string;
  toCountry: string;
  localFromCity: string;
  localToCity: string;
  localSearchDate: string;
  countries: string[];
  onFromCountryChange: (country: string) => void;
  onToCountryChange: (country: string) => void;
  onLocalFromCityChange: (city: string) => void;
  onLocalToCityChange: (city: string) => void;
  onLocalSearchDateChange: (date: string) => void;
  onToggleDirection: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SearchBarSection = ({
  fromCountry,
  toCountry,
  localFromCity,
  localToCity,
  localSearchDate,
  countries,
  onFromCountryChange,
  onToCountryChange,
  onLocalFromCityChange,
  onLocalToCityChange,
  onLocalSearchDateChange,
  onToggleDirection,
  onSubmit,
}: SearchBarSectionProps) => {
  return (
    <form onSubmit={onSubmit} className="relative z-40 px-3 sm:px-4 mb-8">
      <div className="container mx-auto max-w-4xl">
        {/* VERSION MOBILE (< md) : Layout vertical */}
        <div className="md:hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-4 space-y-3">
          {/* DÉPART */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Départ</span>
              <select
                value={fromCountry}
                onChange={(e) => onFromCountryChange(e.target.value)}
                className="text-xs font-bold text-gray-900 border border-gray-200 rounded-lg px-2 h-10 w-full bg-white"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <CityAutocomplete
              placeholder={`Ville de ${fromCountry}`}
              value={localFromCity}
              onChange={onLocalFromCityChange}
              limitToCountry={fromCountry}
              className="border border-gray-200 rounded-lg p-2.5 text-base md:text-sm w-full"
            />
          </div>

          {/* BOUTON INVERSER MOBILE */}
          <div className="flex justify-center -my-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleDirection}
              className="rounded-full h-8 px-4 bg-gray-50 text-xs border-gray-200 gap-2"
            >
              <ArrowRightLeft className="w-3 h-3" /> Inverser
            </Button>
          </div>

          {/* ARRIVÉE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Arrivée</span>
              <select
                value={toCountry}
                onChange={(e) => onToCountryChange(e.target.value)}
                className="text-xs font-bold text-gray-900 border border-gray-200 rounded-lg px-2 h-10 w-full bg-white"
              >
                {countries.map((c) => (
                  <option key={c} value={c} disabled={c === fromCountry}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <CityAutocomplete
              placeholder={`Ville de ${toCountry}`}
              value={localToCity}
              onChange={onLocalToCityChange}
              limitToCountry={toCountry}
              className="border border-gray-200 rounded-lg p-2.5 text-base md:text-sm w-full"
            />
          </div>

          {/* DATE MOBILE */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Quand ?</label>
            <Input
              type="date"
              value={localSearchDate}
              onChange={(e) => onLocalSearchDateChange(e.target.value)}
              className="border-gray-200 rounded-lg p-2.5 text-base md:text-sm w-full"
            />
          </div>

          {/* BOUTON RECHERCHE MOBILE */}
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl h-12 bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold text-base"
          >
            <Search className="w-5 h-5 mr-2" />
            Rechercher
          </Button>
        </div>

        {/* VERSION DESKTOP (≥ md) : Layout horizontal */}
        <div className="hidden md:flex bg-white rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.12)] border border-gray-200 items-center p-2 divide-x divide-gray-100 relative">
          {/* DÉPART */}
          <div className="flex-1 px-6 py-2.5 hover:bg-gray-50 rounded-full transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Départ</span>
              <div className="relative">
                <select
                  value={fromCountry}
                  onChange={(e) => onFromCountryChange(e.target.value)}
                  className="appearance-none bg-transparent text-[10px] font-extrabold text-gray-900 uppercase pr-4 cursor-pointer outline-none hover:text-primary pt-0 pb-[7px]"
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <CityAutocomplete
              placeholder={`Ville de ${fromCountry}`}
              value={localFromCity}
              onChange={onLocalFromCityChange}
              limitToCountry={fromCountry}
              className="border-0 p-0 h-auto text-sm font-medium placeholder:text-gray-400 focus-visible:ring-0 bg-transparent w-full"
            />
          </div>

          {/* BOUTON INVERSER DESKTOP - POSITION RESPONSIVE */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onToggleDirection}
              className="rounded-full h-8 w-8 bg-white border-gray-200 shadow-sm hover:scale-110 transition-transform hover:bg-gray-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-gray-600" />
            </Button>
          </div>

          {/* ARRIVÉE */}
          <div className="flex-1 px-6 py-2.5 hover:bg-gray-50 rounded-full transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Arrivée</span>
              <div className="relative">
                <select
                  value={toCountry}
                  onChange={(e) => onToCountryChange(e.target.value)}
                  className="appearance-none bg-transparent text-[10px] font-extrabold text-gray-900 uppercase pr-4 cursor-pointer outline-none hover:text-primary pb-[7px]"
                >
                  {countries.map((c) => (
                    <option key={c} value={c} disabled={c === fromCountry}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <CityAutocomplete
              placeholder={`Ville de ${toCountry}`}
              value={localToCity}
              onChange={onLocalToCityChange}
              limitToCountry={toCountry}
              className="border-0 p-0 h-auto text-sm font-medium placeholder:text-gray-400 focus-visible:ring-0 bg-transparent w-full"
            />
          </div>

          {/* DATE */}
          <div className="flex-[0.8] px-6 py-2.5 hover:bg-gray-50 rounded-full transition-colors">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-1">
              Quand ?
            </label>
            <Input
              type="date"
              value={localSearchDate}
              onChange={(e) => onLocalSearchDateChange(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 text-sm font-medium w-full p-0 h-auto"
            />
          </div>

          {/* BOUTON RECHERCHE */}
          <div className="pl-2 pr-1">
            <Button
              type="submit"
              size="lg"
              className="rounded-full h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
