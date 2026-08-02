import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ArrowDownRight, ArrowUpRight, Bus, FileText, Filter, PlayCircle, Search, ShoppingBag, Tag, Utensils, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { generateBankPDF } from '../utils/pdfExport';
import { cn } from '../utils';

type FilterType = 'Semua' | 'Pemasukan' | 'Pengeluaran';

export function History() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('Semua');
  const filters: FilterType[] = ['Semua', 'Pemasukan', 'Pengeluaran'];
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData: any[] = [];
      snapshot.forEach((doc) => txData.push({ id: doc.id, ...doc.data() }));
      setTransactions(txData);
    });
    return () => unsubscribe();
  }, []);

  const getIcon = (category: string, type: string) => {
    switch (category) {
      case 'Makanan & Minuman': return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'Belanja': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'Transportasi': return <Bus className="w-4 h-4 text-purple-500" />;
      case 'Hiburan': return <PlayCircle className="w-4 h-4 text-rose-500" />;
      default: return type === 'income' ? <Wallet className="w-4 h-4 text-emerald-500" /> : <Tag className="w-4 h-4 text-primary" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const filteredTxs = transactions.filter(tx => {
    const matchesFilter = activeFilter === 'Semua' || (activeFilter === 'Pemasukan' ? tx.type === 'income' : tx.type === 'expense');
    const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredTotal = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const groupedTxs = filteredTxs.reduce((groups, tx) => {
    const date = tx.date ? new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Hari Ini';
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, any[]>);

  return (
    <main className="px-5 pt-4 pb-36 max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Tombol Unduh PDF Resmi */}
      <section className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-on-surface">Riwayat Transaksi</h1>
          <p className="text-xs text-on-surface-variant font-medium">Semua catatan pemasukan dan pengeluaran Anda.</p>
        </div>
        
        <button 
          onClick={generateBankPDF}
          className="bg-primary hover:bg-primary/90 text-on-primary px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold shadow-md active:scale-95 transition-all flex-shrink-0"
          title="Unduh Laporan Bank (PDF)"
        >
          <FileText className="w-4 h-4" />
          <span>Cetak PDF</span>
        </button>
      </section>

      {/* Kotak Pencarian & Filter */}
      <section className="space-y-3 sticky top-14 bg-surface/90 backdrop-blur-md pt-2 pb-2 z-30">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari transaksi atau kategori..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl text-sm focus:outline-none focus:border-primary shadow-sm font-medium transition-all" 
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {filters.map((f) => (
            <button 
              key={f} 
              onClick={() => setActiveFilter(f)} 
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm", 
                activeFilter === f 
                  ? "bg-primary text-on-primary shadow-md" 
                  : "bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Ringkasan Total Hasil Filter */}
      <section className="bg-surface-container-lowest p-4 rounded-[22px] shadow-sm border border-surface-container flex items-center justify-between">
        <div>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold block">Total ({activeFilter})</span>
          <span className={cn("text-base font-black", filteredTotal >= 0 ? "text-emerald-600" : "text-rose-500")}>
            {formatCurrency(filteredTotal)}
          </span>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-surface-container text-on-surface-variant">
          {filteredTxs.length} Item
        </span>
      </section>

      {/* Daftar Riwayat */}
      <div className="space-y-5">
        {Object.keys(groupedTxs).length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-[22px] border border-surface-container shadow-sm space-y-2">
            <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-on-surface-variant">
              <Filter className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-on-surface">Tidak ada riwayat ditemukan</p>
            <p className="text-xs text-on-surface-variant font-medium">Coba ubah kata kunci atau filter pencarian Anda.</p>
          </div>
        ) : (
          Object.entries(groupedTxs).map(([dateLabel, txs]) => (
            <section key={dateLabel} className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{dateLabel}</h3>
                <span className="text-[10px] text-outline font-medium">{txs.length} transaksi</span>
              </div>

              <div className="bg-surface-container-lowest rounded-[22px] shadow-sm border border-surface-container overflow-hidden divide-y divide-surface-container">
                {txs.map((tx: any) => {
                  const isIncome = tx.amount > 0;
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                          isIncome ? "bg-emerald-500/10" : "bg-surface-container-high"
                        )}>
                          {getIcon(tx.category, tx.type)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface tracking-tight">{tx.title}</p>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-surface-container font-semibold text-on-surface-variant inline-block mt-0.5">
                            {tx.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={cn("text-sm font-black tracking-tight", isIncome ? "text-emerald-600" : "text-on-surface")}>
                          {formatCurrency(tx.amount)}
                        </p>
                        <span className="text-[10px] text-outline font-medium">
                          {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}