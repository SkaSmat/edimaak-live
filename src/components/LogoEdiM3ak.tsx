import { cn } from "@/lib/utils";
import { LogoIcon } from "./LogoIcon";

interface LogoEdiM3akProps {
  className?: string;
  iconSize?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
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
      <LogoIcon height={sizeMap[iconSize]} onClick={onClick} />
    </div>
  );
};