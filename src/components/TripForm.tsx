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

const COUNTRIES = ["France", "Algérie", "Canada", "Espagne", "Royaume-Uni"];

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

  // LOGIQUE INTELLIGENTE : Anti-Doublon
  // Si le pays de départ devient égal au pays d'arrivée, on change l'arrivée
  useEffect(() => {
    if (formData.fromCountry === formData.toCountry) {
      // On cherche un autre pays dans la liste pour éviter le blocage
      const otherCountry = COUNTRIES.find((c) => c !== formData.fromCountry) || "Algérie";
      setFormData((prev) => ({ ...prev, toCountry: otherCountry, toCity: "" }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.arrivalDate && formData.arrivalDate < formData.departureDate) {
        throw new Error("La date d'arrivée ne peut pas être avant la date de départ");
      }
      if (!formData.fromCity || !formData.toCity) {
        throw new Error("Veuillez sélectionner les villes");
      }
      if (formData.fromCountry === formData.toCountry) {
        throw new Error("Le départ et l'arrivée ne peuvent pas être le même pays.");
      }

      const weightToSend = formData.maxWeightKg ? parseFloat(formData.maxWeightKg) : 0;

      const { error } = await supabase.from("trips").insert({
        traveler_id: userId,
        from_country: formData.fromCountry,
        from_city: formData.fromCity,
        to_country: formData.toCountry,
        to_city: formData.toCity,
        departure_date: formData.departureDate,
        arrival_date: formData.arrivalDate || null,
        max_weight_kg: weightToSend,
        notes: formData.notes || null,
      });

      if (error) throw error;
      toast.success("Voyage créé avec succès !");
      onSuccess();
    } catch (error: any) {
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
              onChange={(e) => setFormData({ ...formData, fromCountry: e.target.value, fromCity: "" })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            >
              {COUNTRIES.map((c) => (
                <option
                  key={c}
                  value={c}
                  disabled={c === formData.toCountry} // GRISÉ SI DÉJÀ SÉLECTIONNÉ EN ARRIVÉE
                  className={c === formData.toCountry ? "text-gray-300" : ""}
                >
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Ville</Label>
            <CityAutocomplete
              value={formData.fromCity}
              onChange={(val) => setFormData({ ...formData, fromCity: val })}
              limitToCountry={formData.fromCountry as any}
              placeholder={`Ville de départ`}
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
            <select
              value={formData.toCountry}
              onChange={(e) => setFormData({ ...formData, toCountry: e.target.value, toCity: "" })}
              className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            >
              {COUNTRIES.map((c) => (
                <option
                  key={c}
                  value={c}
                  disabled={c === formData.fromCountry} // GRISÉ SI DÉJÀ SÉLECTIONNÉ EN DÉPART
                  className={c === formData.fromCountry ? "text-gray-300" : ""}
                >
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Ville</Label>
            <CityAutocomplete
              value={formData.toCity}
              onChange={(val) => setFormData({ ...formData, toCity: val })}
              limitToCountry={formData.toCountry as any}
              placeholder={`Ville d'arrivée`}
            />
          </div>

          <div className="space-y-1">
            <Label>
              Poids Dispo (kg) <span className="text-muted-foreground font-normal">(Optionnel)</span>
            </Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={formData.maxWeightKg}
              onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
              placeholder="Ex: 23"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Label>Notes (optionnel) <span className="text-muted-foreground text-xs">({formData.notes.length}/1000)</span></Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 1000) })}
          maxLength={1000}
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
