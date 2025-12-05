import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TripFormProps {
  userId: string;
  onSuccess: () => void;
}

// LISTES STRICTES
const CITIES_FRANCE = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Nice",
  "Nantes",
  "Montpellier",
  "Strasbourg",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Reims",
  "Le Havre",
  "Saint-Étienne",
  "Toulon",
  "Grenoble",
  "Dijon",
  "Angers",
  "Nîmes",
  "Villeurbanne",
];

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
];

const TripForm = ({ userId, onSuccess }: TripFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromCountry: "France",
    fromCity: "",
    toCountry: "Algérie",
    toCity: "",
    departureDate: "",
    arrivalDate: "",
    maxWeightKg: "",
    notes: "",
  });

  const today = new Date().toISOString().split("T")[0];

  // LOGIQUE DE BASCULE ET DE LISTE
  // Si départ = France -> Arrivée = Algérie
  useEffect(() => {
    if (formData.fromCountry === "France") {
      setFormData((prev) => ({ ...prev, toCountry: "Algérie", fromCity: "", toCity: "" }));
    } else {
      setFormData((prev) => ({ ...prev, toCountry: "France", fromCity: "", toCity: "" }));
    }
  }, [formData.fromCountry]);

  // Détermine quelle liste afficher pour le départ et l'arrivée
  const departureCities = formData.fromCountry === "France" ? CITIES_FRANCE : CITIES_ALGERIA;
  const arrivalCities = formData.toCountry === "France" ? CITIES_FRANCE : CITIES_ALGERIA;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (parseFloat(formData.maxWeightKg) <= 0) throw new Error("Le poids doit être supérieur à 0 kg");
      if (formData.arrivalDate && formData.arrivalDate < formData.departureDate) {
        throw new Error("La date d'arrivée ne peut pas être avant la date de départ");
      }
      if (!formData.fromCity || !formData.toCity) {
        throw new Error("Veuillez sélectionner les villes");
      }

      const { error } = await supabase.from("trips").insert({
        traveler_id: userId,
        from_country: formData.fromCountry,
        from_city: formData.fromCity,
        to_country: formData.toCountry,
        to_city: formData.toCity,
        departure_date: formData.departureDate,
        arrival_date: formData.arrivalDate || null,
        max_weight_kg: parseFloat(formData.maxWeightKg),
        notes: formData.notes || null,
      });

      if (error) throw error;
      toast.success("Voyage créé avec succès !");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast.error(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
      <div className="grid md:grid-cols-2 gap-4">
        {/* DÉPART */}
        <div className="space-y-2">
          <Label>Pays de départ *</Label>
          <select
            value={formData.fromCountry}
            onChange={(e) => setFormData({ ...formData, fromCountry: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="France">France</option>
            <option value="Algérie">Algérie</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Ville de départ *</Label>
          {/* LISTE DÉROULANTE STRICTE */}
          <select
            value={formData.fromCity}
            onChange={(e) => setFormData({ ...formData, fromCity: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="">Choisir une ville...</option>
            {departureCities.sort().map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* ARRIVÉE (Désactivé pour forcer la logique inverse, ou juste affichage) */}
        <div className="space-y-2">
          <Label>Pays d'arrivée (Auto)</Label>
          <div className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground h-10 flex items-center">
            {formData.toCountry}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Ville d'arrivée *</Label>
          <select
            value={formData.toCity}
            onChange={(e) => setFormData({ ...formData, toCity: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="">Choisir une ville...</option>
            {arrivalCities.sort().map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* DATES & POIDS */}
        <div className="space-y-2">
          <Label>Date de départ *</Label>
          <Input
            type="date"
            min={today}
            value={formData.departureDate}
            onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Poids disponible (kg) *</Label>
          <Input
            type="number"
            step="0.5"
            min="0.5"
            value={formData.maxWeightKg}
            onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
            required
            placeholder="Ex: 5"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes (optionnel)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Précisions sur le lieu de RDV..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publication...
          </>
        ) : (
          "Publier ce voyage"
        )}
      </Button>
    </form>
  );
};

export default TripForm;
