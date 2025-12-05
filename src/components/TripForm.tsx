import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";

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
    fromCountry: "France" as "France" | "Algérie",
    fromCity: "",
    toCountry: "Algérie" as "France" | "Algérie",
    toCity: "",
    departureDate: "",
    arrivalDate: "",
    maxWeightKg: "", // String vide par défaut
    notes: "",
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (formData.fromCountry === "France") {
      setFormData((prev) => ({ ...prev, toCountry: "Algérie", fromCity: "", toCity: "" }));
    } else {
      setFormData((prev) => ({ ...prev, toCountry: "France", fromCity: "", toCity: "" }));
    }
  }, [formData.fromCountry]);

  const toggleDirection = () => {
    setFormData((prev) => ({
      ...prev,
      fromCountry: prev.toCountry,
      fromCity: "",
      toCountry: prev.fromCountry,
      toCity: "",
    }));
  };

  const handleCountryChange = (type: "from" | "to", value: string) => {
    if (type === "from") {
      const newFrom = value as "France" | "Algérie";
      const newTo = newFrom === "France" ? "Algérie" : "France";
      setFormData((prev) => ({ ...prev, fromCountry: newFrom, toCountry: newTo, fromCity: "", toCity: "" }));
    } else {
      const newTo = value as "France" | "Algérie";
      const newFrom = newTo === "France" ? "Algérie" : "France";
      setFormData((prev) => ({ ...prev, toCountry: newTo, fromCountry: newFrom, fromCity: "", toCity: "" }));
    }
  };

  const departureCities = formData.fromCountry === "France" ? CITIES_FRANCE : CITIES_ALGERIA;
  const arrivalCities = formData.toCountry === "France" ? CITIES_FRANCE : CITIES_ALGERIA;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation dates
      if (formData.arrivalDate && formData.arrivalDate < formData.departureDate) {
        throw new Error("La date d'arrivée ne peut pas être avant la date de départ");
      }
      if (!formData.fromCity || !formData.toCity) {
        throw new Error("Veuillez sélectionner les villes");
      }

      // CORRECTION : Poids optionnel
      // Si vide -> on envoie 0 (pour ne pas casser le type numérique de la base)
      const weightToSend = formData.maxWeightKg ? parseFloat(formData.maxWeightKg) : 0;

      const { error } = await supabase.from("trips").insert({
        traveler_id: userId,
        from_country: formData.fromCountry,
        from_city: formData.fromCity,
        to_country: formData.toCountry,
        to_city: formData.toCity,
        departure_date: formData.departureDate,
        arrival_date: formData.arrivalDate || null,
        max_weight_kg: weightToSend, // On envoie 0 si vide
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
    <form onSubmit={handleSubmit} className="space-y-5 p-5 border rounded-xl bg-card shadow-sm">
      {/* HEADER AVEC BOUTON D'INVERSION */}
      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
        <span className="text-sm font-medium text-muted-foreground">Sens du voyage :</span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-primary">{formData.fromCountry}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleDirection}
            className="h-8 w-8 rounded-full hover:bg-primary/10"
          >
            <ArrowRightLeft className="w-4 h-4 text-primary" />
          </Button>
          <span className="font-bold text-primary">{formData.toCountry}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* BLOC DÉPART */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Départ</h4>

          <div className="space-y-1">
            <Label>Pays</Label>
            <select
              value={formData.fromCountry}
              onChange={(e) => handleCountryChange("from", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            >
              <option value="France">France</option>
              <option value="Algérie">Algérie</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>Ville</Label>
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

          <div className="space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              min={today}
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              required
            />
          </div>
        </div>

        {/* BLOC ARRIVÉE */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Arrivée</h4>

          <div className="space-y-1">
            <Label>Pays</Label>
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed">
              {formData.toCountry}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Ville</Label>
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

          <div className="space-y-1">
            {/* CORRECTION ICI : Label Optionnel et pas de required */}
            <Label>
              Poids Dispo (kg) <span className="text-muted-foreground font-normal">(Optionnel)</span>
            </Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={formData.maxWeightKg}
              onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
              // Pas de 'required'
              placeholder="Ex: 23"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Label>Notes (optionnel)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Ex: Je pars de Orly, je peux prendre des objets fragiles..."
          rows={2}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full h-11 text-base">
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
