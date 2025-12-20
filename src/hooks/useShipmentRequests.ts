import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export interface ShipmentRequest {
  id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  earliest_date: string;
  latest_date: string;
  weight_kg: number;
  item_type: string;
  notes: string | null;
  image_url: string | null;
  view_count: number;
  sender_id: string;
  price: number | null;
  status: string;

  public_profiles?: {
    id: string;
    display_first_name: string;
    avatar_url: string | null;
  };
  sender_request_count?: number;
  sender_kyc_verified?: boolean;
  sender_rating?: number | null;
  sender_reviews_count?: number;
}

/**
 * Custom hook to fetch shipment requests with React Query
 * Keeps the EXACT same logic as before but with caching benefits
 */
export const useShipmentRequests = (session: Session | null, authLoading: boolean) => {
  return useQuery({
    queryKey: ["shipmentRequests", session?.user?.id],
    queryFn: async () => {
      const currentUserId = session?.user?.id || null;
      const today = new Date().toISOString().split("T")[0];

      // Fetch both open and completed shipment requests, exclude expired ones
      const { data, error: fetchError } = await supabase
        .from("shipment_requests")
        .select("*")
        .in("status", ["open", "completed"])
        .neq("sender_id", currentUserId || "00000000-0000-0000-0000-000000000000")
        .gte("latest_date", today) // Exclude expired shipments
        .order("created_at", { ascending: false })
        .limit(30);

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        return [];
      }

      const senderIds = [...new Set(data.map((r) => r.sender_id))];

      // Batch all RPC calls for better performance
      const senderInfoMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      const senderKycMap: Record<string, boolean> = {};
      const senderRatingMap: Record<string, { rating: number | null; reviews_count: number }> = {};

      if (session) {
        const senderPromises = senderIds.map((senderId) =>
          Promise.all([
            supabase.rpc("get_sender_display_info", { sender_uuid: senderId }),
            supabase.rpc("get_public_kyc_status", { profile_id: senderId }),
            supabase.rpc("get_user_rating", { user_id: senderId }),
          ]).then(([senderResult, kycResult, ratingResult]) => {
            if (senderResult.data && senderResult.data.length > 0) {
              senderInfoMap[senderId] = {
                display_name: senderResult.data[0].display_name,
                avatar_url: senderResult.data[0].avatar_url,
              };
            }
            senderKycMap[senderId] = kycResult.data === true;
            senderRatingMap[senderId] = {
              rating: ratingResult.data?.[0]?.average_rating || null,
              reviews_count: ratingResult.data?.[0]?.reviews_count || 0,
            };
          }),
        );
        await Promise.all(senderPromises);
      }

      // Fetch shipment counts per sender
      const { data: counts } = await supabase
        .from("shipment_requests")
        .select("sender_id")
        .in("sender_id", senderIds);

      const countMap: Record<string, number> = (counts || []).reduce(
        (acc, item) => {
          acc[item.sender_id] = (acc[item.sender_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Enrich data with sender info
      const enrichedData = data.map((r) => ({
        ...r,
        sender_request_count: countMap[r.sender_id] || 0,
        sender_kyc_verified: senderKycMap[r.sender_id] || false,
        sender_rating: senderRatingMap[r.sender_id]?.rating || null,
        sender_reviews_count: senderRatingMap[r.sender_id]?.reviews_count || 0,
        public_profiles: senderInfoMap[r.sender_id]
          ? {
              id: r.sender_id,
              display_first_name: senderInfoMap[r.sender_id].display_name,
              avatar_url: senderInfoMap[r.sender_id].avatar_url,
            }
          : undefined,
      }));

      // Sort: open first, then completed
      const sortedData = enrichedData.sort((a, b) => {
        if (a.status === "open" && b.status === "completed") return -1;
        if (a.status === "completed" && b.status === "open") return 1;
        return 0;
      });

      return sortedData;
    },
    // Don't fetch until auth is loaded
    enabled: !authLoading,
    // Refetch when user logs in/out
    refetchOnMount: true,
  });
};
