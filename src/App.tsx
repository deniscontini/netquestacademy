import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CoursePage from "./pages/CoursePage";
import ModulePage from "./pages/ModulePage";
import Admin from "./pages/Admin";
import Master from "./pages/Master";
import Ranking from "./pages/Ranking";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import Conquistas from "./pages/Conquistas";
import Certificados from "./pages/Certificados";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/curso/:courseId" element={<CoursePage />} />
            <Route path="/modulo/:moduleId" element={<ModulePage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/master" element={<Master />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/conquistas" element={<Conquistas />} />
            <Route path="/certificados" element={<Certificados />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
