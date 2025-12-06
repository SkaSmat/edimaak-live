import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProfileAvatarUpload } from "@/components/ProfileAvatarUpload";
import { useUserStats, isActiveSender, isActiveTraveler } from "@/hooks/useUserStats";
import { ActivityBadge, KycBadge, ProfileStats, VerifiedBadge } from "@/components/UserProfileBadges";

interface ProfileData {
  id: string;
  full_name: string;
  role: "traveler" | "sender" | "admin";
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  country_of_residence: string | null;
}

interface PrivateInfoData {
  phone: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  id_type: string | null;
  id_number: string | null;
  id_expiry_date: string | null;
}

const COUNTRY_CODES = [
  { code: "+33", label: "FR (+33)" },
  { code: "+213", label: "DZ (+213)" },
  { code: "+216", label: "TN (+216)" },
  { code: "+212", label: "MA (+212)" },
  { code: "+32", label: "BE (+32)" },
  { code: "+1", label: "CA (+1)" },
];

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");

  // Password
  const [newPassword, setNewPassword] = useState("");

  // KYC states
  const [phoneCode, setPhoneCode] = useState("+33");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [addressLine1, setAddressLine1] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiryDate, setIdExpiryDate] = useState("");

  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profileData) {
      navigate("/auth");
      return;
    }

    setProfile(profileData as ProfileData);
    setFirstName(profileData.first_name || "");
    setLastName(profileData.last_name || "");
    setCountryOfResidence(profileData.country_of_residence || "");

    const { data: privateData } = await supabase
      .from("private_info")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (privateData) {
      setPrivateInfo(privateData as PrivateInfoData);

      if (privateData.phone) {
        const foundCode = COUNTRY_CODES.find((c) => privateData.phone!.startsWith(c.code));
        if (foundCode) {
          setPhoneCode(foundCode.code);
          setPhoneNumber(privateData.phone!.replace(foundCode.code, ""));
        } else {
          setPhoneNumber(privateData.phone!);
        }
      }

      setAddressLine1(privateData.address_line1 || "");
      setAddressCity(privateData.address_city || "");
      setAddressPostalCode(privateData.address_postal_code || "");
      setAddressCountry(privateData.address_country || "");
      setIdType(privateData.id_type || "");
      setIdNumber(privateData.id_number || "");
      setIdExpiryDate(privateData.id_expiry_date || "");
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/";
  };

  const handleAvatarUpdated = (newUrl: string | null) => {
    if (profile) setProfile({ ...profile, avatar_url: newUrl });
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Mot de passe mis à jour avec succès !");
      setNewPassword("");
    } catch (error: any) {
      console.error(error);
      toast.error("Impossible de mettre à jour le mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  const savePersonalInfo = async () => {
    if (!user) return;
    setSavingPersonal(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        country_of_residence: countryOfResidence || null,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Informations personnelles enregistrées");
      if (profile) {
        setProfile({
          ...profile,
          first_name: firstName,
          last_name: lastName,
          country_of_residence: countryOfResidence,
        });
      }
    }
    setSavingPersonal(false);
  };

  const saveKycInfo = async () => {
    if (!user) return;

    // 1. Validation du Téléphone (Doit contenir au moins 8 chiffres, pas de lettres)
    // On nettoie les espaces et tirets pour vérifier
    const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, "");
    if (!/^\d{8,15}$/.test(cleanPhone)) {
      setPhoneError("Numéro invalide (8 chiffres minimum, sans lettres)");
      toast.error("Numéro de téléphone invalide");
      return;
    }
    setPhoneError("");

    // 2. Validation de la Pièce d'Identité (Min 5 caractères)
    if (!idNumber || idNumber.trim().length < 5) {
      toast.error("Numéro de pièce d'identité trop court ou invalide");
      return;
    }

    // 3. Validation du Type de pièce
    if (!idType) {
      toast.error("Veuillez sélectionner un type de pièce");
      return;
    }

    setSavingKyc(true);

    const fullPhone = `${phoneCode}${cleanPhone.replace(/^0+/, "")}`;

    const kycData = {
      id: user.id,
      phone: fullPhone,
      address_line1: addressLine1 || null,
      address_city: addressCity || null,
      address_postal_code: addressPostalCode || null,
      address_country: addressCountry || null,
      id_type: idType || null,
      id_number: idNumber || null,
      id_expiry_date: idExpiryDate || null,
    };

    const { error } = await supabase.from("private_info").upsert(kycData, { onConflict: "id" });

    if (error) {
      console.error("KYC save error:", error);
      toast.error("Erreur lors de la sauvegarde KYC");
    } else {
      toast.success("Informations KYC enregistrées et valides !");
      setPrivateInfo(kycData as PrivateInfoData);
    }
    setSavingKyc(false);
  };

  const stats = useUserStats(user?.id);
  const isVerified = Boolean(phoneNumber?.trim() && idType?.trim() && idNumber?.trim());
  const kycStatus = isVerified ? "complete" : "not_filled";

  const isActive =
    profile?.role === "traveler" ? isActiveTraveler(stats.tripsCount) : isActiveSender(stats.shipmentsCount);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout role={profile.role} fullName={profile.full_name} onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>

        {/* Aperçu */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <ProfileAvatarUpload
              userId={user.id}
              fullName={profile.full_name}
              currentAvatarUrl={profile.avatar_url}
              onAvatarUpdated={handleAvatarUpdated}
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : profile.full_name}
                </h2>
                <VerifiedBadge isVerified={isVerified} />
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                {/* LA CORRECTION EST ICI : On force le type pour éviter l'erreur TS */}
                <ActivityBadge isActive={isActive} role={profile.role as "traveler" | "sender"} />
                <KycBadge status={kycStatus} />
              </div>
            </div>
          </div>
        </section>

        {/* Sécurité */}
        <section className="bg-card rounded-2xl shadow-sm border p-6 border-l-4 border-l-primary/50">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Sécurité</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
                className="max-w-md"
              />
            </div>
            <Button onClick={handleUpdatePassword} disabled={savingPassword || !newPassword} variant="secondary">
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mise à jour...
                </>
              ) : (
                "Mettre à jour le mot de passe"
              )}
            </Button>
          </div>
        </section>

        {/* Infos Perso */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pays de résidence</Label>
              <Input
                value={countryOfResidence}
                onChange={(e) => setCountryOfResidence(e.target.value)}
                placeholder="France"
              />
            </div>
            <Button onClick={savePersonalInfo} disabled={savingPersonal}>
              {savingPersonal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </section>

        {/* KYC */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Vérification KYC</h2>
            <VerifiedBadge isVerified={isVerified} showLabel />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Numéro de téléphone <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <select
                  className="w-24 h-10 px-2 border border-input rounded-md bg-background text-sm"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (phoneError) setPhoneError("");
                  }}
                  placeholder="6 12 34 56 78"
                  className={`flex-1 ${phoneError ? "border-destructive" : ""}`}
                />
              </div>
              {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Pièce d'identité</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de pièce</Label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="carte_identite">Carte d'identité</option>
                    <option value="passeport">Passeport</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Numéro de pièce</Label>
                    <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date d'expiration</Label>
                    <Input type="date" value={idExpiryDate} onChange={(e) => setIdExpiryDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={saveKycInfo} disabled={savingKyc} className="mt-4">
              {savingKyc ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...
                </>
              ) : (
                "Enregistrer les informations KYC"
              )}
            </Button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
