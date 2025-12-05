import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CitySelect } from "@/components/CitySelect";

interface TripFormProps {
  userId: string;
  onSuccess: () => void;
}

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

  // --- LOGIQUE INTELLIGENTE : BASCULE AUTOMATIQUE DES PAYS ---
  // Si l'utilisateur change le pays de départ, on inverse automatiquement l'arrivée et reset les villes
  useEffect(() => {
    if (formData.fromCountry === "France") {
      setFormData((prev) => ({ ...prev, toCountry: "Algérie", fromCity: "", toCity: "" }));
    } else if (formData.fromCountry === "Algérie") {
      setFormData((prev) => ({ ...prev, toCountry: "France", fromCity: "", toCity: "" }));
    }
  }, [formData.fromCountry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Validation du poids
      if (parseFloat(formData.maxWeightKg) <= 0) {
        throw new Error("Le poids doit être supérieur à 0 kg");
      }

      // 2. Validation des dates
      if (formData.arrivalDate && formData.arrivalDate < formData.departureDate) {
        throw new Error("La date d'arrivée ne peut pas être avant la date de départ");
      }

      // 3. Validation des villes sélectionnées
      if (!formData.fromCity || !formData.toCity) {
        throw new Error("Veuillez sélectionner les villes de départ et d'arrivée");
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
          <Label htmlFor="fromCountry">Pays de départ *</Label>
          <select
            id="fromCountry"
            value={formData.fromCountry}
            onChange={(e) => setFormData({ ...formData, fromCountry: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="France">France</option>
            <option value="Algérie">Algérie</option>
          </select>
        </div>

        <CitySelect
          value={formData.fromCity}
          onChange={(val) => setFormData({ ...formData, fromCity: val })}
          country={formData.fromCountry as "France" | "Algérie"}
          label="Ville de départ *"
          required
        />

        {/* ARRIVÉE */}
        <div className="space-y-2">
          <Label htmlFor="toCountry">Pays d'arrivée *</Label>
          <select
            id="toCountry"
            value={formData.toCountry}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10 opacity-60"
            disabled
          >
            <option value="Algérie">Algérie</option>
            <option value="France">France</option>
          </select>
          <p className="text-[10px] text-muted-foreground">Automatiquement défini selon le pays de départ</p>
        </div>

        <CitySelect
          value={formData.toCity}
          onChange={(val) => setFormData({ ...formData, toCity: val })}
          country={formData.toCountry as "France" | "Algérie"}
          label="Ville d'arrivée *"
          required
        />

        {/* DATES & POIDS */}
        <div className="space-y-2">
          <Label htmlFor="departureDate">Date de départ *</Label>
          <Input
            id="departureDate"
            type="date"
            min={today}
            value={formData.departureDate}
            onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxWeightKg">Kilos disponibles *</Label>
          <div className="relative">
            <Input
              id="maxWeightKg"
              type="number"
              step="0.5"
              min="0.5"
              value={formData.maxWeightKg}
              onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
              required
              placeholder="Ex: 5"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">kg</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Informations complémentaires</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Ex: Je pars de Paris Gare de Lyon, je peux prendre des objets fragiles..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Publication en cours...
          </>
        ) : (
          "Publier ce voyage"
        )}
      </Button>
    </form>
  );
};

export default TripForm;
