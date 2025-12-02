import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
      onSuccess();
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast.error("Une erreur est survenue. Vérifie ta connexion et réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromCountry">Pays de départ *</Label>
          <select
            id="fromCountry"
            value={formData.fromCountry}
            onChange={(e) => setFormData({ ...formData, fromCountry: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            required
          >
            <option value="France">France</option>
            <option value="Algérie">Algérie</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromCity">Ville de départ *</Label>
          <Input
            id="fromCity"
            value={formData.fromCity}
            onChange={(e) => setFormData({ ...formData, fromCity: e.target.value })}
            required
            placeholder="Paris, Lyon..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCountry">Pays d'arrivée *</Label>
          <select
            id="toCountry"
            value={formData.toCountry}
            onChange={(e) => setFormData({ ...formData, toCountry: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            required
          >
            <option value="France">France</option>
            <option value="Algérie">Algérie</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCity">Ville d'arrivée *</Label>
          <Input
            id="toCity"
            value={formData.toCity}
            onChange={(e) => setFormData({ ...formData, toCity: e.target.value })}
            required
            placeholder="Alger, Oran..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="departureDate">Date de départ *</Label>
          <Input
            id="departureDate"
            type="date"
            value={formData.departureDate}
            onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="arrivalDate">Date d'arrivée (optionnel)</Label>
          <Input
            id="arrivalDate"
            type="date"
            value={formData.arrivalDate}
            onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxWeightKg">Poids maximum (kg) *</Label>
          <Input
            id="maxWeightKg"
            type="number"
            step="0.1"
            value={formData.maxWeightKg}
            onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
            required
            placeholder="10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Informations complémentaires..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Création...
          </>
        ) : (
          "Créer le voyage"
        )}
      </Button>
    </form>
  );
};

export default TripForm;
