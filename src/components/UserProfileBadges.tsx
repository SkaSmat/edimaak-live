import { Badge } from "@/components/ui/badge";
import { CheckCircle, ShieldCheck, Clock, AlertCircle, Plane, Package, Users, BadgeCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityBadgeProps {
  isActive: boolean;
  role: "traveler" | "sender";
  className?: string;
}

export const ActivityBadge = ({ isActive, role, className }: ActivityBadgeProps) => {
  if (!isActive) return null;

  const label = role === "traveler" ? "Voyageur actif" : "Expéditeur actif";
  const Icon = role === "traveler" ? Plane : Package;

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "bg-primary/10 text-primary border-0 gap-1",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

// NEW: Verified Badge Component (phone + ID)
interface VerifiedBadgeProps {
  isVerified: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const VerifiedBadge = ({ isVerified, showLabel = false, size = "md", className }: VerifiedBadgeProps) => {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  if (isVerified) {
    return (
      <Badge 
        variant="default" 
        className={cn(
          "bg-green-500 hover:bg-green-600 text-white border-0 gap-1",
          size === "sm" && "text-xs px-1.5 py-0",
          className
        )}
      >
        <BadgeCheck className={iconSize} />
        {showLabel && "Vérifié ✅"}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-muted-foreground gap-1 border-muted-foreground/30",
        size === "sm" && "text-xs px-1.5 py-0",
        className
      )}
    >
      <XCircle className={iconSize} />
      {showLabel && "Non vérifié"}
    </Badge>
  );
};

// Verified Icon for inline display
interface VerifiedIconProps {
  isVerified: boolean;
  className?: string;
}

export const VerifiedIcon = ({ isVerified, className }: VerifiedIconProps) => {
  if (isVerified) {
    return (
      <BadgeCheck className={cn("w-4 h-4 text-green-500", className)} />
    );
  }
  return null;
};

interface KycBadgeProps {
  status: "complete" | "partial" | "not_filled";
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const KycBadge = ({ status, showLabel = true, size = "md", className }: KycBadgeProps) => {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  if (status === "complete") {
    return (
      <Badge 
        variant="default" 
        className={cn(
          "bg-green-500/90 hover:bg-green-500 text-white border-0 gap-1",
          size === "sm" && "text-xs px-1.5 py-0",
          className
        )}
      >
        <ShieldCheck className={iconSize} />
        {showLabel && "KYC vérifié"}
      </Badge>
    );
  }

  if (status === "partial") {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          "bg-yellow-500/20 text-yellow-700 border-0 gap-1",
          size === "sm" && "text-xs px-1.5 py-0",
          className
        )}
      >
        <Clock className={iconSize} />
        {showLabel && "KYC partiel"}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-muted-foreground gap-1",
        size === "sm" && "text-xs px-1.5 py-0",
        className
      )}
    >
      <AlertCircle className={iconSize} />
      {showLabel && "KYC non rempli"}
    </Badge>
  );
};

interface KycIconProps {
  status: "complete" | "partial" | "not_filled";
  className?: string;
}

export const KycIcon = ({ status, className }: KycIconProps) => {
  if (status === "complete") {
    return (
      <ShieldCheck className={cn("w-4 h-4 text-green-500", className)} />
    );
  }
  return null;
};

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  className?: string;
}

export const StatCard = ({ icon, value, label, className }: StatCardProps) => {
  return (
    <div className={cn("bg-muted/30 rounded-lg p-4 text-center", className)}>
      <div className="flex justify-center mb-2 text-primary">
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

interface ProfileStatsProps {
  tripsCount: number;
  shipmentsCount: number;
  matchesCount: number;
  className?: string;
}

export const ProfileStats = ({ tripsCount, shipmentsCount, matchesCount, className }: ProfileStatsProps) => {
  return (
    <div className={cn("grid grid-cols-3 gap-4", className)}>
      <StatCard
        icon={<Plane className="w-5 h-5" />}
        value={tripsCount}
        label="Voyages"
      />
      <StatCard
        icon={<Package className="w-5 h-5" />}
        value={shipmentsCount}
        label="Expéditions"
      />
      <StatCard
        icon={<Users className="w-5 h-5" />}
        value={matchesCount}
        label="Matches"
      />
    </div>
  );
};