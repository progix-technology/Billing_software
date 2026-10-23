import React, { useState, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Use HashRouter for Electron (file://), BrowserRouter for Web (http://)
const isElectron = window.location.protocol === 'file:';
const Router = isElectron ? HashRouter : BrowserRouter;
import { AuthProvider, api } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminLayout from './components/Layout/AdminLayout';
import SplashScreen from './components/Common/SplashScreen';

// Pages
import ActivateSoftware from './pages/ActivateSoftware';
import InitialSetup from './pages/InitialSetup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Profile from './pages/Profile';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminPackages from './pages/SuperAdminPackages';
import SuperAdminSettings from './pages/SuperAdminSettings';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [systemState, setSystemState] = useState({
    loading: true,
    isActivated: false,
    isSetupCompleted: false,
  });

  useEffect(() => {
    checkAppHealth();
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2300);

    const finishTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  const checkAppHealth = async () => {
    try {
      const res = await api.get('/api/system/setup-status');
      if (res.data.success) {
        setSystemState({
          loading: false,
          isActivated: res.data.isActivated,
          isSetupCompleted: res.data.isSetupCompleted,
        });
      }
    } catch (err) {
      console.error('Setup status check failed', err);
      setSystemState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          {showSplash && <SplashScreen fadeOut={fadeOut} />}
          <Router>
            <Routes>
              {/* Mandatory Activation & Initial Setup Routes */}
              <Route path="/activate" element={<ActivateSoftware />} />
              <Route path="/setup" element={<InitialSetup />} />

              {/* Public Auth Routes */}
              <Route 
                path="/login" 
                element={
                  !systemState.loading && !systemState.isActivated && isElectron ? (
                    <Navigate to="/activate" replace />
                  ) : !systemState.loading && !systemState.isSetupCompleted && isElectron ? (
                    <Navigate to="/setup" replace />
                  ) : (
                    <Login />
                  )
                } 
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Private Admin/Manager/Staff Routes */}
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Protected SuperAdmin Routes */}
              <Route element={<SuperAdminLayout />}>
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/superadmin/packages" element={<SuperAdminPackages />} />
                <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
              </Route>

              {/* Global Root Fallback:
                  1. If not activated -> Redirect to /activate
                  2. If not setup -> Redirect to /setup
                  3. If activated and setup -> Redirect to /login
              */}
              <Route 
                path="*" 
                element={
                  !systemState.loading && !systemState.isActivated && isElectron ? (
                    <Navigate to="/activate" replace />
                  ) : !systemState.loading && !systemState.isSetupCompleted && isElectron ? (
                    <Navigate to="/setup" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />
            </Routes>
          </Router>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
