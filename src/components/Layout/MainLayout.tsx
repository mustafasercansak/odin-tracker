import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative overflow-hidden">
      <div className="aurora-bg" />
      <Navbar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 entrance">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
