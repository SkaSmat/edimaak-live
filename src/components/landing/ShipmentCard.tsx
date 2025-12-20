import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, Eye, Star, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { getShipmentImageUrl } from "@/lib/shipmentImageHelper";
import { ImageLightbox } from "@/components/ImageLightbox";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ShipmentRequest } from "@/hooks/useShipmentRequests";

interface ShipmentCardProps {
  request: ShipmentRequest;
  isAuthenticated: boolean;
  onShipmentClick: (shipment: ShipmentRequest) => void;
}

/**
 * Optimized ShipmentCard component with React.memo
 * Prevents unnecessary re-renders when parent updates
 */
export const ShipmentCard = memo(({ request, isAuthenticated, onShipmentClick }: ShipmentCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      key={request.id}
      role={request.status === "completed" ? undefined : "button"}
      className={`group bg-white rounded-xl overflow-hidden border border-gray-100 transition-all duration-300 flex flex-col relative ${
        request.status === "completed"
          ? "opacity-70 cursor-default"
          : "hover:border-gray-200 hover:shadow-xl cursor-pointer"
      }`}
      onClick={() => request.status !== "completed" && onShipmentClick(request)}
    >
      {/* Header : Badge Type + Prix */}
      <div className="p-3 sm:p-4 pb-2 flex items-center justify-between border-b border-gray-50">
        <Badge
          variant="secondary"
          className="bg-[hsl(var(--badge-primary-bg))] text-[hsl(var(--badge-primary-text))] border-0 text-xs flex items-center gap-1 font-semibold"
        >
          <Package className="w-3 h-3" />
          {request.item_type}
        </Badge>
        {request.price ? (
          <div className="bg-[hsl(var(--badge-emerald-bg))] text-white text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
            💶 {request.price}€
          </div>
        ) : (
          <div className="bg-[hsl(var(--badge-orange-bg))] text-white text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md">
            Prix à discuter
          </div>
        )}
      </div>

      {/* Image with overlay */}
      <div className="relative h-32 sm:h-40 bg-gray-100">
        <div className={`h-full ${request.status === "completed" ? "pointer-events-none" : ""}`}>
          <ImageLightbox
            src={getShipmentImageUrl(request.image_url, request.item_type)}
            alt={request.item_type}
            className="w-full h-full"
            loading="lazy"
          />
        </div>
        {/* View count overlay badge */}
        {request.view_count > 5 && (
          <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[13px] font-medium px-3 py-1.5 rounded-[20px] flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {request.view_count} vues
          </div>
        )}
      </div>

      {/* Trajet Principal */}
      <div className="px-3 sm:px-4 pt-3 pb-2">
        <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight">
          {request.from_city} → {request.to_city}
        </h3>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mt-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {format(new Date(request.earliest_date), "dd MMM")} - {format(new Date(request.latest_date), "dd MMM")}
          </span>
        </div>
      </div>

      {/* Expéditeur + Poids */}
      <div className="px-3 sm:px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <UserAvatar
            fullName={isAuthenticated ? request.public_profiles?.display_first_name || "" : ""}
            avatarUrl={isAuthenticated ? request.public_profiles?.avatar_url : null}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            {isAuthenticated ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/user/${request.sender_id}`);
                  }}
                  className="text-xs sm:text-sm font-medium text-gray-900 truncate hover:underline hover:text-primary transition-colors text-left flex items-center gap-1"
                >
                  {request.public_profiles?.display_first_name || "Utilisateur"}
                  {request.sender_rating && request.sender_rating > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-500 font-medium ml-1">
                      <Star className="w-3 h-3 fill-current" />
                      {request.sender_rating.toFixed(1)}
                    </span>
                  )}
                </button>
                {request.sender_kyc_verified && (
                  <p className="text-[10px] sm:text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Identité vérifiée
                  </p>
                )}
              </>
            ) : (
              <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Utilisateur anonyme</span>
            )}
          </div>
        </div>
        <div className="bg-gray-200 text-gray-800 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 flex-shrink-0 ml-2">
          📦 {request.weight_kg} kg
        </div>
      </div>

      {/* Tags si description */}
      {request.notes && (
        <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1">
          <span className="bg-amber-50 text-amber-700 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full">
            📝 Description disponible
          </span>
        </div>
      )}

      {/* Bouton CTA */}
      <div className="p-3 sm:p-4 pt-2 mt-auto">
        {request.status === "completed" ? (
          <div className="w-full bg-green-100 text-green-800 border border-green-300 font-medium text-xs sm:text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-default">
            <CheckCircle className="w-3.5 h-3.5" />
            Colis livré
          </div>
        ) : (
          <div className="w-full bg-primary/15 hover:bg-primary/20 text-[hsl(var(--primary-dark))] font-semibold text-xs sm:text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors group-hover:bg-primary group-hover:text-white">
            Proposer mon voyage
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
});

ShipmentCard.displayName = "ShipmentCard";
