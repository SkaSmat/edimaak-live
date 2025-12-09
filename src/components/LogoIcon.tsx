import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  size?: number;
  onClick?: () => void;
}

export const LogoIcon = ({ className, size = 64, onClick }: LogoIconProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("cursor-pointer hover:opacity-80 transition-opacity", className)}
      onClick={onClick}
    >
      {/* Fond crème arrondi */}
      <rect width="64" height="64" rx="12" fill="#FAF7F2"/>
      
      {/* Lettre "E" centrée en orange */}
      <text 
        x="32" 
        y="48" 
        fontFamily="Poppins, sans-serif" 
        fontWeight="700" 
        fontSize="48" 
        fill="#FF6B35"
        textAnchor="middle"
      >
        E
      </text>
    </svg>
  );
};
