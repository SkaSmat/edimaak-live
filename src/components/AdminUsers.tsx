import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShieldCheck, AlertCircle, Clock, Loader2, Search, Ban, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getKycStatus } from "@/hooks/useUserStats";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  is_active: boolean;
  private_info?: {
    phone: string;
    id_type: string;
    id_number: string;
    kyc_status: string;
  };
}

interface PrivateInfo {
  id: string;
  phone: string | null;
  id_type: string | null;
  id_number: string | null;
  id_expiry_date: string | null;
  id_document_url: string | null;
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
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          private_info (
            phone,
            id_type,
            id_number,
            kyc_status
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch private_info for KYC status (admin has access via RLS)
      const { data: privateData, error: privateError } = await supabase
        .from("private_info")
        .select("id, phone, id_type, id_number, id_expiry_date, id_document_url");

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
        private_info: p.private_info?.[0] || p.private_info,
      }));

      setProfiles(sanitizedProfiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleKycAction = async (userId: string, status: "verified" | "rejected") => {
    try {
      const { error } = await supabase.from("private_info").update({ kyc_status: status }).eq("id", userId);

      if (error) throw error;
      toast.success(status === "verified" ? "Utilisateur vérifié ✅" : "Dossier rejeté ❌");
      fetchProfiles(); // On recharge la liste
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
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
      id_document_url: privateInfo?.id_document_url,
    });
    const getKycStatusBadge = (kycStatus: string | null | undefined) => {
      switch (kycStatus) {
        case "verified":
          return (
            <Badge className="bg-green-500/90 border-0 gap-1">
              <ShieldCheck className="w-3 h-3" /> Vérifié
            </Badge>
          );
        case "pending":
          return (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 border-0 gap-1">
              <Clock className="w-3 h-3" /> En attente
            </Badge>
          );
        case "rejected":
          return (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="w-3 h-3" /> Rejeté
            </Badge>
          );
        default:
          return (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <AlertCircle className="w-3 h-3" /> Non soumis
            </Badge>
          );
      }
    };

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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Aucun résultat</div>
        ) : (
          filteredProfiles.map((profile) => {
            const privateInfo = privateInfoMap.get(profile.id);
            return (
              <div
                key={profile.id}
                className={`bg-card rounded-lg border p-4 space-y-3 ${!profile.is_active ? "bg-red-50/50 border-red-200" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">{profile.private_info?.phone || "-"}</p>
                  </div>
                  {getRoleBadge(profile.role)}
                </div>

                {profile.private_info?.id_number && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold uppercase">{profile.private_info.id_type}</span>
                    <span className="font-mono ml-2">{profile.private_info.id_number}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>{getKycStatusBadge(profile.private_info?.kyc_status)}</div>

                  {profile.private_info?.kyc_status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                        onClick={() => handleKycAction(profile.id, "verified")}
                        title="Valider"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => handleKycAction(profile.id, "rejected")}
                        title="Rejeter"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Aucune action</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Statut KYC</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Aucun résultat
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles.map((profile) => {
                const privateInfo = privateInfoMap.get(profile.id);
                return (
                  <TableRow key={profile.id} className={!profile.is_active ? "bg-red-50/50" : ""}>
                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                    <TableCell>{getRoleBadge(profile.role)}</TableCell>
                    <TableCell>{profile.private_info?.phone || "-"}</TableCell>
                    <TableCell>
                      {profile.private_info?.id_number ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-bold uppercase text-muted-foreground">
                            {profile.private_info.id_type}
                          </span>
                          <span className="font-mono">{profile.private_info.id_number}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{getKycStatusBadge(profile.private_info?.kyc_status)}</TableCell>
                    <TableCell className="text-right">
                      {profile.private_info?.kyc_status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                            onClick={() => handleKycAction(profile.id, "verified")}
                            title="Valider le dossier"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={() => handleKycAction(profile.id, "rejected")}
                            title="Rejeter le dossier"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucune action</span>
                      )}
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
