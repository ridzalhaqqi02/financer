import React, { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { TopBar } from './components/TopBar';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Profile } from './screens/Profile';
import { Reports } from './screens/Reports';
import { Savings } from './screens/Savings';

export function App() {
  const [currentTab, setCurrentTab] = useState('home');

  return (
    <div className="min-h-screen bg-surface text-on-surface pb-32 relative select-none">
      {/* Top Bar / Header Atas */}
      <TopBar />

      {/* Render Layar Berdasarkan Tab Aktif */}
      {currentTab === 'home' && <Home />}
      {currentTab === 'history' && <History />}
      {currentTab === 'savings' && <Savings />}
      {currentTab === 'reports' && <Reports />}
      {currentTab === 'profile' && <Profile />}

      {/* Bilah Navigasi Bawah */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
}