import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import InventoryDashboard from './pages/InventoryDashboard';
import OrdersPage from './pages/OrdersPage';
import GoLivePage from './pages/GoLivePage';
import LiveControlPage from './pages/LiveControlPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ConnectAccountsPage from './pages/ConnectAccountsPage';
import LoginPage from './pages/LoginPage';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <InventoryDashboard />
        </ProtectedRoute>
      } />
      <Route path="/catalog" element={
        <ProtectedRoute>
          <CatalogPage />
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      } />
      <Route path="/go-live" element={
        <ProtectedRoute>
          <GoLivePage />
        </ProtectedRoute>
      } />
      <Route path="/live-control/:sessionId" element={
        <ProtectedRoute>
          <LiveControlPage />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AnalyticsPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/connect-accounts" element={
        <ProtectedRoute>
          <ConnectAccountsPage />
        </ProtectedRoute>
      } />
      
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
