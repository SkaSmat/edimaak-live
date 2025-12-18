import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DirectMessageButtonProps {
  currentUserId: string;
  targetUserId: string;
  shipmentRequestId?: string;
  tripId?: string;
  targetUserName: string;
  shipmentRoute: string;
  tripDate?: string;
  tripCity?: string;
  className?: string;
}

const DirectMessageButton = ({
  currentUserId,
  targetUserId,
  shipmentRequestId,
  tripId,
  targetUserName,
  shipmentRoute,
  tripDate,
  tripCity,
  className = "",
}: DirectMessageButtonProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  // Generate suggested message
  const suggestedMessage = tripDate && tripCity
    ? `Bonjour, je vois votre demande ${shipmentRoute}. Mon voyage est prévu le ${tripDate} vers ${tripCity}. Seriez-vous flexible sur les dates/destination ?`
    : `Bonjour, je suis intéressé(e) par votre demande ${shipmentRoute}. Pouvons-nous discuter des détails ?`;

  const handleOpenDialog = () => {
    setMessage(suggestedMessage);
    setIsOpen(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Veuillez écrire un message");
      return;
    }

    setIsSending(true);

    try {
      // Order participant IDs for constraint compliance
      const [participant_1_id, participant_2_id] = [currentUserId, targetUserId].sort();

      // Check if conversation already exists
      let conversationId: string;
      
      const { data: existingConv } = await supabase
        .from("direct_conversations")
        .select("id")
        .eq("participant_1_id", participant_1_id)
        .eq("participant_2_id", participant_2_id)
        .eq("shipment_request_id", shipmentRequestId || null)
        .eq("trip_id", tripId || null)
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from("direct_conversations")
          .insert({
            participant_1_id,
            participant_2_id,
            shipment_request_id: shipmentRequestId || null,
            trip_id: tripId || null,
          })
          .select("id")
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      // Send the message
      const { error: msgError } = await supabase
        .from("direct_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: message.trim(),
        });

      if (msgError) throw msgError;

      toast.success("Message envoyé !");
      setIsOpen(false);
      setMessage("");
      
      // Navigate to direct messages page
      navigate(`/messages/direct/${conversationId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDialog}
        className={`gap-2 ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Contacter</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contacter {targetUserName}</DialogTitle>
            <DialogDescription>
              Envoyez un message pour discuter des détails avant de proposer votre voyage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Trajet concerné :</strong> {shipmentRoute}
              {tripDate && (
                <div className="mt-1">
                  <strong>Votre voyage :</strong> {tripDate} vers {tripCity}
                </div>
              )}
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              rows={4}
              className="resize-none"
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
              >
                {isSending ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DirectMessageButton;
