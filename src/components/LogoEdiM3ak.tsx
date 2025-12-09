import { cn } from "@/lib/utils";

interface LogoEdiM3akProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export const LogoEdiM3ak = ({ 
  className, 
  iconSize = "md",
  onClick 
}: LogoEdiM3akProps) => {
  return (
    <div 
      className={cn(
        "flex items-center cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      <span className={cn(sizeClasses[iconSize], "font-bold text-foreground tracking-tight")}>
        EDIMAAK
      </span>
    </div>
  );
};