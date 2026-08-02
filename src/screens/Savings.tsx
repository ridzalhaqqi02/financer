import React, { useEffect, useState } from 'react';
import { PiggyBank, ShieldCheck, ArrowUpRight, ArrowDownRight, FileText, Settings2, Plus, ArrowLeftRight, Trash2, Building2, Eye, EyeOff } from 'lucide-react';

interface Account {
  id: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  gradientTheme: string;
  accentColor: string;
}

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'panin',
    bankName: 'Panin Tabungan',
    accountNumber: '1001 8452 90',
    balance: 0,
    gradientTheme: 'from-[#800000] via-[#5c0000] to-[#330000]',
    accentColor: 'text-rose-200'
  },
  {
    id: 'bca',
    bankName: 'Tahapan BCA',
    accountNumber: '0981 8889 22',
    balance: 0,
    gradientTheme: 'from-[#003087] via-[#002266] to-[#001133]',
    accentColor: 'text-blue-200'
  }
];

export function Savings() {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('cashwallet_multi_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_ACCOUNTS; }
    }
    const paninOld = localStorage.getItem('cashwallet_savings_panin');
    const bcaOld = localStorage.getItem('cashwallet_savings_bca');
    const initAccounts = [...DEFAULT_ACCOUNTS];
    if (paninOld) initAccounts[0].balance = parseFloat(paninOld);
    if (bcaOld) initAccounts[1].balance = parseFloat(bcaOld);
    return initAccounts;
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState('');
  
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState(accounts[0]?.id || '');
  const [transferTo, setTransferTo] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');

  // State hideBalance disinkronkan dengan localStorage
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('cashwallet_savings_hide') === 'true';
  });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  const ownerName = localStorage.getItem('profileName') || 'Haqqi Ridzal Fat';

  const formatCurrency = (val: number) => {
    if (hideBalance) return 'Rp ••••••••';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const toggleHideBalance = () => {
    const nextState = !hideBalance;
    setHideBalance(nextState);
    localStorage.setItem('cashwallet_savings_hide', String(nextState));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setter('');
      return;
    }
    setter(parseInt(rawValue, 10).toLocaleString('id-ID'));
  };

  const handleQuickAdd = (addValue: number) => {
    const currentClean = parseInt(tempAmount.replace(/\D/g, ''), 10) || 0;
    setTempAmount((currentClean + addValue).toLocaleString('id-ID'));
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = parseInt(tempAmount.replace(/\D/g, ''), 10) || 0;

    const updated = accounts.map(acc => {
      if (acc.id === activeModal) {
        return { ...acc, balance: cleanNumber };
      }
      return acc;
    });

    setAccounts(updated);
    localStorage.setItem('cashwallet_multi_accounts', JSON.stringify(updated));
    
    if (activeModal === 'panin') localStorage.setItem('cashwallet_savings_panin', cleanNumber.toString());
    if (activeModal === 'bca') localStorage.setItem('cashwallet_savings_bca', cleanNumber.toString());

    setActiveModal(null);
    setNotificationMsg('Saldo rekening berhasil diperbarui.');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBalance = parseInt(newInitialBalance.replace(/\D/g, ''), 10) || 0;
    const themes = [
      'from-[#1e293b] via-[#0f172a] to-[#020617]',
      'from-[#065f46] via-[#047857] to-[#064e3b]',
      'from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]',
      'from-[#b45309] via-[#92400e] to-[#78350f]'
    ];
    const randomTheme = themes[accounts.length % themes.length];

    const newAcc: Account = {
      id: 'acc_' + Date.now(),
      bankName: newBankName,
      accountNumber: newAccountNumber || '8899 ' + Math.floor(1000 + Math.random() * 9000) + ' ' + Math.floor(10 + Math.random() * 90),
      balance: cleanBalance,
      gradientTheme: randomTheme,
      accentColor: 'text-slate-200'
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    localStorage.setItem('cashwallet_multi_accounts', JSON.stringify(updated));

    setShowAddAccountModal(false);
    setNewBankName('');
    setNewAccountNumber('');
    setNewInitialBalance('');
    setNotificationMsg('Rekening baru berhasil ditambahkan.');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(transferAmount.replace(/\D/g, ''), 10) || 0;

    if (transferFrom === transferTo) {
      alert('Sumber dan tujuan transfer tidak boleh sama.');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === transferFrom);
    if (!sourceAcc || sourceAcc.balance < cleanAmount) {
      alert('Saldo pada rekening sumber tidak mencukupi.');
      return;
    }

    const updated = accounts.map(acc => {
      if (acc.id === transferFrom) return { ...acc, balance: acc.balance - cleanAmount };
      if (acc.id === transferTo) return { ...acc, balance: acc.balance + cleanAmount };
      return acc;
    });

    setAccounts(updated);
    localStorage.setItem('cashwallet_multi_accounts', JSON.stringify(updated));
    setShowTransferModal(false);
    setTransferAmount('');
    setNotificationMsg('Transfer antar rekening berhasil diproses.');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleDeleteAccount = (id: string) => {
    if (id === 'panin' || id === 'bca') {
      alert('Rekening utama tidak dapat dihapus.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus rekening ini?')) {
      const updated = accounts.filter(a => a.id !== id);
      setAccounts(updated);
      localStorage.setItem('cashwallet_multi_accounts', JSON.stringify(updated));
      setNotificationMsg('Rekening berhasil dihapus.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const totalAllSavings = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <main className="px-5 pt-4 pb-36 max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Notifikasi Sukses */}
      {showNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header dengan Tombol Sembunyikan Saldo (Hide Balance) */}
      <div className="flex justify-between items-center px-1">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary block">Multi-Account Banking</span>
          <h1 className="text-xl font-black text-on-surface">Simpanan & Rekening</h1>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Tombol Mata untuk Sembunyikan/Tampilkan Saldo */}
          <button
            onClick={toggleHideBalance}
            className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
            title={hideBalance ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
          >
            {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-primary shadow-2xs cursor-pointer text-xs"
            title="Transfer Antar Rekening"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowAddAccountModal(true)}
            className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center shadow-2xs cursor-pointer transition-colors"
            title="Tambah Rekening"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ringkasan Total Semua Saldo Rekening */}
      <div className="bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-surface-container flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Total Akumulasi Simpanan</span>
          <h2 className="text-xl font-black text-primary mt-0.5">{formatCurrency(totalAllSavings)}</h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <PiggyBank className="w-5 h-5" />
        </div>
      </div>

      {/* DAFTAR KARTU REKENING */}
      <div className="space-y-4">
        {accounts.map((acc) => (
          <div key={acc.id} className={`bg-gradient-to-br ${acc.gradientTheme} p-6 rounded-[28px] text-white shadow-xl relative overflow-hidden space-y-5 border border-white/10`}>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className={`text-[10px] font-bold tracking-widest uppercase ${acc.accentColor}`}>{acc.bankName}</span>
                <p className="text-xs font-mono tracking-wider text-slate-300 mt-0.5">{acc.accountNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/10 text-white border border-white/20 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  IDR
                </span>
                <button
                  onClick={() => { setTempAmount(acc.balance.toLocaleString('id-ID')); setActiveModal(acc.id); }}
                  className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
                  title="Atur Saldo"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
                {acc.id !== 'panin' && acc.id !== 'bca' && (
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="w-7 h-7 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 flex items-center justify-center text-rose-300 transition-all cursor-pointer"
                    title="Hapus Rekening"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="relative z-10 space-y-1">
              <span className="text-[10px] uppercase font-medium tracking-wider text-slate-300">Saldo Efektif</span>
              <h2 className="text-3xl font-black tracking-tight text-white">{formatCurrency(acc.balance)}</h2>
              <p className="text-xs font-bold text-slate-100/90 tracking-wide pt-1">{ownerName}</p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between relative z-10 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Status Rekening Aktif</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Verified</span>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Layanan Perbankan */}
      <div className="bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-surface-container space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-on-surface">Layanan Perbankan</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center p-3 bg-surface-container-low/60 rounded-2xl border border-surface-container text-center space-y-1.5 cursor-pointer hover:bg-surface-container transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-on-surface">Mutasi</span>
          </div>
          <div onClick={() => setShowTransferModal(true)} className="flex flex-col items-center justify-center p-3 bg-surface-container-low/60 rounded-2xl border border-surface-container text-center space-y-1.5 cursor-pointer hover:bg-surface-container transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-on-surface">Transfer</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-surface-container-low/60 rounded-2xl border border-surface-container text-center space-y-1.5 cursor-pointer hover:bg-surface-container transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-on-surface">e-Statement</span>
          </div>
        </div>
      </div>

      {/* ================= MODAL ATUR SALDO ================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-sm p-6 rounded-[28px] shadow-2xl space-y-5 border border-surface-container">
            <div className="flex justify-between items-center border-b border-surface-container pb-3">
              <h3 className="text-base font-black text-on-surface">Perbarui Saldo Rekening</h3>
              <button onClick={() => setActiveModal(null)} className="text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveBalance} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nominal Baru (IDR)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-bold text-on-surface-variant">Rp</span>
                  <input 
                    type="text" 
                    value={tempAmount} 
                    onChange={(e) => handleInputChange(e, setTempAmount)} 
                    required
                    autoFocus
                    placeholder="0"
                    className="w-full h-12 pl-10 pr-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm focus:outline-none focus:border-primary font-black text-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-outline block">Pintasan Tambah Cepat:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => handleQuickAdd(100_000)} className="py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-[11px] font-black text-on-surface cursor-pointer">+ 100 Ribu</button>
                  <button type="button" onClick={() => handleQuickAdd(1_000_000)} className="py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-[11px] font-black text-on-surface cursor-pointer">+ 1 Juta</button>
                  <button type="button" onClick={() => handleQuickAdd(10_000_000)} className="py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-[11px] font-black text-on-surface cursor-pointer">+ 10 Juta</button>
                  <button type="button" onClick={() => handleQuickAdd(50_000_000)} className="py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-[11px] font-black text-on-surface cursor-pointer">+ 50 Juta</button>
                  <button type="button" onClick={() => handleQuickAdd(100_000_000)} className="py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-[11px] font-black text-on-surface cursor-pointer">+ 100 Juta</button>
                  <button type="button" onClick={() => handleQuickAdd(1_000_000_000)} className="py-2 bg-primary/10 text-primary rounded-xl text-[11px] font-black cursor-pointer">+ 1 Milyar</button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-surface-container text-on-surface font-bold text-xs rounded-2xl cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary font-black text-xs rounded-2xl shadow-md cursor-pointer">Konfirmasi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH REKENING BARU ================= */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-sm p-6 rounded-[28px] shadow-2xl space-y-5 border border-surface-container">
            <div className="flex justify-between items-center border-b border-surface-container pb-3">
              <h3 className="text-base font-black text-on-surface">Tambah Rekening Bank Baru</h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Nama Bank / E-Wallet</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Contoh: Bank Mandiri, SeaBank" 
                  value={newBankName} 
                  onChange={(e) => setNewBankName(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Nomor Rekening (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Kosongkan untuk generate otomatis" 
                  value={newAccountNumber} 
                  onChange={(e) => setNewAccountNumber(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Saldo Awal (Rp)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="0" 
                  value={newInitialBalance} 
                  onChange={(e) => handleInputChange(e, setNewInitialBalance)} 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-black text-base"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddAccountModal(false)} className="flex-1 py-3 bg-surface-container text-on-surface font-bold text-xs rounded-2xl cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary font-black text-xs rounded-2xl shadow-md cursor-pointer">Simpan Rekening</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TRANSFER ANTAR REKENING ================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-surface-container-lowest w-full max-w-sm p-6 rounded-[28px] shadow-2xl space-y-5 border border-surface-container">
            <div className="flex justify-between items-center border-b border-surface-container pb-3">
              <h3 className="text-base font-black text-on-surface">Transfer Antar Rekening</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Dari Rekening</label>
                <select 
                  value={transferFrom} 
                  onChange={(e) => setTransferFrom(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-medium"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.bankName} ({formatCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Ke Rekening Tujuan</label>
                <select 
                  value={transferTo} 
                  onChange={(e) => setTransferTo(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-medium"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.bankName} ({formatCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Nominal Transfer (Rp)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="0" 
                  value={transferAmount} 
                  onChange={(e) => handleInputChange(e, setTransferAmount)} 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-black text-base"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-3 bg-surface-container text-on-surface font-bold text-xs rounded-2xl cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer">Kirim Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}