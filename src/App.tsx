import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient } from 'react-query';

import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import CoinDetails from '@/pages/CoinDetails';
import Learning from '@/pages/Learning';
import News from '@/pages/News';
import VirtualPortfolio from '@/pages/VirtualPortfolio';
import InvestmentAnalysis from '@/pages/InvestmentAnalysis';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import NewsManagement from '@/pages/admin/NewsManagement';
import LearningManagement from '@/pages/admin/LearningManagement';
import CryptoListingsManagement from '@/pages/admin/CryptoListingsManagement';
import SubscriptionManagement from '@/pages/admin/SubscriptionManagement';
import PaymentManagement from '@/pages/admin/PaymentManagement';

import DataPopulation from '@/pages/admin/DataPopulation';

function App() {
  return (
    <QueryClient>
      <BrowserRouter>
        <Toaster />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/coin/:coinId" element={<ProtectedRoute><CoinDetails /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
          <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><VirtualPortfolio /></ProtectedRoute>} />
          <Route path="/investment/:coinId" element={<ProtectedRoute><InvestmentAnalysis /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/data-population" element={<AdminLayout><DataPopulation /></AdminLayout>} />
          <Route path="/admin/news" element={<AdminLayout><NewsManagement /></AdminLayout>} />
          <Route path="/admin/learning" element={<AdminLayout><LearningManagement /></AdminLayout>} />
          <Route path="/admin/crypto-listings" element={<AdminLayout><CryptoListingsManagement /></AdminLayout>} />
          <Route path="/admin/subscriptions" element={<AdminLayout><SubscriptionManagement /></AdminLayout>} />
          <Route path="/admin/payments" element={<AdminLayout><PaymentManagement /></AdminLayout>} />
          
          {/* Not Found route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;
