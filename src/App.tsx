import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TravelerDashboard from "./pages/TravelerDashboard";
import TravelerTrips from "./pages/TravelerTrips";
import TravelerMatches from "./pages/TravelerMatches";
import SenderDashboard from "./pages/SenderDashboard";
import SenderShipments from "./pages/SenderShipments";
import SenderMatches from "./pages/SenderMatches";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
