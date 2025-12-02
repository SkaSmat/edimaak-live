import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, MessageSquare, UserCircle } from "lucide-react";
import { LogoEdiM3ak } from "@/components/LogoEdiM3ak";

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

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo EdiM3ak */}
        <LogoEdiM3ak iconSize="md" onClick={() => navigate("/")} />

        {/* Right side */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* User greeting */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-foreground">
              Bonjour, <span className="font-medium">{firstName}</span>
            </span>
            <Badge variant="secondary" className="text-xs">
              {role === "traveler" ? "Voyageur" : "Expéditeur"}
            </Badge>
          </div>

          {/* Profile button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/profile")}
            className="hidden md:flex"
          >
            <UserCircle className="w-4 h-4 mr-2" />
            Mon profil
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
