import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import InventoryDashboard from './pages/InventoryDashboard';
import OrdersPage from './pages/OrdersPage';
import GoLivePage from './pages/GoLivePage';
import LiveControlPage from './pages/LiveControlPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ConnectAccountsPage from './pages/ConnectAccountsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/go-live" element={<GoLivePage />} />
          <Route path="/live-control/:sessionId" element={<LiveControlPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/connect-accounts" element={<ConnectAccountsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
