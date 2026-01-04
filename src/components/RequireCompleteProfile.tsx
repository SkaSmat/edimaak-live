import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { Loader2 } from "lucide-react";

interface RequireCompleteProfileProps {
  children: ReactNode;
}

// Routes that don't require profile completion
const EXCLUDED_ROUTES = [
  "/",
  "/auth",
  "/complete-profile",
  "/reset-password",
  "/legal",
  "/securite",
];

export const RequireCompleteProfile = ({ children }: RequireCompleteProfileProps) => {
  const { isLoading, isComplete, userId } = useProfileCompletion();
  const location = useLocation();

  // Check if current route is excluded
  const isExcludedRoute = EXCLUDED_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith("/user/")
  );

  // If on excluded route, don't check completion
  if (isExcludedRoute) {
    return <>{children}</>;
  }

  // Show loader while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in but profile incomplete, redirect to complete-profile
  if (userId && !isComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};
