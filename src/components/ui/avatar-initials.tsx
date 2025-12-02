import { cn } from "@/lib/utils";

interface AvatarInitialsProps {
  fullName: string;
  size?: "sm" | "md" | "lg";
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
 * Composant Avatar avec initiales
 */
export const AvatarInitials = ({ fullName, size = "md", className }: AvatarInitialsProps) => {
  const initials = getInitials(fullName);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  
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
