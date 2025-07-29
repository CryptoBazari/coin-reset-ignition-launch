
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import CryptoList from '@/pages/CryptoList';
import CryptoListDetail from '@/pages/CryptoListDetail';
import Learning from '@/pages/Learning';
import LearningDetail from '@/pages/LearningDetail';
import News from '@/pages/News';
import NewsDetail from '@/pages/NewsDetail';
import VirtualPortfolio from '@/pages/VirtualPortfolio';
import CryptoAnalysis from '@/pages/CryptoAnalysis';
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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/coin/:coinId" element={<ProtectedRoute><CryptoListDetail /></ProtectedRoute>} />
          <Route path="/crypto-list" element={<ProtectedRoute><CryptoList /></ProtectedRoute>} />
          <Route path="/crypto-list/:id" element={<ProtectedRoute><CryptoListDetail /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
          <Route path="/learning/:id" element={<ProtectedRoute><LearningDetail /></ProtectedRoute>} />
          <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
          <Route path="/news/:id" element={<ProtectedRoute><NewsDetail /></ProtectedRoute>} />
          <Route path="/virtual-portfolio" element={<ProtectedRoute><VirtualPortfolio /></ProtectedRoute>} />
          
          {/* Analysis routes - fix the routing issue */}
          <Route path="/analysis" element={<Navigate to="/analysis/bitcoin" replace />} />
          <Route path="/analysis/:coinId" element={<ProtectedRoute><CryptoAnalysis /></ProtectedRoute>} />

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
    </QueryClientProvider>
  );
}

export default App;
