import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [seller, setSeller] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSeller = localStorage.getItem('seller');
    const storedToken = localStorage.getItem('token');

    if (storedToken && storedSeller) {
      setSeller(JSON.parse(storedSeller));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (sellerData, tokenData) => {
    localStorage.setItem('seller', JSON.stringify(sellerData));
    localStorage.setItem('token', tokenData);
    setSeller(sellerData);
    setToken(tokenData);
  };

  const logout = () => {
    localStorage.removeItem('seller');
    localStorage.removeItem('token');
    setSeller(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ seller, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
