import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  TrendingUp, 
  Settings 
} from 'lucide-react';

import { useAppStore } from '@/store/useAppStore';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { selectedPetId } = useAppStore();

  const navItems = [
    { to: '/', icon: Home, label: t('tabs.healthRecords') },
    { 
      to: selectedPetId ? `/pet/${selectedPetId}` : '/trends', 
      icon: TrendingUp, 
      label: t('tabs.trends') 
    },
    { to: '/settings', icon: Settings, label: t('settings.title') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 px-4 pb-safe pt-2 md:relative md:border-t-0 md:border-r md:w-64 md:h-screen md:flex-col md:pt-12 md:px-8">
      <div className="hidden md:block mb-12 px-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 serif">
          <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center text-primary-foreground italic">O</div>
          <span>Odin</span>
        </h1>
      </div>
      
      <div className="flex justify-around items-center md:flex-col md:items-stretch md:gap-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg transition-all duration-300
              md:flex-row md:gap-4 md:px-4 md:py-2.5
              ${isActive 
                ? 'text-foreground bg-primary/10 serif italic' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} className={isActive ? 'text-primary' : ''} />
                <span className="text-[10px] font-bold md:text-[13px] md:font-medium tracking-wide uppercase md:normal-case">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
