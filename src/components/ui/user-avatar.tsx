import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface UserAvatarProps {
  fullName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Génère les initiales à partir d'un nom complet
 */
const getInitials = (fullName: string): string => {
  if (!fullName) return "?";
  
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Composant Avatar avec photo ou initiales en fallback
 */
export const UserAvatar = ({ fullName, avatarUrl, size = "md", className }: UserAvatarProps) => {
  const initials = getInitials(fullName);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-24 h-24 text-2xl",
  };
  
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          sizeClasses[size],
          className
        )}
      />
    );
  }
  
  if (!fullName) {
    return (
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center flex-shrink-0",
          sizeClasses[size],
          className
        )}
      >
        <User className="w-1/2 h-1/2 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center flex-shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
};
