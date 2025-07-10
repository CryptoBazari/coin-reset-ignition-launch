
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import CryptoAnalysis from "./pages/CryptoAnalysis";
import VirtualPortfolio from "./pages/VirtualPortfolio";
import Auth from "./pages/Auth";
import News from "./pages/News";
import Learning from "./pages/Learning";
import CryptoList from "./pages/CryptoList";
import AdminAccess from "./pages/AdminAccess";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NewsManagement from "./pages/admin/NewsManagement";
import LearningManagement from "./pages/admin/LearningManagement";
import CryptoListingsManagement from "./pages/admin/CryptoListingsManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/analysis" element={<CryptoAnalysis />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/virtual-portfolio" element={<VirtualPortfolio />} />
          <Route path="/news" element={<News />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/crypto-list" element={<CryptoList />} />
          <Route path="/admin-access" element={<AdminAccess />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/news" element={<NewsManagement />} />
          <Route path="/admin/learning" element={<LearningManagement />} />
          <Route path="/admin/crypto-listings" element={<CryptoListingsManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
