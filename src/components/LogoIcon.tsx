import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  height?: number;
  onClick?: () => void;
}

export const LogoIcon = ({ className, height = 32, onClick }: LogoIconProps) => {
  const width = height * 4.35; // Ratio basé sur viewBox 435x100
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 435 100" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("cursor-pointer hover:opacity-80 transition-opacity", className)}
      onClick={onClick}
    >
      {/* Chaque lettre positionnée individuellement pour espacement parfait */}
      <text x="10" y="70" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="60" className="fill-foreground">E</text>
      <text x="54" y="70" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="60" className="fill-foreground">D</text>
      <text x="108" y="70" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="60" className="fill-foreground">I</text>
      <text x="141" y="70" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="60" className="fill-foreground">M</text>
      
      {/* Premier A - espacement normal après M */}
      <text x="209" y="70" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="60" className="fill-foreground">A</text>
      
      {/* Deuxième A inversé - entrelacé avec le premier */}
      <g transform="translate(273, 70) scale(-1, 1)">
        <text x="0" y="0" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="60" className="fill-foreground">A</text>
      </g>
      
      {/* K - espacement normal après AA */}
      <text x="283" y="70" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="60" className="fill-foreground">K</text>
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
