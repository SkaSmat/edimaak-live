import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "sender" | "traveler" | "admin" | null;

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        setSession(session);
        if (session) {
          await fetchUserRole(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur d'initialisation:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setUserRole((data?.role as UserRole) || null);
    } catch (error) {
      console.error("Erreur rôle:", error);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { session, userRole, isLoading };
};
