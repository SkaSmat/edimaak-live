import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Upload, X, AlertTriangle } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { WORLD_COUNTRIES } from "@/lib/worldData";
import { z } from "zod";

interface ShipmentRequestFormProps {
  userId: string;
  onSuccess: () => void;
  editData?: {
    id: string;
    from_country: string;
    from_city: string;
    to_country: string;
    to_city: string;
    earliest_date: string;
    latest_date: string;
    weight_kg: number;
    item_type: string;
    notes: string | null;
    price: number | null;
    image_url: string | null;
  };
}

const COUNTRIES = WORLD_COUNTRIES.map(c => c.name);
const VALID_ITEM_TYPES = ["Documents", "Vêtements", "Médicaments", "Argent", "Autres"] as const;

// Zod schema for shipment request validation - sans limite de poids
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
  }).refine((val) => val > 0, "Le poids doit être supérieur à 0"),
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

const ShipmentRequestForm = ({ userId, onSuccess, editData }: ShipmentRequestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editData?.image_url || null);

  const [formData, setFormData] = useState({
    fromCountry: editData?.from_country || "France",
    fromCity: editData?.from_city || "",
    toCountry: editData?.to_country || "Algérie",
    toCity: editData?.to_city || "",
    earliestDate: editData?.earliest_date || "",
    latestDate: editData?.latest_date || "",
    weightKg: editData?.weight_kg?.toString() || "",
    itemType: (editData?.item_type || "") as typeof VALID_ITEM_TYPES[number] | "",
    itemTypeOther: "", // BUG 7: Field for "Autres, précisez"
    notes: editData?.notes || "",
    price: editData?.price?.toString() || "",
  });

  const [valueLimitConfirmed, setValueLimitConfirmed] = useState(!!editData);

  const today = new Date().toISOString().split("T")[0];
  const isEditing = !!editData;

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

    if (!valueLimitConfirmed) {
      toast.error("Veuillez confirmer que la valeur de votre colis ne dépasse pas 200€");
      return;
    }

    // BUG 7: Validate "Autres" requires specification
    if (formData.itemType === "Autres" && !formData.itemTypeOther.trim()) {
      toast.error("Veuillez préciser le type de colis");
      return;
    }

    setLoading(true);

    try {
      const validatedData = shipmentSchema.parse(formData);

      let imageUrl: string | null = editData?.image_url || null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("shipment-images").upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("shipment-images").getPublicUrl(fileName);
        imageUrl = publicUrl;
      } else if (imagePreview === null && editData?.image_url) {
        imageUrl = null;
      }

      const dataToSave = {
        from_country: validatedData.fromCountry,
        from_city: validatedData.fromCity,
        to_country: validatedData.toCountry,
        to_city: validatedData.toCity,
        earliest_date: validatedData.earliestDate,
        latest_date: validatedData.latestDate,
        weight_kg: validatedData.weightKg,
        item_type: validatedData.itemType,
        item_type_other: formData.itemType === "Autres" ? formData.itemTypeOther.trim() : null, // BUG 7
        notes: validatedData.notes || null,
        image_url: imageUrl,
        price: validatedData.price,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("shipment_requests")
          .update(dataToSave)
          .eq("id", editData.id)
          .eq("sender_id", userId);
        if (error) throw error;
        toast.success("Demande modifiée avec succès");
      } else {
        const { error } = await supabase.from("shipment_requests").insert({
          sender_id: userId,
          ...dataToSave,
          status: "open",
        });
        if (error) throw error;
        toast.success("Demande créée avec succès");
      }
      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(error.message || "Erreur lors de la sauvegarde");
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
              <option key={c} value={c} disabled={c === formData.toCountry} className={c === formData.toCountry ? "text-gray-300" : ""}>
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
              <option key={c} value={c} disabled={c === formData.fromCountry} className={c === formData.fromCountry ? "text-gray-300" : ""}>
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
          <Input type="date" min={today} value={formData.earliestDate} onChange={(e) => setFormData({ ...formData, earliestDate: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Jusqu'au *</Label>
          <Input type="date" min={formData.earliestDate || today} value={formData.latestDate} onChange={(e) => setFormData({ ...formData, latestDate: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Poids (kg) *</Label>
          <Input type="number" 
            inputMode="decimal" {/* 👈 AJOUT : Ouvre le pavé numérique avec virgule sur iPhone/Android */}
            step="0.1" min="0.1" value={formData.weightKg} onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })} required placeholder="Ex: 2" />
        </div>
        <div className="space-y-2">
          <Label>Type d'objet *</Label>
          <select
            value={formData.itemType}
            onChange={(e) => setFormData({ ...formData, itemType: e.target.value as typeof VALID_ITEM_TYPES[number], itemTypeOther: "" })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
            required
          >
            <option value="">Sélectionner...</option>
            {VALID_ITEM_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        {/* BUG 7: Conditional field for "Autres, précisez" */}
        {formData.itemType === "Autres" && (
          <div className="space-y-2">
            <Label>Précisez le type *</Label>
            <Input 
              type="text" 
              value={formData.itemTypeOther} 
              onChange={(e) => setFormData({ ...formData, itemTypeOther: e.target.value })}
              placeholder="Ex: Jouets, Livres, Accessoires..."
              required
              maxLength={100}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Prix proposé (€) <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
          <Input type="number" 
            inputMode="numeric" {/* 👈 AJOUT : Ouvre le pavé numérique simple */}
            step="1" min="1" max="10000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Ex: 50" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Image (optionnel)</Label>
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Aperçu" className="w-full h-48 object-cover rounded-lg border" />
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={removeImage}>
              <X className="w-4 h-4" />
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

      {/* Disclaimer limite de valeur */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            <p className="text-sm text-amber-800 font-medium">⚠️ Limite de valeur : 200€ maximum pour débuter</p>
            <p className="text-xs text-amber-700">
              Pour votre sécurité, les colis de grande valeur (électronique, bijoux, argent liquide) ne sont pas couverts.
              <a href="/securite" className="underline hover:text-amber-900 ml-1">En savoir plus</a>
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox id="value-limit" checked={valueLimitConfirmed} onCheckedChange={(checked) => setValueLimitConfirmed(checked === true)} />
              <label htmlFor="value-limit" className="text-sm text-amber-900 cursor-pointer">
                Je confirme que la valeur de mon colis ne dépasse pas 200€
              </label>
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading || !valueLimitConfirmed} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isEditing ? "Enregistrer les modifications" : "Créer la demande"}
      </Button>
    </form>
  );
};

export default ShipmentRequestForm;
