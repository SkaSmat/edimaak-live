import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserStats {
  tripsCount: number;
  shipmentsCount: number;
  matchesCount: number;
  isLoading: boolean;
}

export const useUserStats = (userId: string | undefined) => {
  const [stats, setStats] = useState<UserStats>({
    tripsCount: 0,
    shipmentsCount: 0,
    matchesCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!userId) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch trips count
        const { count: tripsCount } = await supabase
          .from("trips")
          .select("*", { count: "exact", head: true })
          .eq("traveler_id", userId);

        // Fetch shipments count
        const { count: shipmentsCount } = await supabase
          .from("shipment_requests")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", userId);

        // Fetch matches count (where user is involved as traveler or sender)
        const { data: userTrips } = await supabase
          .from("trips")
          .select("id")
          .eq("traveler_id", userId);

        const { data: userShipments } = await supabase
          .from("shipment_requests")
          .select("id")
          .eq("sender_id", userId);

        const tripIds = userTrips?.map(t => t.id) || [];
        const shipmentIds = userShipments?.map(s => s.id) || [];

        let matchesCount = 0;

        if (tripIds.length > 0) {
          const { count: tripMatches } = await supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .in("trip_id", tripIds)
            .in("status", ["accepted", "completed"]);
          matchesCount += tripMatches || 0;
        }

        if (shipmentIds.length > 0) {
          const { count: shipmentMatches } = await supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .in("shipment_request_id", shipmentIds)
            .in("status", ["accepted", "completed"]);
          matchesCount += shipmentMatches || 0;
        }

        setStats({
          tripsCount: tripsCount || 0,
          shipmentsCount: shipmentsCount || 0,
          matchesCount,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, [userId]);

  return stats;
};

// KYC status based on private_info fields
export const getKycStatus = (privateInfo: {
  phone?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  id_expiry_date?: string | null;
}) => {
  const kycFields = [
    privateInfo.phone,
    privateInfo.id_type,
    privateInfo.id_number,
    privateInfo.id_expiry_date,
  ];
  const filledFields = kycFields.filter(f => f && String(f).trim() !== "").length;

  if (filledFields === 0) return "not_filled" as const;
  if (filledFields < kycFields.length) return "partial" as const;
  return "complete" as const;
};

// Check if user is verified (phone + ID info)
export const isUserVerified = (privateInfo: {
  phone?: string | null;
  id_type?: string | null;
  id_number?: string | null;
} | null) => {
  if (!privateInfo) return false;
  return Boolean(
    privateInfo.phone?.trim() &&
    privateInfo.id_type?.trim() &&
    privateInfo.id_number?.trim()
  );
};

export const isActiveSender = (shipmentsCount: number) => shipmentsCount > 2;
export const isActiveTraveler = (tripsCount: number) => tripsCount > 2;