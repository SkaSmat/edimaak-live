import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete"; // L'élément clé pour le matching

interface ShipmentRequestFormProps {
  userId: string;
  onSuccess: () => void;
}

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

  // Pour bloquer les dates passées
  const today = new Date().toISOString().split("T")[0];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5 Mo");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
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
      // 1. Validations de sécurité
      if (parseFloat(formData.weightKg) <= 0) {
        throw new Error("Le poids doit être supérieur à 0 kg");
      }

      if (formData.latestDate < formData.earliestDate) {
        throw new Error("La date limite ne peut pas être avant la date de début");
      }

      // 2. Upload de l'image
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from("shipment-images").upload(filePath, imageFile);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw new Error("Erreur lors de l'upload de l'image");
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("shipment-images").getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // 3. Nettoyage des villes (Trim) pour le matching exact
      const cleanFromCity = formData.fromCity.trim();
      const cleanToCity = formData.toCity.trim();

      const { error } = await supabase.from("shipment_requests").insert({
        sender_id: userId,
        from_country: formData.fromCountry,
        from_city: cleanFromCity,
        to_country: formData.toCountry,
        to_city: cleanToCity,
        earliest_date: formData.earliestDate,
        latest_date: formData.latestDate,
        weight_kg: parseFloat(formData.weightKg),
        item_type: formData.itemType,
        notes: formData.notes || null,
        image_url: imageUrl,
        status: "open", // On s'assure que le statut est bien ouvert par défaut
      });

      if (error) throw error;
      toast.success("Demande créée avec succès");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating shipment request:", error);
      toast.error(error.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Départ */}
        <div className="space-y-2">
          <Label htmlFor="fromCountry">Pays d'origine *</Label>
          <select
            id="fromCountry"
            value={formData.fromCountry}
            onChange={(e) => setFormData({ ...formData, fromCountry: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="France">France</option>
            <option value="Algérie">Algérie</option>
            <option value="Belgique">Belgique</option>
            <option value="Canada">Canada</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromCity">Ville d'origine *</Label>
          <CityAutocomplete
            value={formData.fromCity}
            onChange={(val) => setFormData({ ...formData, fromCity: val })}
            placeholder="Rechercher une ville..."
          />
        </div>

        {/* Arrivée */}
        <div className="space-y-2">
          <Label htmlFor="toCountry">Pays de destination *</Label>
          <select
            id="toCountry"
            value={formData.toCountry}
            onChange={(e) => setFormData({ ...formData, toCountry: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="Algérie">Algérie</option>
            <option value="France">France</option>
            <option value="Tunisie">Tunisie</option>
            <option value="Maroc">Maroc</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toCity">Ville de destination *</Label>
          <CityAutocomplete
            value={formData.toCity}
            onChange={(val) => setFormData({ ...formData, toCity: val })}
            placeholder="Rechercher une ville..."
          />
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <Label htmlFor="earliestDate">Dispo à partir du *</Label>
          <Input
            id="earliestDate"
            type="date"
            min={today} // Pas de date passée
            value={formData.earliestDate}
            onChange={(e) => setFormData({ ...formData, earliestDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="latestDate">Jusqu'au *</Label>
          <Input
            id="latestDate"
            type="date"
            min={formData.earliestDate || today} // Cohérence des dates
            value={formData.latestDate}
            onChange={(e) => setFormData({ ...formData, latestDate: e.target.value })}
            required
          />
        </div>

        {/* Poids et Type */}
        <div className="space-y-2">
          <Label htmlFor="weightKg">Poids (kg) *</Label>
          <Input
            id="weightKg"
            type="number"
            step="0.1"
            min="0.1" // Pas de poids négatif
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
            required
            placeholder="Ex: 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemType">Type d'objet *</Label>
          <Input
            id="itemType"
            value={formData.itemType}
            onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
            required
            placeholder="Documents, vêtements, électronique..."
          />
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label htmlFor="image">Image du colis (optionnel)</Label>
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Aperçu" className="w-full h-48 object-cover rounded-lg border border-border" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor="image"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Cliquez pour ajouter une photo</span>
            <span className="text-xs text-muted-foreground mt-1">(Max 5 Mo)</span>
            <input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Détails supplémentaires (fragile, volume...)"
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
