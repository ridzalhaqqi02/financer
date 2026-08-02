import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ArrowDownRight, ArrowUpRight, BarChart3, PieChart, ShieldCheck, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { cn } from '../utils';

export function Reports() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let txData: any[] = [];
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
    });
    return () => unsubscribe();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const netBalance = totalIncome - totalExpense;

  // Data Berdasarkan Tab Aktif
  const activeTransactions = transactions.filter(tx => activeTab === 'expense' ? tx.type === 'expense' : tx.type === 'income');
  const activeTotal = activeTab === 'expense' ? totalExpense : totalIncome;

  // Kelompokkan per kategori
  const categorySummary = activeTransactions.reduce((acc: any, tx) => {
    const cat = tx.category || 'Lainnya';
    if (!acc[cat]) {
      acc[cat] = { total: 0, items: [] };
    }
    acc[cat].total += Math.abs(tx.amount);
    acc[cat].items.push(tx);
    return acc;
  }, {});

  const categories = Object.keys(categorySummary);
  const maxCategoryTotal = Math.max(...categories.map(cat => categorySummary[cat].total), 1);

  // Palet Warna Eksklusif
  const colorPalette = activeTab === 'expense' 
    ? ['#4f46e5', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#6366f1'] 
    : ['#10b981', '#059669', '#34d399', '#06b6d4', '#3b82f6'];

  // Hitung Donut Slices
  let cumulativePercent = 0;
  const donutSlices = categories.map((cat, index) => {
    const data = categorySummary[cat];
    const percent = activeTotal > 0 ? (data.total / activeTotal) * 100 : 0;
    const startAngle = cumulativePercent;
    cumulativePercent += percent;
    return {
      cat,
      total: data.total,
      percent,
      items: data.items,
      color: colorPalette[index % colorPalette.length],
      strokeDasharray: `${percent} ${100 - percent}`,
      strokeDashoffset: -startAngle,
    };
  });

  return (
    <main className="px-5 pt-4 pb-36 max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header Elegan */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">Analisis Keuangan</h1>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">Statistik mendalam terverifikasi CashWallet.</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-surface-container-high/60 flex items-center justify-center text-primary shadow-sm border border-outline-variant/30">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Bingkai / Kartu Saldo Bersih Utama (Disamakan persis dengan warna & gaya Home) */}
      <section>
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-6 border border-white/10">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary opacity-20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Saldo Bersih</span>
              <h2 className="text-3xl font-black tracking-tight mt-1 text-amber-300">{formatCurrency(netBalance)}</h2>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-indigo-300 flex items-center justify-center border border-white/10">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 relative z-10 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Masuk</span>
                <span className="font-bold text-emerald-400">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Keluar</span>
                <span className="font-bold text-rose-400">{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilihan Tab (Pengeluaran vs Pemasukan) */}
      <div className="bg-surface-container-high p-1.5 rounded-2xl grid grid-cols-2 gap-1 shadow-inner border border-outline-variant/20">
        <button
          onClick={() => setActiveTab('expense')}
          className={cn(
            "py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'expense' 
              ? "bg-surface-container-lowest text-rose-500 shadow-md" 
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Pengeluaran</span>
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={cn(
            "py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'income' 
              ? "bg-surface-container-lowest text-emerald-600 shadow-md" 
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Pemasukan</span>
        </button>
      </div>

      {/* Bagian Grafik Donat & Statistik Visual */}
      <section className="bg-surface-container-lowest p-6 rounded-[28px] shadow-sm border border-surface-container space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Distribusi {activeTab === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant">
            {categories.length} Kategori
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-xs text-on-surface-variant font-medium">
            Belum ada data transaksi {activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'} tercatat.
          </div>
        ) : (
          <div className="space-y-6">
            {/* SVG Donut Chart Mewah */}
            <div className="flex flex-col items-center justify-center py-3">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className="text-slate-900/10"
                  />
                  {donutSlices.map((slice, i) => (
                    <circle
                      key={i}
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="4"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Total {activeTab === 'expense' ? 'Keluar' : 'Masuk'}</span>
                  <span className={cn("text-xs font-black mt-0.5", activeTab === 'expense' ? 'text-rose-500' : 'text-emerald-600')}>
                    {formatCurrency(activeTotal)}
                  </span>
                </div>
              </div>

              {/* Keterangan Warna */}
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {donutSlices.map((slice, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-[11px] font-extrabold text-on-surface shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: slice.color }}></span>
                    <span>{slice.cat} ({Math.round(slice.percent)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rincian Bar & Item Spesifik */}
            <div className="space-y-4 pt-4 border-t border-surface-container">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">Rincian Per Kategori & Item</h4>
              
              <div className="space-y-3.5">
                {donutSlices.map((slice, idx) => {
                  const barWidth = Math.min(Math.round((slice.total / maxCategoryTotal) * 100), 100);

                  return (
                    <div key={slice.cat} className="p-4 bg-surface-container-low/60 rounded-2xl border border-surface-container space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-on-surface flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: slice.color }}></span>
                          {slice.cat}
                        </span>
                        <span className={cn("font-black", activeTab === 'expense' ? 'text-rose-500' : 'text-emerald-600')}>
                          {formatCurrency(slice.total)} ({Math.round(slice.percent)}%)
                        </span>
                      </div>

                      {/* Bar Persentase */}
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out shadow-xs" 
                          style={{ width: `${barWidth}%`, backgroundColor: slice.color }}
                        ></div>
                      </div>

                      {/* Sub-item transaksi */}
                      <div className="space-y-1.5 pt-2 border-t border-surface-container/80">
                        {slice.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-[11px] px-2 py-1.5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-2xs">
                            <span className="font-bold text-on-surface truncate pr-2">{item.title}</span>
                            <span className={cn("font-extrabold flex-shrink-0", activeTab === 'expense' ? 'text-rose-500' : 'text-emerald-600')}>
                              {formatCurrency(Math.abs(item.amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}