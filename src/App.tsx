import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectProvider } from "@/contexts/ProjectContext";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ChatPage from "./pages/ChatPage";
import BriefPage from "./pages/BriefPage";
import DecisionsPage from "./pages/DecisionsPage";
import MeetingsPage from "./pages/MeetingsPage";
import AlertsPage from "./pages/AlertsPage";
import IntelligencePage from "./pages/IntelligencePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ProjectProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/brief" element={<BriefPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
