import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ArrowLeft, Star, Package, Plane, CheckCircle, MapPin, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  private_info?: {
    kyc_status: string;
  } | null;
}

interface UserStats {
  shipmentsCount: number;
  tripsCount: number;
  matchesCount: number;
  averageRating: number;
  reviewsCount: number;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      console.log("🔍 Chargement profil pour userId:", userId);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
    id,
    full_name,
    avatar_url,
    created_at,
    private_info (
      kyc_status
    )
  `,
        )
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData) {
        const [shipmentsRes, tripsRes, matchesRes] = await Promise.all([
          supabase.from("shipment_requests").select("id", { count: "exact", head: true }).eq("sender_id", userId),
          supabase.from("trips").select("id", { count: "exact", head: true }).eq("traveler_id", userId),
          supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "accepted"),
        ]);

        setStats({
          shipmentsCount: shipmentsRes.count || 0,
          tripsCount: tripsRes.count || 0,
          matchesCount: matchesRes.count || 0,
          averageRating: 0,
          reviewsCount: 0,
        });
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isVerified = profile?.private_info?.kyc_status === "verified";
  const memberSince = profile?.created_at ? format(new Date(profile.created_at), "MMMM yyyy", { locale: fr }) : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Profil introuvable</h2>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <UserAvatar fullName={profile.full_name} avatarUrl={profile.avatar_url} size="xl" />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 flex flex-wrap items-center gap-2">
                          {profile.full_name}
                          {isVerified && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />}
                        </h1>
                        {isVerified && (
                          <Badge className="bg-green-100 text-green-800 border-0">Identité vérifiée</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>Membre depuis {memberSince}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Activité sur EdiM3ak</h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{stats?.shipmentsCount || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Envois</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                    <Plane className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{stats?.tripsCount || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Voyages</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{stats?.matchesCount || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Matches</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {stats && stats.reviewsCount > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Avis reçus</h2>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-lg font-bold">{stats.averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({stats.reviewsCount} avis)</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-center py-8">Les avis seront bientôt disponibles</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-4">Vérifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {isVerified ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm">Identité vérifiée</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Identité non vérifiée</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Email vérifié</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {stats && (stats.shipmentsCount > 0 || stats.tripsCount > 0) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-foreground mb-4">En bref</h3>
                  <div className="space-y-3 text-sm">
                    {stats.shipmentsCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Expéditions réalisées</span>
                        <span className="font-bold">{stats.shipmentsCount}</span>
                      </div>
                    )}
                    {stats.tripsCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Voyages effectués</span>
                        <span className="font-bold">{stats.tripsCount}</span>
                      </div>
                    )}
                    {stats.matchesCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Collaborations</span>
                        <span className="font-bold">{stats.matchesCount}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
