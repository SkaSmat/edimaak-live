import { useState, useEffect, useCallback } from "react";
import { X, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager"; // 👈 AJOUT : On autorise la propriété loading
}

// 👇 AJOUT : On récupère 'loading' ici (avec "lazy" par défaut)
export const ImageLightbox = ({ src, alt, className = "", loading = "lazy" }: ImageLightboxProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <>
      {/* Thumbnail with hover effect */}
      <div
        className={`relative cursor-pointer group ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <img
          src={src}
          alt={alt}
          loading={loading} // 👈 MODIFICATION : On utilise la variable dynamique
          className="w-full h-full object-cover"
        />
        {/* Hover overlay with zoom icon */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>

      {/* Lightbox modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={handleClose}>
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/95" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image */}
          <img
            src={src}
            alt={alt}
            className="relative z-10 max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ImageLightbox;
