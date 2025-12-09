import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  User, 
  Calendar, 
  Package, 
  Plane, 
  CheckCircle, 
  Clock,
  MapPin,
  Star,
  Shield
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface PublicProfile {
  id: string;
  full_name: string;
  first_name: string | null;
  avatar_url: string | null;
  role: string;
  country_of_residence: string | null;
  created_at: string;
}

interface UserStats {
  shipmentsCount: number;
  tripsCount: number;
  completedMatchesCount: number;
}

interface PrivateInfoForVerification {
  phone: string | null;
  id_type: string | null;
  id_number: string | null;
}

export const PublicProfileModal = ({ isOpen, onClose, userId }: PublicProfileModalProps) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ shipmentsCount: 0, tripsCount: 0, completedMatchesCount: 0 });
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfileData();
    }
  }, [isOpen, userId]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch profile via la fonction sécurisée get_public_profile
      const { data: profileData, error: profileError } = await supabase
        .rpc("get_public_profile", { profile_id: userId });

      if (profileError) throw profileError;
      
      if (profileData && profileData.length > 0) {
        const p = profileData[0];
        setProfile({
          id: p.id,
          full_name: p.display_first_name || "Utilisateur",
          first_name: p.display_first_name,
          avatar_url: p.avatar_url,
          role: p.role,
          country_of_residence: null, // Non disponible via get_public_profile
          created_at: p.created_at,
        });
      } else {
        setProfile(null);
      }

      // Fetch private_info to check KYC status
      const { data: privateData } = await supabase
        .from("private_info")
        .select("phone, id_type, id_number")
        .eq("id", userId)
        .maybeSingle();

      // Vérifier si le KYC est réellement complété
      const isVerified = Boolean(
        privateData?.phone?.trim() &&
        privateData?.id_type?.trim() &&
        privateData?.id_number?.trim()
      );
      setIsKycVerified(isVerified);

      // Fetch stats
      const [shipmentsRes, tripsRes, matchesRes] = await Promise.all([
        supabase.from("shipment_requests").select("id", { count: "exact", head: true }).eq("sender_id", userId),
        supabase.from("trips").select("id", { count: "exact", head: true }).eq("traveler_id", userId),
        // Count completed matches where user is involved
        fetchCompletedMatches(userId),
      ]);

      setStats({
        shipmentsCount: shipmentsRes.count || 0,
        tripsCount: tripsRes.count || 0,
        completedMatchesCount: matchesRes,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedMatches = async (uid: string): Promise<number> => {
    try {
      // Get all shipment IDs for this user
      const { data: shipments } = await supabase.from("shipment_requests").select("id").eq("sender_id", uid);
      const { data: trips } = await supabase.from("trips").select("id").eq("traveler_id", uid);

      const shipmentIds = shipments?.map((s) => s.id) || [];
      const tripIds = trips?.map((t) => t.id) || [];

      if (shipmentIds.length === 0 && tripIds.length === 0) return 0;

      let count = 0;

      if (shipmentIds.length > 0) {
        const { count: c1 } = await supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .in("shipment_request_id", shipmentIds)
          .eq("status", "completed");
        count += c1 || 0;
      }

      if (tripIds.length > 0) {
        const { count: c2 } = await supabase
          .from("matches")
          .select("id", { count: "exact", head: true })
          .in("trip_id", tripIds)
          .eq("status", "completed");
        count += c2 || 0;
      }

      return count;
    } catch {
      return 0;
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name) return profile.first_name;
    if (profile?.full_name) {
      const parts = profile.full_name.split(" ");
      return parts[0];
    }
    return "Utilisateur";
  };

  const getMemberSince = () => {
    if (!profile?.created_at) return "";
    return format(new Date(profile.created_at), "MMMM yyyy", { locale: fr });
  };

  const getRoleBadge = () => {
    switch (profile?.role) {
      case "traveler":
        return { label: "Voyageur", icon: Plane, color: "bg-blue-100 text-blue-700" };
      case "sender":
        return { label: "Expéditeur", icon: Package, color: "bg-orange-100 text-orange-700" };
      default:
        return { label: "Membre", icon: User, color: "bg-gray-100 text-gray-700" };
    }
  };

  const roleBadge = getRoleBadge();
  const isActive = stats.shipmentsCount > 2 || stats.tripsCount > 2 || stats.completedMatchesCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <>
            {/* Header avec avatar */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
              <div className="relative inline-block">
                <UserAvatar
                  fullName={profile.full_name}
                  avatarUrl={profile.avatar_url}
                  size="lg"
                  className="w-24 h-24 border-4 border-white shadow-lg"
                />
                {isActive && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 shadow-md">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-foreground mt-4">{getDisplayName()}</h2>
              
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className={`${roleBadge.color} gap-1`}>
                  <roleBadge.icon className="w-3 h-3" />
                  {roleBadge.label}
                </Badge>
                {isActive && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                    <Star className="w-3 h-3" />
                    Membre actif
                  </Badge>
                )}
              </div>
            </div>

            {/* Informations */}
            <div className="p-6 space-y-5">
              {/* Infos de base */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis {getMemberSince()}</span>
                </div>
                {profile.country_of_residence && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.country_of_residence}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.shipmentsCount}</div>
                  <div className="text-xs text-muted-foreground">Demandes</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.tripsCount}</div>
                  <div className="text-xs text-muted-foreground">Voyages</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.completedMatchesCount}</div>
                  <div className="text-xs text-muted-foreground">Complétés</div>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className={`w-4 h-4 ${isKycVerified ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={isKycVerified ? "text-green-700" : "text-muted-foreground"}>
                    {isKycVerified ? "Utilisateur vérifié" : "Utilisateur non vérifié"}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            Profil introuvable
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
