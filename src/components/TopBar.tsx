import React, { useEffect, useState } from 'react';

export function TopBar() {
  const [profileImg, setProfileImg] = useState('');
  const [profileName, setProfileName] = useState('CashWallet');

  const loadProfile = () => {
    const savedImg = localStorage.getItem('profileImg');
    const savedName = localStorage.getItem('profileName');
    if (savedImg) setProfileImg(savedImg);
    if (savedName) setProfileName(savedName);
  };

  useEffect(() => {
    loadProfile();
    window.addEventListener('profileUpdated', loadProfile);
    return () => window.removeEventListener('profileUpdated', loadProfile);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-container px-5 py-3 max-w-md mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Bingkai foto profil persegi sudut melengkung */}
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-variant border border-outline-variant/40 shadow-sm flex items-center justify-center flex-shrink-0">
          {profileImg ? (
            <img src={profileImg} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <span className="text-on-surface-variant font-bold text-sm">{profileName.charAt(0)}</span>
          )}
        </div>
        
        {/* Nama Aplikasi: CashWallet dengan Gaya Font Elegan iOS */}
        <div className="flex items-center gap-1">
          <span className="text-lg font-black tracking-tight text-on-surface font-sans">
            Cash<span className="text-primary font-light">Wallet</span>
          </span>
        </div>
      </div>
    </header>
  );
}