import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, Loader2, PartyPopper } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  reviewerId: string;
  reviewedId: string;
  reviewedName: string;
}

const ReviewModal = ({
  isOpen,
  onClose,
  matchId,
  reviewerId,
  reviewedId,
  reviewedName,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Veuillez sélectionner une note");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        match_id: matchId,
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Vous avez déjà laissé un avis pour cette transaction");
        } else {
          throw error;
        }
      } else {
        toast.success("Merci pour votre avis ! 🌟");
        onClose();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Erreur lors de l'envoi de l'avis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PartyPopper className="w-6 h-6 text-primary" />
            Transaction complétée !
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              Comment s'est passée votre expérience avec{" "}
              <span className="font-semibold text-foreground">{reviewedName}</span> ?
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-orange-400 text-orange-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {rating === 1 && "Très mauvais 😔"}
              {rating === 2 && "Pas satisfait 😕"}
              {rating === 3 && "Correct 😐"}
              {rating === 4 && "Bien 😊"}
              {rating === 5 && "Excellent ! 🤩"}
            </p>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Un commentaire ? (optionnel)"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Plus tard
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || rating === 0}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Envoyer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
