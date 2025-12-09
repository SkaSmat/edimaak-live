import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  height?: number;
  onClick?: () => void;
}

export const LogoIcon = ({ className, height = 32, onClick }: LogoIconProps) => {
  const width = height * 4; // Ratio 4:1 pour le logo texte
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 400 100" 
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
      
      {/* Premier A normal */}
      <text 
        x="180" 
        y="70" 
        fontFamily="Poppins, sans-serif" 
        fontWeight="800" 
        fontSize="60" 
        className="fill-foreground"
      >
        A
      </text>
      
      {/* Deuxième A avec miroir horizontal (effet entrelacé) */}
      <g transform="translate(250, 70) scale(-1, 1)">
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
        x="255" 
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
