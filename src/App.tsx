import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthGuard, GuestGuard } from './components/AuthGuard';
import { MainLayout } from './components/Layout/MainLayout';
import Login from './screens/Login';
import Register from './screens/Register';
import Home from './screens/Home';
import PetDetail from './screens/PetDetail';
import Settings from './screens/Settings';
import { PetModal } from './modals/PetModal';
import { HealthRecordModal } from './modals/HealthRecordModal';
import { MedicationModal } from './modals/MedicationModal';
import { ShareModal } from './modals/ShareModal';
import { ProfileModal } from './modals/ProfileModal';
import { EmergencyCardModal } from './modals/EmergencyCardModal';
import { BatchRecordModal } from './modals/BatchRecordModal';
import { LabExplanationModal } from './modals/LabExplanationModal';
import { DoseMonitor } from './components/Notifications/DoseMonitor';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

import { useAppStore } from './store/useAppStore';
import { useEffect } from 'react';

// Placeholders for global views (future tasks)
const Medications = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-card border border-dashed border-border rounded-3xl">
    <h2 className="text-xl font-bold mb-2">Medications Overview</h2>
    <p className="text-muted-foreground">Select a pet from the home screen to see their specific medications.</p>
  </div>
);

const Trends = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-card border border-dashed border-border rounded-3xl">
    <h2 className="text-xl font-bold mb-2">Global Trends</h2>
    <p className="text-muted-foreground">Select a pet from the home screen to see their health parameter trends.</p>
  </div>
);

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
          <Route
            path="/register"
            element={
              <GuestGuard>
                <Register />
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
