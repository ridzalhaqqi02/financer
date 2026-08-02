import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { ArrowDownRight, ArrowUpRight, Bus, Eye, EyeOff, Plus, ShoppingBag, ShoppingBasket, Trash2, TrendingUp, Utensils, Wallet, X, CreditCard, ShieldCheck, PiggyBank } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { cn } from '../utils';

export function Home() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('income');
  const [txCategory, setTxCategory] = useState('Makanan & Minuman');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const [savingsBalance, setSavingsBalance] = useState<number>(() => {
    const savedAccounts = localStorage.getItem('cashwallet_multi_accounts');
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        return parsed.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
      } catch (e) {
        return 0;
      }
    }
    const savedPanin = localStorage.getItem('cashwallet_savings_panin');
    const savedBca = localStorage.getItem('cashwallet_savings_bca');
    return (savedPanin ? parseFloat(savedPanin) : 0) + (savedBca ? parseFloat(savedBca) : 0);
  });

  const [profileName, setProfileName] = useState('Pengguna');
  
  // State hideBalance untuk Wallet Cash Utama
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('cashwallet_home_hide') === 'true';
  });

  // State hideSavingsBalance terpisah khusus untuk E-Wallet Simpanan (tersimpan di localStorage)
  const [hideSavingsBalance, setHideSavingsBalance] = useState<boolean>(() => {
    return localStorage.getItem('cashwallet_home_savings_hide') === 'true';
  });
  
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number>(0);

  useEffect(() => {
    const savedName = localStorage.getItem('profileName');
    if (savedName) setProfileName(savedName);

    const handleUpdate = () => {
      const name = localStorage.getItem('profileName');
      if (name) setProfileName(name);

      const savedAccounts = localStorage.getItem('cashwallet_multi_accounts');
      if (savedAccounts) {
        try {
          const parsed = JSON.parse(savedAccounts);
          setSavingsBalance(parsed.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0));
        } catch (e) {}
      }
    };
    window.addEventListener('profileUpdated', handleUpdate);
    return () => window.removeEventListener('profileUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData: any[] = [];
      let income = 0;
      let expense = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        txData.push({ id: doc.id, ...data });
        if (data.type === 'income') income += data.amount;
        else if (data.type === 'expense') expense += Math.abs(data.amount);
      });

      setTransactions(txData);
      setTotalIncome(income);
      setTotalExpense(expense);
      setTotalBalance(income - expense);
    });
    return () => unsubscribe();
  }, []);

  const toggleHideBalance = () => {
    const nextState = !hideBalance;
    setHideBalance(nextState);
    localStorage.setItem('cashwallet_home_hide', String(nextState));
  };

  const toggleHideSavingsBalance = () => {
    const nextState = !hideSavingsBalance;
    setHideSavingsBalance(nextState);
    localStorage.setItem('cashwallet_home_savings_hide', String(nextState));
  };

  const monthlyTarget = 5000000;
  const budgetPercentage = Math.min(Math.round((totalExpense / monthlyTarget) * 100), 100);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const getIcon = (category: string, type: string) => {
    switch (category) {
      case 'Makanan & Minuman': return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'Belanja': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'Transportasi': return <Bus className="w-4 h-4 text-purple-500" />;
      default: return type === 'income' ? <Wallet className="w-4 h-4 text-emerald-500" /> : <ShoppingBasket className="w-4 h-4 text-primary" />;
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value !== '') value = parseInt(value, 10).toLocaleString('id-ID');
    setTxAmount(value);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); 
    const numericAmount = Number(txAmount.replace(/\./g, ''));
    try {
      await addDoc(collection(db, 'transactions'), {
        title: txTitle,
        amount: txType === 'expense' ? -Math.abs(numericAmount) : numericAmount,
        type: txType,
        category: txType === 'income' ? 'Pemasukan' : txCategory, 
        date: new Date().toISOString(),
        createdAt: serverTimestamp() 
      });
      setTxTitle(''); setTxAmount(''); setTxType('income'); setShowAddModal(false);
    } catch (error) {
      alert('Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setSwipedId(null);
    } catch (error) {
      alert('Gagal menghapus transaksi.');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) setSwipedId(id);
    else if (diff < -50) setSwipedId(null);
  };

  return (
    <main className="px-5 pt-4 pb-36 max-w-md mx-auto space-y-6">
      
      {/* Sapaan Pengguna */}
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">Halo, {profileName}</h1>
          <p className="text-xs text-on-surface-variant font-medium">Ringkasan keuangan Anda hari ini.</p>
        </div>
      </section>

      {/* KARTU 1: SALDO DOMPET UTAMA */}
      <section>
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-6 border border-white/10">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary opacity-20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-200 via-amber-400 to-amber-100 flex items-center justify-center shadow-xs border border-amber-300/30 flex-shrink-0">
                <div className="w-6 h-4 border border-amber-700/30 rounded-xs grid grid-cols-2 grid-rows-2">
                  <div className="border-r border-b border-amber-700/30"></div>
                  <div className="border-b border-amber-700/30"></div>
                  <div className="border-r border-amber-700/30"></div>
                  <div></div>
                </div>
              </div>
              <div>
                <span className="text-xs font-black tracking-widest text-slate-200 uppercase block">CASH WALLET</span>
                <span className="text-[9px] font-medium tracking-wider text-slate-400 block">Digital Platinum</span>
              </div>
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95 border border-white/10 flex-shrink-0 cursor-pointer"
              title="Tambah Transaksi"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Saldo Dompet</span>
              <button 
                onClick={toggleHideBalance} 
                className="text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                title={hideBalance ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
              >
                {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <h2 className="text-3xl font-black tracking-tight mt-1 text-amber-300">
              {hideBalance ? 'Rp ••••••••' : formatCurrency(totalBalance)}
            </h2>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">Stabil</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Account</span>
            </div>
          </div>
        </div>
      </section>

      {/* KARTU 2: E-WALLET SIMPANAN (Tombol Hide Terpisah) */}
      <section>
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 text-white rounded-2xl p-4 shadow-md flex flex-col justify-between gap-4 border border-slate-700/50">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-6 rounded-sm bg-gradient-to-tr from-amber-200 via-amber-400 to-amber-100 flex items-center justify-center shadow-xs border border-amber-300/30 flex-shrink-0">
                <div className="w-5 h-3 border border-amber-700/30 rounded-xs grid grid-cols-2 grid-rows-2">
                  <div className="border-r border-b border-amber-700/30"></div>
                  <div className="border-b border-amber-700/30"></div>
                  <div className="border-r border-amber-700/30"></div>
                  <div></div>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-black tracking-widest text-slate-200 uppercase block">E-WALLET SIMPANAN</span>
                <span className="text-[8px] font-medium tracking-wider text-slate-400 block">Multi-Account Balance</span>
              </div>
            </div>

            {/* Tombol Hide Terpisah Khusus Kartu E-Wallet */}
            <button 
              onClick={toggleHideSavingsBalance}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-all border border-white/10 cursor-pointer"
              title={hideSavingsBalance ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
            >
              {hideSavingsBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="relative z-10">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Akumulasi Simpanan</span>
            <h2 className="text-xl font-black tracking-tight mt-0.5 text-slate-100">
              {hideSavingsBalance ? 'Rp •••••••' : formatCurrency(savingsBalance)}
            </h2>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10 text-[11px]">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>Active Vault</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">Secured</span>
          </div>
        </div>
      </section>

      {/* Grid Statistik Cepat */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-600">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-on-surface-variant block mb-0.5">Pemasukan</span>
            <span className="text-sm font-extrabold text-emerald-600 truncate block">{hideBalance ? 'Rp •••••••' : formatCurrency(totalIncome)}</span>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center mb-3 text-rose-500">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-on-surface-variant block mb-0.5">Pengeluaran</span>
            <span className="text-sm font-extrabold text-rose-500 truncate block">{hideBalance ? 'Rp •••••••' : formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </section>

      {/* Visualisasi Anggaran Bulanan */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Anggaran Bulanan</h3>
            <p className="text-[11px] text-on-surface-variant font-medium">Batas aman pengeluaran</p>
          </div>
          <span className="text-xs font-bold text-primary">{budgetPercentage}% terpakai</span>
        </div>
        
        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${budgetPercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-[11px] text-on-surface-variant font-medium pt-0.5">
          <span>{hideBalance ? 'Rp •••••••' : formatCurrency(totalExpense)} terpakai</span>
          <span>Target {hideBalance ? 'Rp •••••••' : formatCurrency(monthlyTarget)}</span>
        </div>
      </section>

      {/* Transaksi Terakhir */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Transaksi Terakhir</h3>
          <span className="text-[10px] text-outline font-medium">Geser kiri untuk opsi</span>
        </div>
        
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden divide-y divide-surface-container">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-xs font-medium">Belum ada transaksi terekam.</div>
          ) : (
            transactions.slice(0, 5).map((tx) => {
              const isIncome = tx.amount > 0;
              const isSwiped = swipedId === tx.id;

              return (
                <div key={tx.id} className="relative overflow-hidden">
                  <div className="absolute inset-y-0 right-0 w-24 bg-rose-500 flex items-center justify-center z-0">
                    <button 
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="w-full h-full flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 active:bg-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  </div>

                  <div 
                    onTouchStart={handleTouchStart}
                    onTouchEnd={(e) => handleTouchEnd(e, tx.id)}
                    onClick={() => { if (isSwiped) setSwipedId(null); }}
                    style={{ transform: isSwiped ? 'translateX(-96px)' : 'translateX(0px)' }}
                    className="p-4 flex items-center justify-between bg-surface-container-lowest relative z-10 transition-transform duration-300 ease-out cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                        isIncome ? "bg-emerald-500/10" : "bg-surface-container-high"
                      )}>
                        {getIcon(tx.category, tx.type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface tracking-tight">{tx.title}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container font-medium text-on-surface-variant inline-block mt-0.5">
                          {tx.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={cn("text-sm font-black tracking-tight", isIncome ? "text-emerald-600" : "text-on-surface")}>
                        {hideBalance ? 'Rp •••••••' : formatCurrency(tx.amount)}
                      </p>
                      <span className="text-[10px] text-outline font-medium">
                        {isIncome ? 'Masuk' : 'Keluar'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* MODAL TAMBAH TRANSAKSI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-surface-container">
            <div className="flex justify-between items-center p-5 border-b border-surface-container">
              <h2 className="text-base font-black text-on-surface">Tambah Transaksi</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setTxType('income')} className={cn("py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer", txType === 'income' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-sm' : 'border-outline-variant text-on-surface-variant')}>Pemasukan</button>
                  <button type="button" onClick={() => setTxType('expense')} className={cn("py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer", txType === 'expense' ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-sm' : 'border-outline-variant text-on-surface-variant')}>Pengeluaran</button>
                </div>
              </div>
              
              {txType === 'expense' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Kategori</label>
                  <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-medium">
                    <option value="Makanan & Minuman">Makanan & Minuman</option>
                    <option value="Transportasi">Transportasi</option>
                    <option value="Belanja">Belanja</option>
                    <option value="Hiburan">Hiburan</option>
                    <option value="Tagihan">Tagihan</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Keterangan</label>
                <input type="text" required placeholder="Contoh: Gaji Bulanan, Makan Siang" value={txTitle} onChange={(e) => setTxTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Nominal (Rp)</label>
                <input type="text" inputMode="numeric" required placeholder="0" value={txAmount} onChange={handleAmountChange} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-primary font-black text-base" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 rounded-2xl font-black bg-primary text-on-primary text-sm shadow-md active:scale-95 transition-transform cursor-pointer">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}