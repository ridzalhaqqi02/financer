import { BarChart3, History, Home, PiggyBank, User } from 'lucide-react';
import React from 'react';
import { cn } from '../utils';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'savings', label: 'Tabungan', icon: PiggyBank },
    { id: 'reports', label: 'Analisis', icon: BarChart3 },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pb-6 px-5 flex justify-center pointer-events-auto">
      <nav className="w-full max-w-md bg-surface-container-lowest/95 backdrop-blur-2xl border border-outline-variant/30 rounded-[28px] shadow-2xl p-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentTab(item.id);
              }}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-3.5 rounded-2xl transition-all duration-300 active:scale-95 cursor-pointer",
                isActive 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/30" 
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "scale-100")} />
              <span className={cn("text-[10px] font-bold tracking-tight mt-1", isActive ? "opacity-100" : "opacity-75")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}