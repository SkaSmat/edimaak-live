import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";

interface ShipmentRequestFormProps {
  userId: string;
  onSuccess: () => void;
}

const COUNTRIES = ["France", "Algérie", "Canada", "Espagne", "Royaume-Uni"];

const ShipmentRequestForm = ({ userId, onSuccess }: ShipmentRequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const today = new Date().toISOString().split("T")[0];

  // LOGIQUE ANTI-DOUBLON
  useEffect(() => {
    if (formData.fromCountry === formData.toCountry) {
      const otherCountry = COUNTRIES.find((c) => c !== formData.fromCountry) || "Algérie";
      setFormData((prev) => ({ ...prev, toCountry: otherCountry, toCity: "" }));
    }
  }, [formData.fromCountry]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5 Mo");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (parseFloat(formData.weightKg) <= 0) throw new Error("Le poids doit être positif");
      if (formData.latestDate < formData.earliestDate) throw new Error("La date limite est avant la date de début");
      if (formData.fromCountry === formData.toCountry) throw new Error("Départ et arrivée identiques.");
      if (!formData.fromCity || !formData.toCity) throw new Error("Veuillez sélectionner les villes");

      let imageUrl: string | null = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("shipment-images").upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("shipment-images").getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

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
        image_url: imageUrl,
        status: "open",
      });

      if (error) throw error;
      toast.success("Demande créée avec succès");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pays d'origine *</Label>
          <select
            value={formData.fromCountry}
            onChange={(e) => setFormData({ ...formData, fromCountry: e.target.value, fromCity: "" })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            {COUNTRIES.map((c) => (
              <option
                key={c}
                value={c}
                disabled={c === formData.toCountry}
                className={c === formData.toCountry ? "text-gray-300" : ""}
              >
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Ville d'origine *</Label>
          <CityAutocomplete
            value={formData.fromCity}
            onChange={(val) => setFormData({ ...formData, fromCity: val })}
            limitToCountry={formData.fromCountry as any}
            placeholder={`Départ (${formData.fromCountry})`}
          />
        </div>

        <div className="space-y-2">
          <Label>Pays de destination *</Label>
          <select
            value={formData.toCountry}
            onChange={(e) => setFormData({ ...formData, toCountry: e.target.value, toCity: "" })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            {COUNTRIES.map((c) => (
              <option
                key={c}
                value={c}
                disabled={c === formData.fromCountry}
                className={c === formData.fromCountry ? "text-gray-300" : ""}
              >
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Ville de destination *</Label>
          <CityAutocomplete
            value={formData.toCity}
            onChange={(val) => setFormData({ ...formData, toCity: val })}
            limitToCountry={formData.toCountry as any}
            placeholder={`Arrivée (${formData.toCountry})`}
          />
        </div>

        <div className="space-y-2">
          <Label>Dispo à partir du *</Label>
          <Input
            type="date"
            min={today}
            value={formData.earliestDate}
            onChange={(e) => setFormData({ ...formData, earliestDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Jusqu'au *</Label>
          <Input
            type="date"
            min={formData.earliestDate || today}
            value={formData.latestDate}
            onChange={(e) => setFormData({ ...formData, latestDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Poids (kg) *</Label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
            required
            placeholder="Ex: 2"
          />
        </div>
        <div className="space-y-2">
          <Label>Type d'objet *</Label>
          <select
            value={formData.itemType}
            onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="">Sélectionner...</option>
            <option value="Documents">Documents</option>
            <option value="Vêtements">Vêtements</option>
            <option value="Médicaments">Médicaments</option>
            <option value="Argent">Argent</option>
            <option value="Autres">Autres</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Image (optionnel)</Label>
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Aperçu" className="w-full h-48 object-cover rounded-lg border" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              {" "}
              <X className="w-4 h-4" />{" "}
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Ajouter une photo (Max 5Mo)</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Créer la demande"}
      </Button>
    </form>
  );
};

export default ShipmentRequestForm;
