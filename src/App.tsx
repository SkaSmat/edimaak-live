import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

// Lazy load all pages except the landing page for better initial load
const Auth = lazy(() => import("./pages/Auth"));
const TravelerDashboard = lazy(() => import("./pages/TravelerDashboard"));
const TravelerTrips = lazy(() => import("./pages/TravelerTrips"));
const TravelerMatches = lazy(() => import("./pages/TravelerMatches"));
const SenderDashboard = lazy(() => import("./pages/SenderDashboard"));
const SenderShipments = lazy(() => import("./pages/SenderShipments"));
const SenderMatches = lazy(() => import("./pages/SenderMatches"));
const Messages = lazy(() => import("./pages/Messages"));
const DirectChat = lazy(() => import("./pages/DirectChat"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Legal = lazy(() => import("./pages/Legal"));
const Security = lazy(() => import("./pages/Security"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));

// Configure React Query for optimal caching and performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (formerly cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus (better UX)
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
    },
  },
});

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          <Route
            path="/auth"
            element={
              <Suspense fallback={<PageLoader />}>
                <Auth />
              </Suspense>
            }
          />

          <Route
            path="/reset-password"
            element={
              <Suspense fallback={<PageLoader />}>
                <ResetPassword />
              </Suspense>
            }
          />

          <Route
            path="/user/:userId"
            element={
              <Suspense fallback={<PageLoader />}>
                <PublicProfile />
              </Suspense>
            }
          />

          <Route
            path="/dashboard/traveler"
            element={
              <Suspense fallback={<PageLoader />}>
                <TravelerDashboard />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/traveler/trips"
            element={
              <Suspense fallback={<PageLoader />}>
                <TravelerTrips />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/traveler/matches"
            element={
              <Suspense fallback={<PageLoader />}>
                <TravelerMatches />
              </Suspense>
            }
          />

          <Route
            path="/dashboard/sender"
            element={
              <Suspense fallback={<PageLoader />}>
                <SenderDashboard />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/sender/shipments"
            element={
              <Suspense fallback={<PageLoader />}>
                <SenderShipments />
              </Suspense>
            }
          />
          <Route
            path="/dashboard/sender/matches"
            element={
              <Suspense fallback={<PageLoader />}>
                <SenderMatches />
              </Suspense>
            }
          />

          <Route
            path="/messages"
            element={
              <Suspense fallback={<PageLoader />}>
                <Messages />
              </Suspense>
            }
          />
          <Route
            path="/messages/direct/:conversationId"
            element={
              <Suspense fallback={<PageLoader />}>
                <DirectChat />
              </Suspense>
            }
          />

          <Route
            path="/admin"
            element={
              <Suspense fallback={<PageLoader />}>
                <Admin />
              </Suspense>
            }
          />

          <Route
            path="/profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            }
          />

          <Route
            path="/legal"
            element={
              <Suspense fallback={<PageLoader />}>
                <Legal />
              </Suspense>
            }
          />
          <Route
            path="/securite"
            element={
              <Suspense fallback={<PageLoader />}>
                <Security />
              </Suspense>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route
            path="*"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
