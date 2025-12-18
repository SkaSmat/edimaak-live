import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MapPin, AlertTriangle } from "lucide-react";
import { FlexibleMatchInfo, MatchType } from "@/lib/regionMapping";

interface FlexibleMatchBadgeProps {
  matchInfo: FlexibleMatchInfo;
  tripDate?: string;
  shipmentDateRange?: string;
  className?: string;
}

const FlexibleMatchBadge = ({
  matchInfo,
  tripDate,
  shipmentDateRange,
  className = "",
}: FlexibleMatchBadgeProps) => {
  const getBadgeContent = () => {
    switch (matchInfo.matchType) {
      case "exact":
        return (
          <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 ${className}`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Dates compatibles
          </Badge>
        );
      
      case "flexible_date":
        return (
          <Badge variant="outline" className={`bg-amber-50 text-amber-700 border-amber-200 ${className}`}>
            <Clock className="w-3 h-3 mr-1" />
            Dates proches ({matchInfo.dateDifference}j)
          </Badge>
        );
      
      case "flexible_location":
        return (
          <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 ${className}`}>
            <MapPin className="w-3 h-3 mr-1" />
            Destination proche
          </Badge>
        );
      
      case "flexible_both":
        return (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={`bg-amber-50 text-amber-700 border-amber-200 ${className}`}>
              <Clock className="w-3 h-3 mr-1" />
              Dates proches ({matchInfo.dateDifference}j)
            </Badge>
            <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 ${className}`}>
              <MapPin className="w-3 h-3 mr-1" />
              Destination proche
            </Badge>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-1">
      {getBadgeContent()}
      
      {/* Show date comparison for flexible dates */}
      {!matchInfo.isExactDate && tripDate && shipmentDateRange && (
        <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
          Votre voyage : {tripDate} • Demande : {shipmentDateRange}
        </div>
      )}
      
      {/* Show region info for flexible locations */}
      {!matchInfo.isExactLocation && matchInfo.regionName && (
        <div className="text-xs text-muted-foreground bg-blue-50/50 px-2 py-1 rounded">
          📍 Même région : {matchInfo.regionName}
        </div>
      )}
    </div>
  );
};

export default FlexibleMatchBadge;
