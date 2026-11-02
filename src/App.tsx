import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Play from "./pages/Play.tsx";
import Profile from "./pages/Profile.tsx";
import Missions from "./pages/Missions.tsx";
import BestRuns from "./pages/BestRuns.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/play" element={<Play />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/runs" element={<BestRuns />} />
          {/* Old address, kept so saved links still work */}
          <Route path="/leaderboard" element={<Navigate to="/runs" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
