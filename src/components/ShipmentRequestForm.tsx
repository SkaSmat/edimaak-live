import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ShipmentRequestFormProps {
  userId: string;
  onSuccess: () => void;
}

const ShipmentRequestForm = ({ userId, onSuccess }: ShipmentRequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromCountry: "France",
    fromCity: "",
    toCountry: "Algérie",
    toCity: "",
    earliestDate: "",
    latestDate: "",
    weightKg: "",
    itemType: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("shipment_requests").insert({
        sender_id: userId,
        from_country: formData.fromCountry,
        from_city: formData.fromCity,
        to_country: formData.toCountry,
        to_city: formData.toCity,
        earliest_date: formData.earliestDate,
        latest_date: formData.latestDate,
        weight_kg: parseFloat(formData.weightKg),
        item_type: formData.itemType,
        notes: formData.notes || null,
      });

      if (error) throw error;
      onSuccess();
    } catch (error: any) {
      console.error("Error creating shipment request:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromCountry">Pays d'origine *</Label>
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
          <Label htmlFor="fromCity">Ville d'origine *</Label>
          <Input
            id="fromCity"
            value={formData.fromCity}
            onChange={(e) => setFormData({ ...formData, fromCity: e.target.value })}
            required
            placeholder="Paris, Lyon..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCountry">Pays de destination *</Label>
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
          <Label htmlFor="toCity">Ville de destination *</Label>
          <Input
            id="toCity"
            value={formData.toCity}
            onChange={(e) => setFormData({ ...formData, toCity: e.target.value })}
            required
            placeholder="Alger, Oran..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="earliestDate">Date au plus tôt *</Label>
          <Input
            id="earliestDate"
            type="date"
            value={formData.earliestDate}
            onChange={(e) => setFormData({ ...formData, earliestDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="latestDate">Date au plus tard *</Label>
          <Input
            id="latestDate"
            type="date"
            value={formData.latestDate}
            onChange={(e) => setFormData({ ...formData, latestDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weightKg">Poids (kg) *</Label>
          <Input
            id="weightKg"
            type="number"
            step="0.1"
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
            required
            placeholder="5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemType">Type d'objet *</Label>
          <Input
            id="itemType"
            value={formData.itemType}
            onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
            required
            placeholder="Documents, vêtements..."
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
          "Créer la demande"
        )}
      </Button>
    </form>
  );
};

export default ShipmentRequestForm;
