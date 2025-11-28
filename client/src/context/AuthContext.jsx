import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const registerHousehold = async (data) => {
      try {
          const res = await api.post('/auth/register-household', data);
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
          return { success: true };
      } catch (error) {
          return { success: false, message: error.response?.data?.message || 'Registration failed' };
      }
  };

  const joinHousehold = async (data) => {
      try {
          const res = await api.post('/auth/join-household', data);
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
          return { success: true };
      } catch (error) {
          return { success: false, message: error.response?.data?.message || 'Join failed' };
      }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, registerHousehold, joinHousehold, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
