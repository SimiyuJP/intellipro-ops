import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ChatPage from "./pages/ChatPage";
import BriefPage from "./pages/BriefPage";
import AuthPage from "./pages/AuthPage";
import DecisionsPage from "./pages/DecisionsPage";
import MeetingsPage from "./pages/MeetingsPage";
import AlertsPage from "./pages/AlertsPage";
import IntelligencePage from "./pages/IntelligencePage";
import VisibilityPage from "./pages/VisibilityPage";
import PredictivePage from "./pages/PredictivePage";
import AboutPage from "./pages/AboutPage";
import PeoplePage from "./pages/PeoplePage";
import ReportPage from "./pages/ReportPage";
import AccountabilityPage from "./pages/AccountabilityPage";
import MemoryPage from "./pages/MemoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ProjectProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/brief" element={<BriefPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
              <Route path="/rooms/:roomId" element={<ProtectedRoute><RoomDetailPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/decisions" element={<ProtectedRoute><DecisionsPage /></ProtectedRoute>} />
              <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
              <Route path="/intelligence" element={<ProtectedRoute><IntelligencePage /></ProtectedRoute>} />
              <Route path="/visibility" element={<ProtectedRoute><VisibilityPage /></ProtectedRoute>} />
              <Route path="/predictive" element={<ProtectedRoute><PredictivePage /></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
              <Route path="/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
              <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
              <Route path="/accountability" element={<ProtectedRoute><AccountabilityPage /></ProtectedRoute>} />
              <Route path="/memory" element={<ProtectedRoute><MemoryPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ProjectProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
