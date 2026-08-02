import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db } from '../firebase';

export async function generateBankPDF() {
  try {
    // Ambil data transaksi dari Firestore
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    let transactions: any[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({ id: doc.id, ...data });
      if (data.type === 'income') totalIncome += data.amount;
      else if (data.type === 'expense') totalExpense += Math.abs(data.amount);
    });

    const totalBalance = totalIncome - totalExpense;
    const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    
    // Ambil nama pemilik CashWallet dari localStorage
    const ownerName = localStorage.getItem('profileName') || 'Haqqi Ridzal Fat';

    // Buat elemen kontainer HTML tersembunyi untuk dokumen PDF bank
    const reportElement = document.createElement('div');
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.width = '794px'; // Ukuran standar A4 pixel width
    reportElement.style.padding = '40px';
    reportElement.style.background = '#ffffff';
    reportElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    reportElement.style.color = '#111827';

    reportElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">
            Cash<span style="font-weight: 300; color: #4f46e5;">Wallet</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Official Statement Report</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748b; line-height: 1.5;">
          <strong>PEMILIK AKUN:</strong> <span style="color: #0f172a; font-weight: 700;">${ownerName}</span><br>
          Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
          Status: Terverifikasi & Aktif
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
          <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 5px;">Total Saldo Bersih</div>
          <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${formatIDR(totalBalance)}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
          <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 5px;">Total Pemasukan</div>
          <div style="font-size: 18px; font-weight: 800; color: #059669;">${formatIDR(totalIncome)}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
          <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 5px;">Total Pengeluaran</div>
          <div style="font-size: 18px; font-weight: 800; color: #dc2626;">${formatIDR(totalExpense)}</div>
        </div>
      </div>

      <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 12px; letter-spacing: 0.5px;">Rincian Mutasi Rekening</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            <th style="text-align: left; padding: 10px 12px; font-weight: 600; text-transform: uppercase; font-size: 10px;">Tanggal</th>
            <th style="text-align: left; padding: 10px 12px; font-weight: 600; text-transform: uppercase; font-size: 10px;">Keterangan</th>
            <th style="text-align: left; padding: 10px 12px; font-weight: 600; text-transform: uppercase; font-size: 10px;">Kategori</th>
            <th style="text-align: left; padding: 10px 12px; font-weight: 600; text-transform: uppercase; font-size: 10px;">Jenis</th>
            <th style="text-align: right; padding: 10px 12px; font-weight: 600; text-transform: uppercase; font-size: 10px;">Nominal (IDR)</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.length === 0 ? `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Belum ada riwayat transaksi tercatat.</td></tr>` : 
            transactions.map((tx, index) => `
              <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; color: #334155;">${tx.date ? new Date(tx.date).toLocaleDateString('id-ID') : '-'}</td>
                <td style="padding: 10px 12px; color: #0f172a; font-weight: 700;">${tx.title}</td>
                <td style="padding: 10px 12px; color: #334155;">${tx.category}</td>
                <td style="padding: 10px 12px; color: #334155;">${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: ${tx.amount > 0 ? '#059669' : '#dc2626'};">
                  ${formatIDR(tx.amount)}
                </td>
              </tr>
            `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
        <div>Dokumen resmi ini dicetak secara digital dan sah oleh sistem CashWallet milik ${ownerName}.</div>
        <div>Halaman 1 dari 1</div>
      </div>
    `;

    document.body.appendChild(reportElement);

    // Konversi elemen HTML menjadi canvas lalu render ke file PDF
    const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
    document.body.removeChild(reportElement);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    
    // Unduh file PDF otomatis dengan nama pemilik akun
    const safeName = ownerName.replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`Laporan_Keuangan_CashWallet_${safeName}.pdf`);

  } catch (error) {
    console.error(error);
    alert('Gagal mengunduh laporan PDF.');
  }
}