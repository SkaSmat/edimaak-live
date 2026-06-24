import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Lock, Circle, Loader2 } from "lucide-react";

interface TransactionTrackingProps {
  matchId: string;
  tripId: string;
  shipmentRequestId: string;
  userId: string;
  isSender: boolean;
  senderHandedOver: boolean;
  travelerPickedUp: boolean;
  travelerDelivered: boolean;
  senderReceived: boolean;
  senderName: string;
  travelerName: string;
  onUpdate: () => void;
}

interface StepProps {
  number: number;
  title: string;
  isComplete: boolean;
  isLocked: boolean;
  confirmedBy?: string;
  actionButton?: React.ReactNode;
}

const Step = ({ number, title, isComplete, isLocked, confirmedBy, actionButton }: StepProps) => {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors ${
      isComplete ? "bg-green-50 dark:bg-green-900/20" : 
      isLocked ? "bg-muted/50 opacity-60" : "bg-muted/30"
    }`}>
      <div className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
        isComplete ? "bg-green-500 text-white" : 
        isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
      }`}>
        {isComplete ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : 
         isLocked ? <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : 
         <Circle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs sm:text-sm font-medium ${
            isComplete ? "text-green-700 dark:text-green-400" : 
            isLocked ? "text-muted-foreground" : "text-foreground"
          }`}>
            {title}
          </span>
          {confirmedBy && (
            <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">
              ✓ {confirmedBy}
            </span>
          )}
        </div>
      </div>
      {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
    </div>
  );
};

const TransactionTracking = ({
  matchId,
  tripId,
  shipmentRequestId,
  userId,
  isSender,
  senderHandedOver,
  travelerPickedUp,
  travelerDelivered,
  senderReceived,
  senderName,
  travelerName,
  onUpdate,
}: TransactionTrackingProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdate = async (field: string) => {
    setLoading(field);
    try {
      const updateData: Record<string, any> = { [field]: true };
      
      // Si les deux confirmations de livraison sont faites, marquer comme completed
      const isCompleting = 
        (field === "traveler_delivered" && senderReceived) ||
        (field === "sender_received" && travelerDelivered);
      
      if (isCompleting) {
        updateData.status = "completed";
        updateData.completed_at = new Date().toISOString();
      }

      // Update match
      const { error } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", matchId);

      if (error) throw error;

      // Si transaction complétée, mettre à jour aussi le shipment_request et le trip
      if (isCompleting) {
        // Update shipment_request status to 'completed'
        await supabase
          .from("shipment_requests")
          .update({ status: "completed" })
          .eq("id", shipmentRequestId);

        // Update trip status to 'completed'
        await supabase
          .from("trips")
          .update({ status: "completed" })
          .eq("id", tripId);
      }

      const messages: Record<string, string> = {
        sender_handed_over: "Remise du colis confirmée !",
        traveler_picked_up: "Récupération confirmée !",
        traveler_delivered: "Livraison confirmée !",
        sender_received: "Réception confirmée ! 🎉",
      };

      toast.success(messages[field]);
      onUpdate();
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(null);
    }
  };

  // Step 3 is complete when both confirmations are done
  const step3Complete = travelerDelivered && senderReceived;

  return (
    <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-card rounded-lg border shadow-sm">
      <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        📦 Suivi de transaction
      </h4>
      <div className="space-y-2">
        {/* Étape 1: Remise */}
        <Step
          number={1}
          title="Remise du colis"
          isComplete={senderHandedOver}
          isLocked={false}
          confirmedBy={senderHandedOver ? senderName : undefined}
          actionButton={
            isSender && !senderHandedOver ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdate("sender_handed_over")}
                disabled={loading === "sender_handed_over"}
                className="h-7 text-xs px-2 sm:px-3"
              >
                {loading === "sender_handed_over" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "J'ai remis le colis"
                )}
              </Button>
            ) : undefined
          }
        />

        {/* Étape 2: Récupération */}
        <Step
          number={2}
          title="Récupération"
          isComplete={travelerPickedUp}
          isLocked={!senderHandedOver}
          confirmedBy={travelerPickedUp ? travelerName : undefined}
          actionButton={
            !isSender && senderHandedOver && !travelerPickedUp ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdate("traveler_picked_up")}
                disabled={loading === "traveler_picked_up"}
                className="h-7 text-xs px-2 sm:px-3"
              >
                {loading === "traveler_picked_up" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "J'ai récupéré le colis"
                )}
              </Button>
            ) : undefined
          }
        />

        {/* Étape 3: Livraison (2 confirmations) */}
        <div className={`p-2 sm:p-3 rounded-lg transition-colors ${
          step3Complete ? "bg-green-50 dark:bg-green-900/20" : 
          !travelerPickedUp ? "bg-muted/50 opacity-60" : "bg-muted/30"
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
              step3Complete ? "bg-green-500 text-white" : 
              !travelerPickedUp ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
            }`}>
              {step3Complete ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : 
               !travelerPickedUp ? <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : "3"}
            </div>
            <span className={`text-xs sm:text-sm font-medium ${
              step3Complete ? "text-green-700 dark:text-green-400" : 
              !travelerPickedUp ? "text-muted-foreground" : "text-foreground"
            }`}>
              Livraison
            </span>
          </div>
          
          {travelerPickedUp && (
            <div className="ml-8 sm:ml-10 space-y-2">
              {/* Confirmation voyageur */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {travelerDelivered ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    Voyageur confirme livraison
                    {travelerDelivered && <span className="text-green-600 ml-1">✓ {travelerName}</span>}
                  </span>
                </div>
                {!isSender && !travelerDelivered && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdate("traveler_delivered")}
                    disabled={loading === "traveler_delivered"}
                    className="h-6 text-[10px] sm:text-xs px-2"
                  >
                    {loading === "traveler_delivered" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "J'ai livré"
                    )}
                  </Button>
                )}
              </div>

              {/* Confirmation expéditeur */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {senderReceived ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    Expéditeur confirme réception
                    {senderReceived && <span className="text-green-600 ml-1">✓ {senderName}</span>}
                  </span>
                </div>
                {isSender && !senderReceived && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdate("sender_received")}
                    disabled={loading === "sender_received"}
                    className="h-6 text-[10px] sm:text-xs px-2"
                  >
                    {loading === "sender_received" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Colis reçu"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {step3Complete && (
        <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
          <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">
            🎉 Transaction complétée avec succès !
          </span>
        </div>
      )}
    </div>
  );
};

export default TransactionTracking;
