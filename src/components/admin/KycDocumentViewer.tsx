import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KycDocumentViewerProps {
  documentUrl: string | null;
  userName: string;
}

export const KycDocumentViewer = ({ documentUrl, userName }: KycDocumentViewerProps) => {
  const [loading, setLoading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = async () => {
    if (!documentUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Extract path from URL if it's a full URL
      let path = documentUrl;
      if (documentUrl.includes("/kyc-documents/")) {
        path = documentUrl.split("/kyc-documents/").pop() || "";
      }
      
      const { data, error: signError } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(path, 300); // 5 minutes validity

      if (signError) throw signError;
      setSignedUrl(data.signedUrl);
    } catch (err: any) {
      console.error("Error loading document:", err);
      setError("Impossible de charger le document");
    } finally {
      setLoading(false);
    }
  };

  if (!documentUrl) {
    return (
      <span className="text-xs text-muted-foreground">Aucun document</span>
    );
  }

  return (
    <Dialog onOpenChange={(open) => open && loadDocument()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-primary">
          <FileText className="h-3.5 w-3.5 mr-1" />
          Voir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Document KYC - {userName}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadDocument}>
                Réessayer
              </Button>
            </div>
          ) : signedUrl ? (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="border rounded-lg overflow-hidden bg-muted/30">
                <img
                  src={signedUrl}
                  alt="Document KYC"
                  className="max-w-full max-h-[60vh] mx-auto object-contain"
                  onError={() => setError("Impossible d'afficher l'image")}
                />
              </div>
              
              {/* Open in new tab button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(signedUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
