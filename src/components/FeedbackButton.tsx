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
import { MessageSquareWarning, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface FeedbackButtonProps {
  variant?: "sidebar" | "floating";
  collapsed?: boolean;
}

const FEEDBACK_FORM_URL = "https://tally.so/r/feedback"; // URL à remplacer par votre formulaire

export const FeedbackButton = ({ variant = "sidebar", collapsed = false }: FeedbackButtonProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Veuillez décrire votre problème ou avis");
      return;
    }

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open external form with prefilled message
    // For Tally: https://tally.so/r/FORM_ID?feedback=MESSAGE
    // For Google Forms: https://docs.google.com/forms/d/e/FORM_ID/viewform?entry.FIELD_ID=MESSAGE
    window.open(`${FEEDBACK_FORM_URL}?feedback=${encodedMessage}`, "_blank");
    
    toast.success("Merci pour ton retour ! Le formulaire s'ouvre dans un nouvel onglet.");
    setMessage("");
    setOpen(false);
  };

  const handleOpenForm = () => {
    window.open(FEEDBACK_FORM_URL, "_blank");
    setOpen(false);
  };

  if (variant === "floating") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
          >
            <MessageSquareWarning className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <FeedbackModal
          message={message}
          setMessage={setMessage}
          onSubmit={handleSubmit}
          onOpenForm={handleOpenForm}
        />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-3 w-full p-3 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <MessageSquareWarning className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm">Donner un avis</span>}
        </button>
      </DialogTrigger>
      <FeedbackModal
        message={message}
        setMessage={setMessage}
        onSubmit={handleSubmit}
        onOpenForm={handleOpenForm}
      />
    </Dialog>
  );
};

interface FeedbackModalProps {
  message: string;
  setMessage: (value: string) => void;
  onSubmit: () => void;
  onOpenForm: () => void;
}

const FeedbackModal = ({ message, setMessage, onSubmit, onOpenForm }: FeedbackModalProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-primary" />
          Donner un avis / Signaler un problème
        </DialogTitle>
        <DialogDescription>
          Aide-nous à améliorer EDIM3AK en partageant ton retour d'expérience.
        </DialogDescription>
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
          Ton avis est précieux pour nous. Merci de prendre le temps de nous aider !
        </p>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onOpenForm} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Ouvrir le formulaire
        </Button>
        <Button onClick={onSubmit}>
          Envoyer
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default FeedbackButton;
