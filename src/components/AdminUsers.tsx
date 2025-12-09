import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShieldCheck, AlertCircle, Clock, Loader2, Search, Ban, CheckCircle, XCircle, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { getKycStatus } from "@/hooks/useUserStats";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminExportButton } from "@/components/admin/AdminExportButton";
import { KycDocumentViewer } from "@/components/admin/KycDocumentViewer";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  is_active: boolean;
  email?: string;
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
  kyc_status: string | null;
}

const ITEMS_PER_PAGE = 15;

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [privateInfoMap, setPrivateInfoMap] = useState<Map<string, PrivateInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select(`*, private_info (phone, id_type, id_number, kyc_status)`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: privateData, error: privateError } = await supabase
        .from("private_info")
        .select("id, phone, id_type, id_number, id_expiry_date, id_document_url, kyc_status");

      if (privateError) {
        console.error("Error fetching private info:", privateError);
      }

      // Récupérer les emails des utilisateurs via la fonction RPC admin
      const { data: emailsData, error: emailsError } = await supabase
        .rpc("get_user_emails");

      if (emailsError) {
        console.error("Error fetching emails:", emailsError);
      }

      const emailMap = new Map<string, string>();
      if (emailsData) {
        emailsData.forEach((e: { user_id: string; email: string }) => {
          emailMap.set(e.user_id, e.email);
        });
      }

      const infoMap = new Map<string, PrivateInfo>();
      if (privateData) {
        (privateData as unknown as PrivateInfo[]).forEach((info) => {
          infoMap.set(info.id, info);
        });
      }
      setPrivateInfoMap(infoMap);

      const sanitizedProfiles = (profilesData || []).map((p) => ({
        ...p,
        is_active: p.is_active === null ? true : p.is_active,
        private_info: p.private_info?.[0] || p.private_info,
        email: emailMap.get(p.id) || undefined,
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
      fetchProfiles();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase.from("profiles").update({ is_active: newStatus }).eq("id", userId);

      if (error) throw error;
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
        profile.email?.toLowerCase().includes(query) ||
        privateInfo?.phone?.toLowerCase().includes(query)
      );
    });
  }, [profiles, privateInfoMap, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  // Export columns
  const exportColumns = [
    { key: "full_name", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "role", label: "Rôle" },
    { 
      key: "private_info.phone", 
      label: "Téléphone",
      transform: (_: any, row: Profile) => privateInfoMap.get(row.id)?.phone || ""
    },
    { 
      key: "private_info.kyc_status", 
      label: "Statut KYC",
      transform: (_: any, row: Profile) => privateInfoMap.get(row.id)?.kyc_status || "non_soumis"
    },
    { 
      key: "is_active", 
      label: "Actif",
      transform: (val: boolean) => val ? "Oui" : "Non"
    },
    { 
      key: "created_at", 
      label: "Date inscription",
      transform: (val: string) => format(new Date(val), "dd/MM/yyyy", { locale: fr })
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, rôle ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <AdminExportButton data={filteredProfiles} filename="utilisateurs" columns={exportColumns} />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedProfiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Aucun résultat</div>
        ) : (
          paginatedProfiles.map((profile) => {
            const privateInfo = privateInfoMap.get(profile.id);
            return (
              <div
                key={profile.id}
                className={`bg-card rounded-lg border p-4 space-y-3 ${!profile.is_active ? "bg-red-50/50 border-red-200" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email || "-"}</p>
                    <p className="text-sm text-muted-foreground">{privateInfo?.phone || "-"}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {getRoleBadge(profile.role)}
                    {!profile.is_active && (
                      <Badge variant="destructive" className="text-xs">Banni</Badge>
                    )}
                  </div>
                </div>

                {privateInfo?.id_number && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="font-bold uppercase">{privateInfo.id_type}</span>
                    <span className="font-mono">{privateInfo.id_number}</span>
                    <KycDocumentViewer 
                      documentUrl={privateInfo.id_document_url} 
                      userName={profile.full_name} 
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>{getKycStatusBadge(privateInfo?.kyc_status)}</div>
                  <div className="flex gap-2">
                    {privateInfo?.kyc_status === "pending" && (
                      <>
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
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 w-8 p-0 ${profile.is_active ? "text-red-600" : "text-green-600"}`}
                      onClick={() => handleToggleStatus(profile.id, profile.is_active)}
                      title={profile.is_active ? "Bannir" : "Réactiver"}
                    >
                      {profile.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                  </div>
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
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Document KYC</TableHead>
              <TableHead>Statut KYC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Aucun résultat
                </TableCell>
              </TableRow>
            ) : (
              paginatedProfiles.map((profile) => {
                const privateInfo = privateInfoMap.get(profile.id);
                return (
                  <TableRow key={profile.id} className={!profile.is_active ? "bg-red-50/50" : ""}>
                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{profile.email || "-"}</TableCell>
                    <TableCell>{getRoleBadge(profile.role)}</TableCell>
                    <TableCell>{privateInfo?.phone || "-"}</TableCell>
                    <TableCell>
                      {privateInfo?.id_number ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col text-xs">
                            <span className="font-bold uppercase text-muted-foreground">
                              {privateInfo.id_type}
                            </span>
                            <span className="font-mono">{privateInfo.id_number}</span>
                          </div>
                          <KycDocumentViewer 
                            documentUrl={privateInfo.id_document_url} 
                            userName={profile.full_name} 
                          />
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{getKycStatusBadge(privateInfo?.kyc_status)}</TableCell>
                    <TableCell>
                      {profile.is_active ? (
                        <Badge variant="outline" className="text-green-600 border-green-200">Actif</Badge>
                      ) : (
                        <Badge variant="destructive">Banni</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {privateInfo?.kyc_status === "pending" && (
                          <>
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
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-8 w-8 p-0 ${profile.is_active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                          onClick={() => handleToggleStatus(profile.id, profile.is_active)}
                          title={profile.is_active ? "Bannir l'utilisateur" : "Réactiver l'utilisateur"}
                        >
                          {profile.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredProfiles.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default AdminUsers;
