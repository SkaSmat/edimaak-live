import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plane, Package, Handshake, UserCheck, Clock, Ban, UserPlus } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalTravelers: number;
  totalSenders: number;
  activeTrips: number;
  activeShipments: number;
  pendingKyc: number;
  bannedUsers: number;
  newUsersWeek: number;
  totalMatches: number;
  pendingMatches: number;
}

export const AdminStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Calculate date 7 days ago
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();

      // Fetch all stats in parallel
      const [
        totalUsersRes,
        travelerRes,
        senderRes,
        activeTripsRes,
        activeShipmentsRes,
        pendingKycRes,
        bannedUsersRes,
        newUsersRes,
        totalMatchesRes,
        pendingMatchesRes,
      ] = await Promise.all([
        // Total users
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        // Travelers
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "traveler"),
        // Senders
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "sender"),
        // Active trips
        supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "open"),
        // Active shipments
        supabase.from("shipment_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
        // Pending KYC
        supabase.from("private_info").select("*", { count: "exact", head: true }).eq("kyc_status", "pending"),
        // Banned users
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", false),
        // New users this week
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgoISO),
        // Total matches
        supabase.from("matches").select("*", { count: "exact", head: true }),
        // Pending matches
        supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setStats({
        totalUsers: totalUsersRes.count || 0,
        totalTravelers: travelerRes.count || 0,
        totalSenders: senderRes.count || 0,
        activeTrips: activeTripsRes.count || 0,
        activeShipments: activeShipmentsRes.count || 0,
        pendingKyc: pendingKycRes.count || 0,
        bannedUsers: bannedUsersRes.count || 0,
        newUsersWeek: newUsersRes.count || 0,
        totalMatches: totalMatchesRes.count || 0,
        pendingMatches: pendingMatchesRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border p-3 sm:p-4 animate-pulse">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-muted rounded-lg mb-2 sm:mb-3" />
            <div className="h-6 sm:h-8 w-12 sm:w-16 bg-muted rounded mb-1" />
            <div className="h-3 sm:h-4 w-16 sm:w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: UserCheck,
      value: stats.totalUsers,
      label: "Total utilisateurs",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
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
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
    {
      icon: Clock,
      value: stats.pendingKyc,
      label: "KYC en attente",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      highlight: stats.pendingKyc > 0,
    },
    {
      icon: Handshake,
      value: stats.pendingMatches,
      label: "Matches en attente",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      icon: Ban,
      value: stats.bannedUsers,
      label: "Utilisateurs bannis",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      icon: UserPlus,
      value: stats.newUsersWeek,
      label: "Nouveaux (7j)",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`bg-card rounded-xl border p-3 sm:p-4 hover:shadow-sm transition-shadow ${
            item.highlight ? "ring-2 ring-amber-500/50" : ""
          }`}
        >
          <div className={`h-8 w-8 sm:h-10 sm:w-10 ${item.bgColor} rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
            <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{item.value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.label}</p>
        </div>
      ))}
    </div>
  );
};
