import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthGuard, GuestGuard } from './components/AuthGuard';
import { MainLayout } from './components/Layout/MainLayout';
import Login from './screens/Login';
import Register from './screens/Register';
import ForgotPassword from './screens/ForgotPassword';
import Home from './screens/Home';
import PetDetail from './screens/PetDetail';
import Settings from './screens/Settings';
import Medications from './screens/Medications';
import Trends from './screens/Trends';
import { PetModal } from './modals/PetModal';
import { HealthRecordModal } from './modals/HealthRecordModal';
import { MedicationModal } from './modals/MedicationModal';
import { ShareModal } from './modals/ShareModal';
import { ProfileModal } from './modals/ProfileModal';
import { EmergencyCardModal } from './modals/EmergencyCardModal';
import { BatchRecordModal } from './modals/BatchRecordModal';
import { LabExplanationModal } from './modals/LabExplanationModal';
import { AIKeysModal } from './modals/AIKeysModal';
import { DoseMonitor } from './components/Notifications/DoseMonitor';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

import { useAppStore } from './store/useAppStore';
import { useEffect } from 'react';


const LabExplanationModalWrapper = () => {
  const { activeModal, modalData } = useAppStore();
  if (activeModal !== 'lab_explanation' || !modalData) return null;
  return <LabExplanationModal record={modalData.record} pet={modalData.pet} />;
};

function App() {
  const { theme, locale } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.lang = locale;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, locale]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: 'bg-card text-foreground border border-border rounded-xl shadow-lg',
            duration: 3000,
          }}
        />
        <PetModal />
        <HealthRecordModal />
        <MedicationModal />
        <ShareModal />
        <ProfileModal />
        <EmergencyCardModal />
        <BatchRecordModal />
        <LabExplanationModalWrapper />
        <AIKeysModal />
        <DoseMonitor />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <GuestGuard>
                <Login />
              </GuestGuard>
            }
          />
          {import.meta.env.VITE_DISABLE_SIGNUP !== 'true' && (
            <Route
              path="/register"
              element={
                <GuestGuard>
                  <Register />
                </GuestGuard>
              }
            />
          )}
          <Route
            path="/register"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/forgot-password"
            element={
              <GuestGuard>
                <ForgotPassword />
              </GuestGuard>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Home />} />
            <Route path="pet/:id" element={<PetDetail />} />
            <Route path="medications" element={<Medications />} />
            <Route path="trends" element={<Trends />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
