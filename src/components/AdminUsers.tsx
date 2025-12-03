import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShieldCheck, AlertCircle, Clock, Loader2, Search, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getKycStatus } from "@/hooks/useUserStats";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  is_active: boolean;
}

interface PrivateInfo {
  id: string;
  phone: string | null;
  id_type: string | null;
  id_number: string | null;
  id_expiry_date: string | null;
}

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [privateInfoMap, setPrivateInfoMap] = useState<Map<string, PrivateInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at, is_active")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch private_info for KYC status (admin has access via RLS)
      const { data: privateData, error: privateError } = await supabase
        .from("private_info")
        .select("id, phone, id_type, id_number, id_expiry_date");

      if (privateError) {
        console.error("Error fetching private info:", privateError);
      }

      // Create a map of private info by user id
      const infoMap = new Map<string, PrivateInfo>();
      (privateData || []).forEach((info: PrivateInfo) => {
        infoMap.set(info.id, info);
      });
      setPrivateInfoMap(infoMap);

      // Protection : si la colonne est vide (null), on considère l'user comme actif
      const sanitizedProfiles = (profilesData || []).map((p) => ({
        ...p,
        is_active: p.is_active === null ? true : p.is_active,
      }));

      setProfiles(sanitizedProfiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;

      const { error } = await supabase.from("profiles").update({ is_active: newStatus }).eq("id", userId);

      if (error) throw error;

      // Mise à jour immédiate de l'affichage (sans recharger la page)
      setProfiles(profiles.map((p) => (p.id === userId ? { ...p, is_active: newStatus } : p)));

      toast.success(newStatus ? "Utilisateur réactivé" : "Utilisateur banni");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Impossible de modifier le statut");
    }
  };

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const query = searchQuery.toLowerCase();
    return profiles.filter((profile) => {
      const privateInfo = privateInfoMap.get(profile.id);
      return (
        profile.full_name.toLowerCase().includes(query) ||
        profile.role.toLowerCase().includes(query) ||
        privateInfo?.phone?.toLowerCase().includes(query)
      );
    });
  }, [profiles, privateInfoMap, searchQuery]);

  const getKycBadge = (profileId: string) => {
    const privateInfo = privateInfoMap.get(profileId);
    const status = getKycStatus({
      phone: privateInfo?.phone,
      id_type: privateInfo?.id_type,
      id_number: privateInfo?.id_number,
      id_expiry_date: privateInfo?.id_expiry_date,
    });

    switch (status) {
      case "complete":
        return (
          <Badge className="bg-green-500/90 border-0 gap-1">
            <ShieldCheck className="w-3 h-3" /> Complet
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-0 gap-1">
            <Clock className="w-3 h-3" /> Partiel
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <AlertCircle className="w-3 h-3" /> Vide
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
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, rôle ou téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Statut</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Aucun résultat
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles.map((profile) => {
                const privateInfo = privateInfoMap.get(profile.id);
                return (
                  <TableRow key={profile.id} className={!profile.is_active ? "bg-red-50/50" : ""}>
                    <TableCell>
                      {profile.is_active ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 block" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 block" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {profile.full_name}
                      {!profile.is_active && <span className="ml-2 text-xs text-red-500 font-bold">(Banni)</span>}
                    </TableCell>
                    <TableCell>{getRoleBadge(profile.role)}</TableCell>
                    <TableCell>{getKycBadge(profile.id)}</TableCell>
                    <TableCell>{privateInfo?.phone || "-"}</TableCell>
                    <TableCell>{format(new Date(profile.created_at), "d MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={profile.is_active ? "ghost" : "outline"}
                        size="sm"
                        onClick={() => handleToggleStatus(profile.id, profile.is_active)}
                        className={
                          profile.is_active
                            ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                            : "text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                        }
                      >
                        {profile.is_active ? (
                          <>
                            <Ban className="h-4 w-4 mr-1" /> Bannir
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" /> Activer
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filteredProfiles.length} utilisateur(s)</p>
    </div>
  );
};

export default AdminUsers;