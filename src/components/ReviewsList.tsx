import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
}

interface ReviewsListProps {
  userId: string;
  limit?: number;
}

const ReviewsList = ({ userId, limit = 3 }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    try {
      // Get reviews with reviewer info
      const { data, error, count } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id", { count: "exact" })
        .eq("reviewed_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTotalCount(count || 0);

      // Fetch reviewer names
      if (data && data.length > 0) {
        const reviewerIds = [...new Set(data.map((r) => r.reviewer_id))];
        const reviewsWithNames: Review[] = [];

        for (const review of data) {
          const { data: profileData } = await supabase.rpc("get_public_profile", {
            profile_id: review.reviewer_id,
          });

          const profile = Array.isArray(profileData) ? profileData[0] : profileData;

          reviewsWithNames.push({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            reviewer_name: profile?.display_first_name || "Utilisateur",
          });
        }

        setReviews(reviewsWithNames);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, limit);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4 text-sm">
        Aucun avis pour le moment
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {displayedReviews.map((review) => (
        <div key={review.id} className="border-b pb-4 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= review.rating
                      ? "fill-orange-400 text-orange-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-foreground mb-2">{review.comment}</p>
          )}
          <p className="text-xs text-muted-foreground">— {review.reviewer_name}</p>
        </div>
      ))}

      {totalCount > limit && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-primary"
        >
          Voir tous les avis ({totalCount})
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
};

export default ReviewsList;
