import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, BellOff, Trash2, Plus, Loader2 } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { WORLD_COUNTRIES } from "@/lib/worldData";

interface Alert {
  id: string;
  from_city: string | null;
  from_country: string;
  to_city: string | null;
  to_country: string;
  is_active: boolean;
  created_at: string;
}

interface AlertManagerProps {
  userId: string;
}

const COUNTRIES = WORLD_COUNTRIES.map((c) => c.name);

const AlertManager = ({ userId }: AlertManagerProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fromCountry: "France",
    fromCity: "",
    toCountry: "Algerie",
    toCity: "",
  });

  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shipment_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.fromCountry || !formData.toCountry) {
      toast.error("Les pays sont requis.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("shipment_alerts").insert({
        user_id: userId,
        from_city: formData.fromCity || null,
        from_country: formData.fromCountry,
        to_city: formData.toCity || null,
        to_country: formData.toCountry,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Cette alerte existe deja.");
        } else throw error;
      } else {
        toast.success("Alerte creee !");
        setShowForm(false);
        setFormData({ fromCountry: "France", fromCity: "", toCountry: "Algerie", toCity: "" });
        fetchAlerts();
      }
    } catch (err) {
      toast.error("Erreur lors de la creation.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (alertId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("shipment_alerts")
        .update({ is_active: !currentActive })
        .eq("id", alertId)
        .eq("user_id", userId);

      if (error) throw error;
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_active: !currentActive } : a))
      );
      toast.success(!currentActive ? "Alerte activee" : "Alerte desactivee");
    } catch (err) {
      toast.error("Erreur lors de la mise a jour.");
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("shipment_alerts")
        .delete()
        .eq("id", alertId)
        .eq("user_id", userId);

      if (error) throw error;
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alerte supprimee");
    } catch (err) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Chargement des alertes...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Mes alertes email</h3>
          <span className="text-xs text-muted-foreground">({alerts.length})</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Nouvelle alerte
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Recevez un email quand une nouvelle demande d'expedition correspond a vos trajets.
      </p>

      {/* Create form */}
      {showForm && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Pays de depart</Label>
              <select
                value={formData.fromCountry}
                onChange={(e) => setFormData({ ...formData, fromCountry: e.target.value, fromCity: "" })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background h-9 text-sm"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pays d'arrivee</Label>
              <select
                value={formData.toCountry}
                onChange={(e) => setFormData({ ...formData, toCountry: e.target.value, toCity: "" })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background h-9 text-sm"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ville depart (optionnel)</Label>
              <CityAutocomplete
                value={formData.fromCity}
                onChange={(val) => setFormData({ ...formData, fromCity: val })}
                limitToCountry={formData.fromCountry as any}
                placeholder="Toutes les villes"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ville arrivee (optionnel)</Label>
              <CityAutocomplete
                value={formData.toCity}
                onChange={(val) => setFormData({ ...formData, toCity: val })}
                limitToCountry={formData.toCountry as any}
                placeholder="Toutes les villes"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
              Creer l'alerte
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg bg-muted/10">
          <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Aucune alerte configuree.</p>
          <p className="text-xs mt-1">Creez une alerte pour etre notifie(e) des nouvelles demandes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                alert.is_active ? "bg-card" : "bg-muted/30 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Bell className={`w-4 h-4 flex-shrink-0 ${alert.is_active ? "text-primary" : "text-muted-foreground"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {alert.from_city || alert.from_country} → {alert.to_city || alert.to_country}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.is_active ? "Active" : "Desactivee"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleToggle(alert.id, alert.is_active)}
                  title={alert.is_active ? "Desactiver" : "Activer"}
                >
                  {alert.is_active ? (
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Bell className="w-4 h-4 text-primary" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(alert.id)}
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertManager;
