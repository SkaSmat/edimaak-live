import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Plane, 
  Package, 
  Handshake, 
  UserCheck, 
  Clock, 
  Ban, 
  UserPlus,
  TrendingUp,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  MessageSquare,
  Activity
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";

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
  acceptedMatches: number;
  rejectedMatches: number;
  completedMatches: number;
  matchesToday: number;
  matchesThisWeek: number;
  conversionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'match_proposal' | 'match_accepted' | 'match_rejected' | 'new_trip' | 'new_shipment' | 'new_user';
  description: string;
  created_at: string;
  traveler_name?: string;
  sender_name?: string;
  traveler_avatar?: string;
  sender_avatar?: string;
  from_city?: string;
  to_city?: string;
}

export const AdminStatsEnhanced = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

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
        acceptedMatchesRes,
        rejectedMatchesRes,
        completedMatchesRes,
        matchesTodayRes,
        matchesWeekRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "traveler"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "sender"),
        supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("shipment_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("private_info").select("*", { count: "exact", head: true }).eq("kyc_status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgoISO),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "accepted"),
        supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("matches").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("matches").select("*", { count: "exact", head: true }).gte("created_at", weekAgoISO),
      ]);

      const totalMatches = totalMatchesRes.count || 0;
      const acceptedMatches = acceptedMatchesRes.count || 0;
      const completedMatches = completedMatchesRes.count || 0;
      
      // Taux de conversion = (acceptés + complétés) / total propositions
      const conversionRate = totalMatches > 0 
        ? Math.round(((acceptedMatches + completedMatches) / totalMatches) * 100) 
        : 0;

      setStats({
        totalUsers: totalUsersRes.count || 0,
        totalTravelers: travelerRes.count || 0,
        totalSenders: senderRes.count || 0,
        activeTrips: activeTripsRes.count || 0,
        activeShipments: activeShipmentsRes.count || 0,
        pendingKyc: pendingKycRes.count || 0,
        bannedUsers: bannedUsersRes.count || 0,
        newUsersWeek: newUsersRes.count || 0,
        totalMatches: totalMatches,
        pendingMatches: pendingMatchesRes.count || 0,
        acceptedMatches: acceptedMatches,
        rejectedMatches: rejectedMatchesRes.count || 0,
        completedMatches: completedMatches,
        matchesToday: matchesTodayRes.count || 0,
        matchesThisWeek: matchesWeekRes.count || 0,
        conversionRate: conversionRate,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent matches with details
      const { data: recentMatches } = await supabase
        .from("matches")
        .select(`
          id,
          status,
          created_at,
          trips:trip_id(
            from_city,
            to_city,
            profiles:traveler_id(full_name, avatar_url)
          ),
          shipment_requests:shipment_request_id(
            profiles:sender_id(full_name, avatar_url)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch recent trips
      const { data: recentTrips } = await supabase
        .from("trips")
        .select(`
          id,
          from_city,
          to_city,
          created_at,
          profiles:traveler_id(full_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent shipments
      const { data: recentShipments } = await supabase
        .from("shipment_requests")
        .select(`
          id,
          from_city,
          to_city,
          created_at,
          item_type
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      // Combine and sort activities
      const activities: RecentActivity[] = [];

      (recentMatches || []).forEach((match: any) => {
        let type: RecentActivity['type'] = 'match_proposal';
        let description = 'a proposé son voyage';
        
        if (match.status === 'accepted') {
          type = 'match_accepted';
          description = 'Match accepté';
        } else if (match.status === 'rejected') {
          type = 'match_rejected';
          description = 'Match refusé';
        }

        activities.push({
          id: match.id,
          type,
          description,
          created_at: match.created_at,
          traveler_name: match.trips?.profiles?.full_name,
          sender_name: match.shipment_requests?.profiles?.full_name,
          traveler_avatar: match.trips?.profiles?.avatar_url,
          sender_avatar: match.shipment_requests?.profiles?.avatar_url,
          from_city: match.trips?.from_city,
          to_city: match.trips?.to_city,
        });
      });

      (recentTrips || []).forEach((trip: any) => {
        activities.push({
          id: trip.id,
          type: 'new_trip',
          description: 'Nouveau voyage publié',
          created_at: trip.created_at,
          traveler_name: trip.profiles?.full_name,
          traveler_avatar: trip.profiles?.avatar_url,
          from_city: trip.from_city,
          to_city: trip.to_city,
        });
      });

      // Sort by date
      activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRecentActivity(activities.slice(0, 15));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border p-3 sm:p-4 animate-pulse">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-muted rounded-lg mb-2 sm:mb-3" />
              <div className="h-6 sm:h-8 w-12 sm:w-16 bg-muted rounded mb-1" />
              <div className="h-3 sm:h-4 w-16 sm:w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const mainStats = [
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
  ];

  const matchStats = [
    {
      icon: Send,
      value: stats.totalMatches,
      label: "Propositions envoyées",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      subtitle: `${stats.matchesToday} aujourd'hui`,
    },
    {
      icon: Clock,
      value: stats.pendingMatches,
      label: "En attente de réponse",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      highlight: stats.pendingMatches > 0,
    },
    {
      icon: CheckCircle,
      value: stats.acceptedMatches,
      label: "Acceptés",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: XCircle,
      value: stats.rejectedMatches,
      label: "Refusés",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      icon: TrendingUp,
      value: `${stats.conversionRate}%`,
      label: "Taux d'acceptation",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
  ];

  const otherStats = [
    {
      icon: Clock,
      value: stats.pendingKyc,
      label: "KYC en attente",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      highlight: stats.pendingKyc > 0,
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

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'match_proposal':
        return <Send className="w-4 h-4 text-indigo-500" />;
      case 'match_accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'match_rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'new_trip':
        return <Plane className="w-4 h-4 text-purple-500" />;
      case 'new_shipment':
        return <Package className="w-4 h-4 text-orange-500" />;
      case 'new_user':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityBadge = (type: RecentActivity['type']) => {
  switch (type) {
    case 'match_proposal':
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">Proposition</Badge>;
    case 'match_accepted':
      return <Badge className="bg-green-500 text-xs">Accepté</Badge>;
    case 'match_rejected':
      return <Badge variant="destructive" className="text-xs">Refusé</Badge>;
    case 'new_trip':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Voyage</Badge>;
    case 'new_shipment':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Demande</Badge>;
    default:
      return null;
  }
};

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {mainStats.map((item, index) => (
          <div
            key={index}
            className="bg-card rounded-xl border p-3 sm:p-4 hover:shadow-sm transition-shadow"
          >
            <div className={`h-8 w-8 sm:h-10 sm:w-10 ${item.bgColor} rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
              <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Match Stats Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Handshake className="w-5 h-5 text-primary" />
            Propositions de voyageurs
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Quand un voyageur propose son voyage à un expéditeur
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {matchStats.map((item, index) => (
              <div
                key={index}
                className={`bg-muted/30 rounded-xl p-3 sm:p-4 hover:bg-muted/50 transition-colors ${
                  item.highlight ? "ring-2 ring-amber-500/50" : ""
                }`}
              >
                <div className={`h-8 w-8 ${item.bgColor} rounded-lg flex items-center justify-center mb-2`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="text-lg sm:text-xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground/70 mt-1">{item.subtitle}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout: Activity + Other Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune activité récente
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activity.type.startsWith('match') ? (
                          <>
                            <span className="font-medium text-sm truncate">
                              {activity.traveler_name || "Voyageur"}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {activity.sender_name || "Expéditeur"}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium text-sm truncate">
                            {activity.traveler_name || "Utilisateur"}
                          </span>
                        )}
                        {getActivityBadge(activity.type)}
                      </div>
                      {activity.from_city && activity.to_city && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.from_city} → {activity.to_city}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Other Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Autres métriques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherStats.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-muted/30 ${
                    item.highlight ? "ring-2 ring-amber-500/50" : ""
                  }`}
                >
                  <div className={`h-10 w-10 ${item.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                  </div>
                </div>
              ))}
              
              {/* Completed matches */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Handshake className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground">{stats.completedMatches}</p>
                  <p className="text-xs text-muted-foreground truncate">Livraisons complétées</p>
                </div>
              </div>
              
              {/* Matches this week */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-10 w-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-cyan-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground">{stats.matchesThisWeek}</p>
                  <p className="text-xs text-muted-foreground truncate">Propositions cette semaine</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStatsEnhanced;