import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Trash2, Loader2 } from "lucide-react";

interface ProfileAvatarUploadProps {
  userId: string;
  fullName: string;
  currentAvatarUrl?: string | null;
  onAvatarUpdated: (newUrl: string | null) => void;
}

export const ProfileAvatarUpload = ({
  userId,
  fullName,
  currentAvatarUrl,
  onAvatarUpdated,
}: ProfileAvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setIsUploading(true);

    try {
      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = `${userId}/avatar`;
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new avatar
      const filePath = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Use stable URL without cache buster for database storage
      // The browser will cache based on the actual file content
      const stableUrl = publicUrl;

      // Update profile with stable URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: stableUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Pass URL with cache buster for immediate UI update only
      onAvatarUpdated(`${stableUrl}?t=${Date.now()}`);
      toast.success("Photo de profil mise à jour");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erreur lors de l'upload de la photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl) return;

    setIsDeleting(true);

    try {
      // Delete from storage
      const filePath = `${userId}/avatar`;
      await supabase.storage.from("avatars").remove([filePath]);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      onAvatarUpdated(null);
      toast.success("Photo de profil supprimée");
    } catch (error: any) {
      console.error("Error deleting avatar:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        fullName={fullName}
        avatarUrl={currentAvatarUrl}
        size="lg"
        className="w-16 h-16 text-xl"
      />
      
      <div className="flex flex-col gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            asChild
          >
            <span>
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {currentAvatarUrl ? "Changer la photo" : "Ajouter une photo"}
            </span>
          </Button>
        </label>
        
        {currentAvatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
};
