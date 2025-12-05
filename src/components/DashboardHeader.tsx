import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, MessageSquare, UserCircle, ArrowLeftRight, Loader2 } from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardHeaderProps {
  fullName: string;
  role: "traveler" | "sender";
  onLogout: () => void;
}

export const DashboardHeader = ({
  fullName,
  role,
  onLogout,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const firstName = fullName.split(" ")[0];
  const [switching, setSwitching] = useState(false);

  const handleSwitchRole = async () => {
    setSwitching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const newRole = role === "traveler" ? "sender" : "traveler";
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(`Vous êtes maintenant ${newRole === "traveler" ? "Voyageur" : "Expéditeur"}`);
      navigate(newRole === "traveler" ? "/dashboard/traveler" : "/dashboard/sender");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du changement");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo EdiM3ak */}
        <LogoEdiM3ak iconSize="md" onClick={() => navigate("/")} />

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* User greeting */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-foreground">
              Bonjour, <span className="font-medium">{firstName}</span>
            </span>
            <Badge variant="secondary" className="text-xs">
              {role === "traveler" ? "Voyageur" : "Expéditeur"}
            </Badge>
          </div>

          {/* Switch role button */}
          <Button
            variant="default"
            size="sm"
            onClick={handleSwitchRole}
            disabled={switching}
            className="gap-1.5"
          >
            {switching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {role === "traveler" ? "Expédier" : "Voyager"}
            </span>
          </Button>

          {/* Profile button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/profile")}
          >
            <UserCircle className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Mon profil</span>
          </Button>

          {/* Messages button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/messages")}
          >
            <MessageSquare className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Messages</span>
          </Button>

          {/* Logout button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Déconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
