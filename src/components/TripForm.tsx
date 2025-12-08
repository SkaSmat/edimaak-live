import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { z } from "zod";

interface TripFormProps {
  userId: string;
  onSuccess: () => void;
}

const COUNTRIES = ["France", "Algérie", "Canada", "Espagne", "Royaume-Uni"];

// Zod schema for trip form validation
const tripSchema = z.object({
  fromCountry: z.string().min(1, "Pays de départ requis"),
  fromCity: z.string().min(1, "Ville de départ requise").max(100, "Nom de ville trop long"),
  toCountry: z.string().min(1, "Pays d'arrivée requis"),
  toCity: z.string().min(1, "Ville d'arrivée requise").max(100, "Nom de ville trop long"),
  departureDate: z.string().min(1, "Date de départ requise"),
  arrivalDate: z.string().optional(),
  maxWeightKg: z.string().optional().transform((val) => {
    if (!val || val === "") return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }).refine((val) => val >= 0 && val <= 500, "Le poids doit être entre 0 et 500 kg"),
  notes: z.string().max(1000, "Notes trop longues (max 1000 caractères)").optional(),
}).refine((data) => data.fromCountry !== data.toCountry, {
  message: "Le départ et l'arrivée ne peuvent pas être le même pays",
  path: ["toCountry"],
}).refine((data) => {
  if (!data.arrivalDate) return true;
  return data.arrivalDate >= data.departureDate;
}, {
  message: "La date d'arrivée ne peut pas être avant la date de départ",
  path: ["arrivalDate"],
});

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
      // Validate with zod
      const validatedData = tripSchema.parse(formData);

      const { error } = await supabase.from("trips").insert({
        traveler_id: userId,
        from_country: validatedData.fromCountry,
        from_city: validatedData.fromCity,
        to_country: validatedData.toCountry,
        to_city: validatedData.toCity,
        departure_date: validatedData.departureDate,
        arrival_date: validatedData.arrivalDate || null,
        max_weight_kg: validatedData.maxWeightKg,
        notes: validatedData.notes || null,
      });

      if (error) throw error;
      toast.success("Voyage créé avec succès !");
      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(error.message || "Une erreur est survenue.");
      }
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
              Poids Dispo (kg) <span className="text-muted-foreground font-normal">(Optionnel, max 500kg)</span>
            </Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="500"
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