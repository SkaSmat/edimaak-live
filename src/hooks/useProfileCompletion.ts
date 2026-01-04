import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileCompletionStatus {
  isLoading: boolean;
  isComplete: boolean;
  userId: string | null;
}

export const useProfileCompletion = (): ProfileCompletionStatus => {
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isLoading: true,
    isComplete: true, // Default to true to avoid flash
    userId: null,
  });

  useEffect(() => {
    let isMounted = true;

    const checkCompletion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (isMounted) {
            setStatus({ isLoading: false, isComplete: true, userId: null });
          }
          return;
        }

        const userId = session.user.id;

        // Check if user is admin - admins don't need to complete profile
        const { data: isAdminResult } = await supabase.rpc("has_role", { 
          _user_id: userId, 
          _role: "admin" 
        });

        if (isAdminResult) {
          if (isMounted) {
            setStatus({ isLoading: false, isComplete: true, userId });
          }
          return;
        }

        // Check if user has phone number in private_info
        const { data: privateInfo } = await supabase
          .from("private_info")
          .select("phone")
          .eq("id", userId)
          .maybeSingle();

        const isComplete = !!privateInfo?.phone;

        if (isMounted) {
          setStatus({ isLoading: false, isComplete, userId });
        }
      } catch (error) {
        console.error("Error checking profile completion:", error);
        if (isMounted) {
          setStatus({ isLoading: false, isComplete: true, userId: null });
        }
      }
    };

    checkCompletion();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkCompletion();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return status;
};
