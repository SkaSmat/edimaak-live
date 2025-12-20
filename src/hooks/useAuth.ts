import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "sender" | "traveler" | "admin" | null;

const AUTH_TIMEOUT_MS = 5000; // 5 second timeout to prevent infinite loading

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      // Set a timeout to prevent infinite loading state
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current && isLoading) {
          setIsLoading(false);
        }
      }, AUTH_TIMEOUT_MS);

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          setSession(null);
          setIsLoading(false);
          return;
        }

        setSession(session);
        if (session) {
          await fetchUserRole(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mountedRef.current) return;
      
      setSession(session);
      if (session) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle to prevent errors when no row found

      if (!mountedRef.current) return;

      if (error) {
        setUserRole(null);
      } else {
        setUserRole((data?.role as UserRole) || null);
      }
    } catch (error) {
      if (mountedRef.current) {
        setUserRole(null);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    }
  };

  return { session, userRole, isLoading };
};
