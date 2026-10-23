import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Determine default base URL based on environment
let defaultBaseURL = '';
if (window.location.protocol === 'file:') {
  defaultBaseURL = 'http://localhost:5000'; // Electron local backend
}

// Create configure axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronously set the default authorization header
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }

  // Setup request interceptor (optional now that we use defaults, but keeping for completeness if needed)
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Fallback to localStorage if the state token is somehow out of sync during a quick request
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Setup response interceptor to auto logout on 401
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  // Load user profile on startup if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const isSuperAdminRoute = 
        window.location.pathname.startsWith('/superadmin') || 
        window.location.hash.includes('superadmin');

      // 1. Only restore SuperAdmin session if navigating inside /superadmin portal
      if (isSuperAdminRoute) {
        const saUserStr = localStorage.getItem('superadmin_user');
        const saToken = localStorage.getItem('superadmin_token');
        if (saToken && saUserStr) {
          try {
            const saUser = JSON.parse(saUserStr);
            if (saUser && saUser.role === 'superadmin') {
              setUser(saUser);
              setLoading(false);
              return;
            }
          } catch (e) {}
        }
      }

      // 2. Regular Store Admin user fetch
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        try {
          const res = await api.get('/api/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Auto login check failed', err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (emailOrUsername, password) => {
    try {
      // Clear any previous superadmin session to avoid session conflict
      localStorage.removeItem('superadmin_user');
      localStorage.removeItem('superadmin_token');

      const res = await api.post('/api/auth/login', { emailOrUsername, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed, please check credentials',
        isMaintenanceMode: error.response?.data?.isMaintenanceMode || false
      };
    }
  };

  const signup = async (username, email, password, role) => {
    try {
      const res = await api.post('/api/auth/signup', { username, email, password, role });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('superadmin_user');
    localStorage.removeItem('superadmin_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
