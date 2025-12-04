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
import { MessageSquareWarning, Send } from "lucide-react"; // Changement de ExternalLink à Send
import { toast } from "sonner";

interface FeedbackButtonProps {
  variant?: "sidebar" | "floating";
  collapsed?: boolean;
}

// URL à remplacer par votre formulaire Tally, Google Forms, etc.
const FEEDBACK_FORM_URL = "https://tally.so/r/feedback";

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

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Ouvre l'URL externe avec le message pré-rempli
    window.open(`${FEEDBACK_FORM_URL}?feedback=${encodedMessage}`, "_blank");

    toast.success("Merci pour ton retour ! Le formulaire a été soumis via l'outil de support.");

    // Nettoyage de l'état
    setMessage("");
    setOpen(false);
    setIsSending(false);
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
        {/* CORRECTION STYLE : On passe en ghost pour un style plus propre dans la sidebar */}
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
        <p className="text-xs text-muted-foreground">
          Ton avis sera soumis à l'équipe de support. Merci de prendre le temps de nous aider !
        </p>
      </div>

      {/* CORRECTION FINALE : Retrait du bouton "Ouvrir le formulaire" et envoi direct */}
      <DialogFooter className="justify-end">
        <Button onClick={onSubmit} disabled={!message.trim() || isSending}>
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default FeedbackButton;
