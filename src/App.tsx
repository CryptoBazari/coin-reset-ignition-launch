
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import CryptoAnalysis from "./pages/CryptoAnalysis";
import VirtualPortfolio from "./pages/VirtualPortfolio";
import Auth from "./pages/Auth";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Learning from "./pages/Learning";
import LearningDetail from "./pages/LearningDetail";
import CryptoList from "./pages/CryptoList";
import CryptoListDetail from "./pages/CryptoListDetail";
import AdminAccess from "./pages/AdminAccess";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NewsManagement from "./pages/admin/NewsManagement";
import LearningManagement from "./pages/admin/LearningManagement";
import CryptoListingsManagement from "./pages/admin/CryptoListingsManagement";
import SubscriptionManagement from "./pages/admin/SubscriptionManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

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
          <Route path="/virtual-portfolio" element={<ProtectedRoute><VirtualPortfolio /></ProtectedRoute>} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/learning/:id" element={<LearningDetail />} />
          <Route path="/crypto-list" element={<CryptoList />} />
          <Route path="/crypto-list/:id" element={<CryptoListDetail />} />
          <Route path="/admin-access" element={<ProtectedRoute><AdminAccess /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/news" element={<ProtectedRoute><NewsManagement /></ProtectedRoute>} />
          <Route path="/admin/learning" element={<ProtectedRoute><LearningManagement /></ProtectedRoute>} />
          <Route path="/admin/crypto-listings" element={<ProtectedRoute><CryptoListingsManagement /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute><PaymentManagement /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
