import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  
  // KYC states (now from private_info)
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiryDate, setIdExpiryDate] = useState("");

  // Phone validation error
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url, first_name, last_name, country_of_residence")
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

    // Fetch private_info data (GDPR separated)
    const { data: privateData } = await supabase
      .from("private_info")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (privateData) {
      setPrivateInfo(privateData as PrivateInfoData);
      setPhone(privateData.phone || "");
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
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  const handleAvatarUpdated = (newUrl: string | null) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: newUrl });
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
          first_name: firstName || null,
          last_name: lastName || null,
          country_of_residence: countryOfResidence || null,
        });
      }
    }
    setSavingPersonal(false);
  };

  const saveKycInfo = async () => {
    if (!user) return;

    // Validation: phone is REQUIRED
    if (!phone.trim()) {
      setPhoneError("Le numéro de téléphone est obligatoire");
      toast.error("Le numéro de téléphone est obligatoire");
      return;
    }
    setPhoneError("");

    setSavingKyc(true);

    const kycData = {
      id: user.id,
      phone: phone || null,
      address_line1: addressLine1 || null,
      address_city: addressCity || null,
      address_postal_code: addressPostalCode || null,
      address_country: addressCountry || null,
      id_type: idType || null,
      id_number: idNumber || null,
      id_expiry_date: idExpiryDate || null,
    };

    // Upsert into private_info table
    const { error } = await supabase
      .from("private_info")
      .upsert(kycData, { onConflict: "id" });

    if (error) {
      console.error("KYC save error:", error);
      toast.error("Erreur lors de la sauvegarde KYC");
    } else {
      toast.success("Informations KYC enregistrées");
      setPrivateInfo({
        phone: phone || null,
        address_line1: addressLine1 || null,
        address_city: addressCity || null,
        address_postal_code: addressPostalCode || null,
        address_country: addressCountry || null,
        id_type: idType || null,
        id_number: idNumber || null,
        id_expiry_date: idExpiryDate || null,
      });
    }
    setSavingKyc(false);
  };

  const stats = useUserStats(user?.id);
  
  // Verified status: phone + ID info filled
  const isVerified = Boolean(
    phone?.trim() && 
    idType?.trim() && 
    idNumber?.trim()
  );

  // KYC status for detailed badge
  const getKycStatus = () => {
    const kycFields = [phone, idType, idNumber, idExpiryDate];
    const filledFields = kycFields.filter(f => f && String(f).trim() !== "").length;
    if (filledFields === 0) return "not_filled";
    if (filledFields < kycFields.length) return "partial";
    return "complete";
  };

  const kycStatus = getKycStatus();

  const isActive = profile?.role === "traveler" 
    ? isActiveTraveler(stats.tripsCount)
    : isActiveSender(stats.shipmentsCount);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      role={profile.role as "traveler" | "sender"}
      fullName={profile.full_name}
      onLogout={handleLogout}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>

        {/* Section: Aperçu du profil */}
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
                  {firstName || lastName 
                    ? `${firstName} ${lastName}`.trim() 
                    : profile.full_name}
                </h2>
                <VerifiedBadge isVerified={isVerified} />
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                <ActivityBadge 
                  isActive={isActive} 
                  role={profile.role as "traveler" | "sender"} 
                />
                <KycBadge status={kycStatus} />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Statistiques */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Activité</h2>
          {stats.isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <ProfileStats 
              tripsCount={stats.tripsCount}
              shipmentsCount={stats.shipmentsCount}
              matchesCount={stats.matchesCount}
            />
          )}
        </section>

        {/* Section: Informations personnelles */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="countryOfResidence">Pays de résidence</Label>
              <Input
                id="countryOfResidence"
                value={countryOfResidence}
                onChange={(e) => setCountryOfResidence(e.target.value)}
                placeholder="France"
              />
            </div>
            <Button onClick={savePersonalInfo} disabled={savingPersonal}>
              {savingPersonal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </section>

        {/* Section: KYC */}
        <section className="bg-card rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Vérification KYC</h2>
            <VerifiedBadge isVerified={isVerified} showLabel />
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Ces informations sont confidentielles et permettent de sécuriser les échanges entre voyageurs et expéditeurs.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Numéro de téléphone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError("");
                }}
                placeholder="+33 6 12 34 56 78"
                className={phoneError ? "border-destructive" : ""}
              />
              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Adresse</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Adresse</Label>
                  <Input
                    id="addressLine1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="123 rue de la Paix"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressCity">Ville</Label>
                    <Input
                      id="addressCity"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressPostalCode">Code postal</Label>
                    <Input
                      id="addressPostalCode"
                      value={addressPostalCode}
                      onChange={(e) => setAddressPostalCode(e.target.value)}
                      placeholder="75001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressCountry">Pays</Label>
                    <Input
                      id="addressCountry"
                      value={addressCountry}
                      onChange={(e) => setAddressCountry(e.target.value)}
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Pièce d'identité</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">Type de pièce</Label>
                  <select
                    id="idType"
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="carte_identite">Carte d'identité</option>
                    <option value="passeport">Passeport</option>
                    <option value="permis_conduire">Permis de conduire</option>
                    <option value="titre_sejour">Titre de séjour</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">Numéro de pièce</Label>
                    <Input
                      id="idNumber"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idExpiryDate">Date d'expiration</Label>
                    <Input
                      id="idExpiryDate"
                      type="date"
                      value={idExpiryDate}
                      onChange={(e) => setIdExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={saveKycInfo} disabled={savingKyc} className="mt-4">
              {savingKyc ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
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