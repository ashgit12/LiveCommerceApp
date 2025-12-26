import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center\">
        <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-primary\"></div>
      </div>
    );
  }

  return token ? children : <Navigate to=\"/login\" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className=\"App\">
          <Routes>
            <Route path=\"/login\" element={<LoginPage />} />
            <Route
              path=\"/dashboard\"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path=\"/catalog\"
              element={
                <ProtectedRoute>
                  <CatalogPage />
                </ProtectedRoute>
              }
            />
            <Route path=\"/\" element={<Navigate to=\"/dashboard\" />} />
          </Routes>
          <Toaster position=\"top-right\" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
