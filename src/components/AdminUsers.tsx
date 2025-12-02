import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShieldCheck, AlertCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getKycStatus } from "@/hooks/useUserStats";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  created_at: string;
  id_type: string | null;
  id_number: string | null;
  id_expiry_date: string | null;
  trips_count?: number;
  shipments_count?: number;
}

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch counts for each user
      const enrichedProfiles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { count: tripsCount } = await supabase
            .from("trips")
            .select("*", { count: "exact", head: true })
            .eq("traveler_id", profile.id);

          const { count: shipmentsCount } = await supabase
            .from("shipment_requests")
            .select("*", { count: "exact", head: true })
            .eq("sender_id", profile.id);

          return {
            ...profile,
            trips_count: tripsCount || 0,
            shipments_count: shipmentsCount || 0,
          };
        })
      );

      setProfiles(enrichedProfiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getKycBadge = (profile: Profile) => {
    const status = getKycStatus({
      phone: profile.phone,
      id_type: profile.id_type,
      id_number: profile.id_number,
      id_expiry_date: profile.id_expiry_date,
    });

    switch (status) {
      case "complete":
        return (
          <Badge className="bg-green-500/90 text-white border-0 gap-1">
            <ShieldCheck className="w-3 h-3" />
            Complet
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-0 gap-1">
            <Clock className="w-3 h-3" />
            Partiel
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <AlertCircle className="w-3 h-3" />
            Non rempli
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "traveler":
        return <Badge className="bg-blue-500/90">Voyageur</Badge>;
      case "sender":
        return <Badge className="bg-green-500/90">Expéditeur</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Nom</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>KYC</TableHead>
            <TableHead className="text-center">Voyages</TableHead>
            <TableHead className="text-center">Demandes</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Inscrit le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Aucun utilisateur
              </TableCell>
            </TableRow>
          ) : (
            profiles.map((profile) => (
              <TableRow key={profile.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{profile.full_name}</TableCell>
                <TableCell>{getRoleBadge(profile.role)}</TableCell>
                <TableCell>{getKycBadge(profile)}</TableCell>
                <TableCell className="text-center">{profile.trips_count}</TableCell>
                <TableCell className="text-center">{profile.shipments_count}</TableCell>
                <TableCell>{profile.phone || "-"}</TableCell>
                <TableCell>
                  {format(new Date(profile.created_at), "d MMM yyyy", { locale: fr })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminUsers;
