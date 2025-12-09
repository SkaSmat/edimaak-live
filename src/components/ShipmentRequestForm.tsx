import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { z } from "zod";

interface ShipmentRequestFormProps {
  userId: string;
  onSuccess: () => void;
}

const COUNTRIES = ["France", "Algérie", "Canada", "Espagne", "Royaume-Uni"];
const VALID_ITEM_TYPES = ["Documents", "Vêtements", "Médicaments", "Argent", "Autres"] as const;

// Zod schema for shipment request validation
const shipmentSchema = z.object({
  fromCountry: z.string().min(1, "Pays d'origine requis"),
  fromCity: z.string().min(1, "Ville d'origine requise").max(100, "Nom de ville trop long"),
  toCountry: z.string().min(1, "Pays de destination requis"),
  toCity: z.string().min(1, "Ville de destination requise").max(100, "Nom de ville trop long"),
  earliestDate: z.string().min(1, "Date de début requise"),
  latestDate: z.string().min(1, "Date limite requise"),
  weightKg: z.string().min(1, "Poids requis").transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error("Poids invalide");
    return num;
  }).refine((val) => val > 0 && val <= 100, "Le poids doit être entre 0.1 et 100 kg"),
  itemType: z.enum(VALID_ITEM_TYPES, { errorMap: () => ({ message: "Type d'objet invalide" }) }),
  notes: z.string().max(1000, "Notes trop longues (max 1000 caractères)").optional(),
  price: z.string().optional().transform((val) => {
    if (!val || val === "") return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    return num;
  }).refine((val) => val === null || (val > 0 && val <= 10000), "Le prix doit être entre 1 et 10000 €"),
}).refine((data) => data.fromCountry !== data.toCountry, {
  message: "Le départ et l'arrivée ne peuvent pas être le même pays",
  path: ["toCountry"],
}).refine((data) => data.latestDate >= data.earliestDate, {
  message: "La date limite ne peut pas être avant la date de début",
  path: ["latestDate"],
});

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
    itemType: "" as typeof VALID_ITEM_TYPES[number] | "",
    notes: "",
    price: "",
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
      // Validate MIME type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast.error("Format d'image non supporté. Utilisez JPG, PNG, WebP ou GIF.");
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
      // Validate with zod
      const validatedData = shipmentSchema.parse(formData);

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
        from_country: validatedData.fromCountry,
        from_city: validatedData.fromCity,
        to_country: validatedData.toCountry,
        to_city: validatedData.toCity,
        earliest_date: validatedData.earliestDate,
        latest_date: validatedData.latestDate,
        weight_kg: validatedData.weightKg,
        item_type: validatedData.itemType,
        notes: validatedData.notes || null,
        image_url: imageUrl,
        price: validatedData.price,
        status: "open",
      });

      if (error) throw error;
      toast.success("Demande créée avec succès");
      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(error.message || "Erreur lors de la création");
      }
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
          <Label>Poids (kg) * <span className="text-muted-foreground font-normal">(max 100kg)</span></Label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            max="100"
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
            onChange={(e) => setFormData({ ...formData, itemType: e.target.value as typeof VALID_ITEM_TYPES[number] })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="">Sélectionner...</option>
            {VALID_ITEM_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Prix proposé (€) <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
          <Input
            type="number"
            step="1"
            min="1"
            max="10000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Ex: 50"
          />
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
            <span className="text-sm text-muted-foreground">Ajouter une photo (Max 5Mo, JPG/PNG/WebP/GIF)</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>
      <div className="space-y-2">
        <Label>Notes <span className="text-muted-foreground text-xs">({formData.notes.length}/1000)</span></Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 1000) })}
          maxLength={1000}
          rows={3}
          placeholder="Décrivez votre colis, précautions particulières..."
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Créer la demande"}
      </Button>
    </form>
  );
};

export default ShipmentRequestForm;