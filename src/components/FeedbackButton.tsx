import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareWarning, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeedbackButtonProps {
  variant?: "sidebar" | "floating";
  collapsed?: boolean;
}

// ✅ TON EMAIL EST ICI
const ADMIN_EMAIL = "10poubelle0@gmail.com";

export const FeedbackButton = ({ variant = "sidebar", collapsed = false }: FeedbackButtonProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Veuillez décrire votre problème ou avis");
      return;
    }

    setIsSending(true);

    // Simulation UX
    setTimeout(() => {
      // Préparation du mail
      const subject = encodeURIComponent("Feedback / Signalement EDIM3AK");
      const body = encodeURIComponent(message);

      // Ouvre le client mail de l'utilisateur vers TON adresse
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;

      toast.success("Merci ! Ton application mail va s'ouvrir pour envoyer le message.");

      // Reset
      setMessage("");
      setOpen(false);
      setIsSending(false);
    }, 800);
  };

  const commonProps = {
    message: message,
    setMessage: setMessage,
    onSubmit: handleSubmit,
    isSending: isSending,
  };

  if (variant === "floating") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50">
            <MessageSquareWarning className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <FeedbackModal {...commonProps} />
      </Dialog>
    );
  }

  // Version Sidebar
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center justify-start gap-3 w-full p-3 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <MessageSquareWarning className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm">Donner un avis</span>}
        </Button>
      </DialogTrigger>
      <FeedbackModal {...commonProps} />
    </Dialog>
  );
};

interface FeedbackModalProps {
  message: string;
  setMessage: (value: string) => void;
  onSubmit: () => void;
  isSending: boolean;
}

const FeedbackModal = ({ message, setMessage, onSubmit, isSending }: FeedbackModalProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-primary" />
          Donner un avis / Signaler un problème
        </DialogTitle>
        <DialogDescription>Aide-nous à améliorer EDIM3AK en partageant ton retour d'expérience.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <Textarea
          placeholder="Décris ton problème ou ton avis..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">Ton avis nous sera envoyé directement par email.</p>
      </div>

      <DialogFooter className="justify-end">
        <Button onClick={onSubmit} disabled={!message.trim() || isSending}>
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Envoyer par email
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default FeedbackButton;
