import { Label } from "@/components/ui/label";

// Villes de France
const CITIES_FRANCE = [
  "Paris", "Lyon", "Marseille", "Lille", "Toulouse", "Nice", "Bordeaux", "Nantes",
  "Strasbourg", "Montpellier", "Rennes", "Reims", "Le Havre", "Saint-Étienne",
  "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Clermont-Ferrand",
  "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens", "Limoges", "Annecy",
  "Perpignan", "Metz", "Besançon", "Orléans", "Rouen", "Mulhouse", "Caen", "Nancy",
  "Avignon", "Poitiers", "Dunkerque", "Valence", "Cannes", "Antibes", "La Rochelle",
  "Colmar", "Chambéry", "Lorient", "Pau", "Bayonne", "Troyes", "Calais", "Ajaccio",
  "Bastia", "Quimper", "Vannes", "Saint-Malo", "Saint-Nazaire"
].sort();

// Villes d'Algérie  
const CITIES_ALGERIA = [
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif", "Djelfa",
  "Biskra", "Sidi Bel Abbès", "Tébessa", "El Oued", "Skikda", "Tiaret", "Béjaïa",
  "Tlemcen", "Béchar", "Ouargla", "Mostaganem", "Bordj Bou Arréridj", "Chlef",
  "Médéa", "Tizi Ouzou", "Bouira", "Mascara", "Msila", "Jijel", "Relizane",
  "Saïda", "Guelma", "Ghardaïa", "El Bayadh", "Laghouat", "Oum El Bouaghi",
  "Tamanghasset", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla",
  "Naâma", "Aïn Témouchent", "Adrar", "Boumerdès", "El Tarf", "Touggourt"
].sort();

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  country: "France" | "Algérie";
  label?: string;
  required?: boolean;
}

export const CitySelect = ({ value, onChange, country, label, required }: CitySelectProps) => {
  const cities = country === "France" ? CITIES_FRANCE : CITIES_ALGERIA;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
        required={required}
      >
        <option value="">Sélectionnez une ville</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
};
