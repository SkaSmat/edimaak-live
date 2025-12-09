import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  height?: number;
  onClick?: () => void;
}

export const LogoIcon = ({ className, height = 32, onClick }: LogoIconProps) => {
  const width = height * 3.2; // Ratio ajusté pour le logo plus compact
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 320 100" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("cursor-pointer hover:opacity-80 transition-opacity", className)}
      onClick={onClick}
    >
      {/* "EDIM" */}
      <text 
        x="10" 
        y="70" 
        fontFamily="Poppins, sans-serif" 
        fontWeight="800" 
        fontSize="60" 
        className="fill-foreground"
      >
        EDIM
      </text>
      
      {/* Premier A normal - rapproché */}
      <text 
        x="165" 
        y="70" 
        fontFamily="Poppins, sans-serif" 
        fontWeight="800" 
        fontSize="60" 
        className="fill-foreground"
      >
        A
      </text>
      
      {/* Deuxième A avec miroir horizontal (effet entrelacé) - rapproché */}
      <g transform="translate(230, 70) scale(-1, 1)">
        <text 
          x="0" 
          y="0" 
          fontFamily="Poppins, sans-serif" 
          fontWeight="800" 
          fontSize="60" 
          className="fill-foreground"
        >
          A
        </text>
      </g>
      
      {/* "K" RAPPROCHÉ */}
      <text 
        x="235" 
        y="70" 
        fontFamily="Poppins, sans-serif" 
        fontWeight="800" 
        fontSize="60" 
        className="fill-foreground"
      >
        K
      </text>
    </svg>
  );
};

// Logo simplifié "E" pour la page d'authentification
interface AuthLogoProps {
  className?: string;
  size?: number;
  onClick?: () => void;
}

export const AuthLogo = ({ className, size = 64, onClick }: AuthLogoProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("cursor-pointer hover:opacity-80 transition-opacity", className)}
      onClick={onClick}
    >
      {/* Fond orange arrondi */}
      <rect width="64" height="64" rx="12" fill="#FF6B35"/>
      
      {/* Lettre "E" centrée en blanc */}
      <text 
        x="32" 
        y="48" 
        fontFamily="Poppins, sans-serif" 
        fontWeight="700" 
        fontSize="48" 
        fill="#FFFFFF"
        textAnchor="middle"
      >
        E
      </text>
    </svg>
  );
};
