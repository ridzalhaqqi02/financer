import { ArrowLeft, ChevronRight, Edit2, Moon, Plus, Shield, Sun, Trash2, Wallet } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export function Profile() {
  const [activeView, setActiveView] = useState('main');
  const [profileName, setProfileName] = useState('Pengguna');
  const [profileImg, setProfileImg] = useState('');
  
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([
    { id: '1', name: 'BCA', type: 'Bank', number: '***-8921', balance: 'Rp4.500.000' },
    { id: '2', name: 'ShopeePay', type: 'E-Wallet', number: '0812****9999', balance: 'Rp75.500' }
  ]);

  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('ShopeePay');
  const [accNumber, setAccNumber] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [tempImage, setTempImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const savedImg = localStorage.getItem('profileImg');
    const savedName = localStorage.getItem('profileName');
    if (savedImg) setProfileImg(savedImg);
    if (savedName) setProfileName(savedName);

    const savedAccounts = localStorage.getItem('linkedAccounts');
    if (savedAccounts) setLinkedAccounts(JSON.parse(savedAccounts));

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const isBank = selectedProvider === 'BCA' || selectedProvider === 'Mandiri';
    const newAcc = {
      id: Date.now().toString(),
      name: selectedProvider,
      type: isBank ? 'Bank' : 'E-Wallet',
      number: accNumber || '***-****',
      balance: 'Rp0'
    };
    const updated = [...linkedAccounts, newAcc];
    setLinkedAccounts(updated);
    localStorage.setItem('linkedAccounts', JSON.stringify(updated));
    setAccNumber('');
    setShowAddAccountModal(false);
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm('Hapus tautan akun ini?')) {
      const updated = linkedAccounts.filter(acc => acc.id !== id);
      setLinkedAccounts(updated);
      localStorage.setItem('linkedAccounts', JSON.stringify(updated));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveCroppedImage = () => {
    if (!imageRef.current) return;
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    const radius = 60;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    ctx.save();
    ctx.translate(size / 2 + position.x, size / 2 + position.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(imageRef.current, -imageRef.current.naturalWidth / 2, -imageRef.current.naturalHeight / 2);
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    localStorage.setItem('profileImg', croppedDataUrl);
    setProfileImg(croppedDataUrl);
    setTempImage(null);
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const handleEditName = () => {
    const newName = prompt('Masukkan nama baru Anda:', profileName);
    if (newName && newName.trim() !== '') {
      setProfileName(newName);
      localStorage.setItem('profileName', newName);
      window.dispatchEvent(new Event('profileUpdated'));
    }
  };

  if (activeView === 'accounts') {
    return (
      <main className="px-5 pt-4 pb-36 max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('main')} className="p-2 bg-surface-container-highest hover:bg-surface-variant rounded-full text-on-surface">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-on-surface">Akun Terhubung</h1>
          </div>
          <button 
            onClick={() => setShowAddAccountModal(true)}
            className="bg-primary text-on-primary px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Hubungkan
          </button>
        </div>

        <div className="space-y-3">
          {linkedAccounts.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant text-xs font-medium">Belum ada akun yang terhubung.</div>
          ) : (
            linkedAccounts.map((acc) => (
              <div key={acc.id} className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center font-bold text-xs text-secondary">
                    {acc.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{acc.name}</p>
                    <p className="text-[11px] text-on-surface-variant font-medium">{acc.type} • {acc.number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-on-surface">{acc.balance}</span>
                  <button onClick={() => handleDeleteAccount(acc.id)} className="p-1.5 text-outline hover:text-error rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showAddAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 border border-surface-container">
              <h2 className="text-base font-black text-on-surface">Pilih Akun</h2>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Pilih Layanan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ShopeePay', 'DANA', 'OVO', 'BCA'].map((provider) => (
                      <button
                        type="button"
                        key={provider}
                        onClick={() => setSelectedProvider(provider)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedProvider === provider 
                            ? 'bg-primary text-on-primary border-primary shadow-sm' 
                            : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Nomor Rekening / No. HP</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: 08123456789" 
                    value={accNumber} 
                    onChange={(e) => setAccNumber(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-medium" 
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddAccountModal(false)} className="flex-1 py-3 border border-outline-variant rounded-xl font-bold text-xs">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-black text-xs">Hubungkan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="px-5 pt-4 pb-36 max-w-md mx-auto space-y-6">
      
      {tempImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col items-center space-y-4 border border-surface-container">
            <h2 className="text-base font-black text-on-surface">Atur Posisi Foto</h2>
            <div 
              className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-primary cursor-grab bg-surface-variant flex items-center justify-center select-none shadow-inner"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img 
                ref={imageRef}
                src={tempImage} 
                alt="Pratinjau" 
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  maxWidth: 'none',
                  pointerEvents: 'none'
                }}
                className="absolute"
              />
            </div>
            <div className="w-full space-y-1">
              <input type="range" min="0.2" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-primary cursor-pointer" />
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setTempImage(null)} className="flex-1 py-3 rounded-xl border border-outline-variant font-bold text-xs">Batal</button>
              <button onClick={handleSaveCroppedImage} className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-black text-xs">Gunakan</button>
            </div>
          </div>
        </div>
      )}

      {/* Profil Utama */}
      <section className="flex flex-col items-center text-center py-2 space-y-2">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md ring-4 ring-surface-container bg-surface-variant flex items-center justify-center">
            {profileImg ? (
              <img className="w-full h-full object-cover" alt="Foto Profil" src={profileImg} />
            ) : (
              <span className="text-2xl font-bold text-on-surface-variant">{profileName.charAt(0)}</span>
            )}
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-[-6px] right-[-6px] bg-primary text-on-primary p-2 rounded-full shadow-md active:scale-90 transition-transform">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-0.5 flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-black tracking-tight text-on-surface">{profileName}</h1>
            <button onClick={handleEditName} className="text-outline hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">pengguna@cashwallet.id</p>
        </div>
      </section>

      {/* Menu Pengaturan */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">Pengaturan</h2>
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden divide-y divide-surface-container">
          
          <button onClick={() => setActiveView('accounts')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"><Wallet className="w-4 h-4" /></div>
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface">Akun Terhubung</p>
                <p className="text-[11px] text-on-surface-variant font-medium">{linkedAccounts.length} akun tertaut</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-on-surface-variant" />
          </button>

          <div className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface">Mode Gelap / Terang</p>
                <p className="text-[11px] text-on-surface-variant font-medium">{isDarkMode ? 'Aktif (Dark)' : 'Aktif (Light)'}</p>
              </div>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={cn("w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300", isDarkMode ? "bg-primary" : "bg-surface-container-high")}
            >
              <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", isDarkMode ? "translate-x-6" : "translate-x-0")}></div>
            </button>
          </div>

          <div className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Shield className="w-4 h-4" /></div>
              <div className="text-left"><p className="text-sm font-bold text-on-surface">Keamanan & Privasi</p><p className="text-[11px] text-on-surface-variant font-medium">Terlindungi</p></div>
            </div>
            <ChevronRight className="w-4 h-4 text-on-surface-variant" />
          </div>

        </div>
      </section>

      <section className="pt-2">
        <button className="w-full py-3.5 rounded-2xl border border-rose-500/30 text-rose-500 text-xs font-bold hover:bg-rose-500/10 active:scale-95 transition-all">
          Keluar dari CashWallet
        </button>
      </section>
    </main>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}