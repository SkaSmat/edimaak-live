import { Plane, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoEdiM3akProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const sizeClasses = {
  sm: {
    container: "gap-1.5",
    plane: "w-6 h-6",
    package: "w-3 h-3",
    text: "text-lg",
  },
  md: {
    container: "gap-2",
    plane: "w-8 h-8",
    package: "w-4 h-4",
    text: "text-xl",
  },
  lg: {
    container: "gap-2.5",
    plane: "w-10 h-10",
    package: "w-5 h-5",
    text: "text-2xl",
  },
};

export const LogoEdiM3ak = ({ 
  className, 
  iconSize = "md",
  onClick 
}: LogoEdiM3akProps) => {
  const sizes = sizeClasses[iconSize];

  return (
    <div 
      className={cn(
        "flex items-center cursor-pointer hover:opacity-80 transition-opacity",
        sizes.container,
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Plane className={cn(sizes.plane, "text-primary")} />
        <Package className={cn(sizes.package, "text-accent absolute -bottom-0.5 -right-0.5")} />
      </div>
      <span className={cn(sizes.text, "font-bold text-primary tracking-tight")}>
        EDIMAAK
      </span>
    </div>
  );
};