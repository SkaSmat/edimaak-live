import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plane, Package, Handshake, Loader2 } from "lucide-react";

interface Stats {
  totalTravelers: number;
  totalSenders: number;
  activeTrips: number;
  activeShipments: number;
  totalMatches: number;
}

export const AdminStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch traveler count
      const { count: travelerCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "traveler");

      // Fetch sender count
      const { count: senderCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "sender");

      // Fetch active trips count
      const { count: activeTripsCount } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      // Fetch active shipments count
      const { count: activeShipmentsCount } = await supabase
        .from("shipment_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      // Fetch total matches count
      const { count: matchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true });

      setStats({
        totalTravelers: travelerCount || 0,
        totalSenders: senderCount || 0,
        activeTrips: activeTripsCount || 0,
        activeShipments: activeShipmentsCount || 0,
        totalMatches: matchesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border p-4 animate-pulse">
            <div className="h-10 w-10 bg-muted rounded-lg mb-3" />
            <div className="h-8 w-16 bg-muted rounded mb-1" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: Users,
      value: stats.totalTravelers,
      label: "Voyageurs",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Users,
      value: stats.totalSenders,
      label: "Expéditeurs",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Plane,
      value: stats.activeTrips,
      label: "Voyages actifs",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Package,
      value: stats.activeShipments,
      label: "Demandes actives",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Handshake,
      value: stats.totalMatches,
      label: "Total matches",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="bg-card rounded-xl border p-4 hover:shadow-sm transition-shadow"
        >
          <div className={`h-10 w-10 ${item.bgColor} rounded-lg flex items-center justify-center mb-3`}>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </div>
          <p className="text-2xl font-bold text-foreground">{item.value}</p>
          <p className="text-sm text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
};
