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
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Legal = lazy(() => import("./pages/Legal"));
const Security = lazy(() => import("./pages/Security"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));

const queryClient = new QueryClient();

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/user/:userId" element={<PublicProfile />} />
            <Route path="/dashboard/traveler" element={<TravelerDashboard />} />
            <Route path="/dashboard/traveler/trips" element={<TravelerTrips />} />
            <Route path="/dashboard/traveler/matches" element={<TravelerMatches />} />
            <Route path="/dashboard/sender" element={<SenderDashboard />} />
            <Route path="/dashboard/sender/shipments" element={<SenderShipments />} />
            <Route path="/dashboard/sender/matches" element={<SenderMatches />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/securite" element={<Security />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
