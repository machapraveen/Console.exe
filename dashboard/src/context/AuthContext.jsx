// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { register as apiRegister, login as apiLogin, getProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const userData = await getProfile();
          setUser(userData);
        } catch (error) {
          // Token might be invalid
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (userData) => {
    const response = await apiRegister(userData);
    localStorage.setItem('token', response.token);
    setUser(response.user);
    return response;
  };

  const login = async (credentials) => {
    const response = await apiLogin(credentials);
    localStorage.setItem('token', response.token);
    setUser(response.user);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};