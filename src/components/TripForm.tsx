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

const TripForm = ({ userId, onSuccess }: TripFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromCountry: "France" as "France" | "Algérie",
    fromCity: "",
    toCountry: "Algérie" as "France" | "Algérie",
    toCity: "",
    departureDate: "",
    arrivalDate: "",
    maxWeightKg: "",
    notes: "",
  });

  const today = new Date().toISOString().split("T")[0];

  // Fonction pour inverser le sens du voyage en un clic
  const toggleDirection = () => {
    setFormData((prev) => ({
      ...prev,
      fromCountry: prev.toCountry,
      fromCity: "", // On vide les villes car elles ne sont plus valides
      toCountry: prev.fromCountry,
      toCity: "",
    }));
  };

  // Sécurité : Si l'utilisateur change manuellement le pays (via select), on adapte l'autre
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (parseFloat(formData.maxWeightKg) <= 0) throw new Error("Le poids doit être positif");
      if (formData.arrivalDate && formData.arrivalDate < formData.departureDate) throw new Error("Erreur de dates");
      if (!formData.fromCity || !formData.toCity) throw new Error("Veuillez sélectionner les villes");

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
      console.error(error);
      toast.error(error.message || "Erreur création voyage");
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
            {/* ICI : On passe limitToCountry pour restreindre la liste */}
            <CityAutocomplete
              value={formData.fromCity}
              onChange={(val) => setFormData({ ...formData, fromCity: val })}
              limitToCountry={formData.fromCountry}
              placeholder={`Ville de départ (${formData.fromCountry})`}
            />
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
            <CityAutocomplete
              value={formData.toCity}
              onChange={(val) => setFormData({ ...formData, toCity: val })}
              limitToCountry={formData.toCountry}
              placeholder={`Ville d'arrivée (${formData.toCountry})`}
            />
          </div>

          <div className="space-y-1">
            <Label>Poids Dispo (kg)</Label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.maxWeightKg}
              onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
              required
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
