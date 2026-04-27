import { useState } from 'react';
import { SaleRecord } from '../../types';
import { Plus, Search, FileText, Trash2, Printer, Mail, Loader2, ExternalLink, Download, Cloud } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import SaleReceipt from './SaleReceipt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

interface SalesListProps {
  sales: SaleRecord[];
  onAddSale: () => void;
  onDeleteSale: (id: string) => void;
  onUpdateSale: (id: string, data: Partial<SaleRecord>) => Promise<void>;
}

export default function SalesList({ sales, onAddSale, onDeleteSale, onUpdateSale }: SalesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [printSale, setPrintSale] = useState<SaleRecord | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  const filteredSales = sales.filter(s => 
    s.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.vehicleReg.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return dateB - dateA;
  });

  const handlePrint = (sale: SaleRecord) => {
    setPrintSale(sale);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadPdf = async (sale: SaleRecord) => {
    setIsGeneratingPdf(sale.id);
    setPrintSale(sale);

    try {
      // Wait for the DOM to update and render the receipt
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const receiptElement = document.getElementById(`receipt-${sale.id}`);
      if (!receiptElement) throw new Error('Receipt element not found');

      // Capture with html2canvas (now safe since we removed Tailwind oklch colors from receipt)
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Save locally
      pdf.save(`ใบชั่งน้ำหนัก_${sale.buyerName}_${sale.date}.pdf`);

      // Upload to Cloud Storage if not already uploaded
      if (!sale.receiptUrl) {
        const pdfDataUri = pdf.output('datauristring');
        const storageRef = ref(storage, `sales_receipts/${sale.id}/receipt.pdf`);
        await uploadString(storageRef, pdfDataUri, 'data_url', {
          contentType: 'application/pdf'
        });
        const url = await getDownloadURL(storageRef);
        
        // Update DB
        await onUpdateSale(sale.id, { receiptUrl: url });
      }
      
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      const errorMessage = error?.message || 'ไม่พบรายละเอียดสาเหตุ';
      alert(`เกิดข้อผิดพลาดในการสร้างหรืออัปโหลด PDF: ${errorMessage}\n\nกรุณาตรวจสอบว่าคุณได้ตั้งค่า Storage Rules ให้เป็น Public หรือยัง?`);
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const handleSendEmail = (sale: SaleRecord) => {
    if (!sale.buyerEmail) return;
    
    const subject = `ใบสรุปการขายหมูขุน นิพนธ์ฟาร์ม - ${formatDate(sale.date)}`;
    const body = `เรียน คุณ ${sale.buyerName},\n\nสรุปรายการขายหมูขุน วันที่ ${formatDate(sale.date)}\nทะเบียนรถ: ${sale.vehicleReg || '-'}\n\nจำนวนหมู: ${sale.totalPigs} ตัว\nน้ำหนักสุทธิรวม: ${sale.totalNetWeight.toFixed(1)} กก.\nน้ำหนักเฉลี่ย: ${sale.avgWeight.toFixed(2)} กก./ตัว\nราคาขาย: ${sale.pricePerKg} บาท/กก.\n\nยอดรวม: ${sale.grossTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\nหักค่าใช้จ่าย: ${sale.deductions.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\nยอดสุทธิ (NET TOTAL): ${sale.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\n\nสถานะการชำระเงิน: ${sale.paymentStatus === 'PAID' ? 'เงินสด' : 'ค้างชำระ'}\n\nขอขอบคุณที่ใช้บริการ\nนิพนธ์ฟาร์ม`;

    const mailtoLink = `mailto:${sale.buyerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    const a = document.createElement('a');
    a.href = mailtoLink;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 print:bg-white">
      {/* Header */}
      <div className="bg-white px-4 py-6 border-b sticky top-0 z-10 print:hidden">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการขายหมูขุน</h1>
          <button 
            onClick={onAddSale}
            className="bg-emerald-600 text-white p-2 rounded-2xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อผู้ซื้อ หรือ ทะเบียนรถ..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 print:hidden">
        {filteredSales.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg">ยังไม่มีประวัติการขาย</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSales.map(sale => (
              <div key={sale.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      {sale.buyerName}
                      {sale.paymentStatus === 'UNPAID' ? (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">ค้างชำระ</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">จ่ายแล้ว</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{formatDate(sale.date)} • ทะเบียน: {sale.vehicleReg || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {sale.receiptUrl && (
                      <a 
                        href={sale.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors text-xs font-bold"
                        title="ดูใบเสร็จบน Cloud"
                      >
                        <Cloud className="w-4 h-4" /> ดูใบเสร็จ
                      </a>
                    )}
                    <button 
                      onClick={() => handleDownloadPdf(sale)}
                      disabled={isGeneratingPdf === sale.id}
                      className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                      title={sale.receiptUrl ? "ดาวน์โหลด PDF ลงเครื่อง" : "สร้างและอัปโหลดไป Cloud"}
                    >
                      {isGeneratingPdf === sale.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                    {sale.buyerEmail && (
                      <button 
                        onClick={() => handleSendEmail(sale)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="ร่างอีเมลส่งให้ลูกค้า"
                      >
                        <Mail className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => handlePrint(sale)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="พิมพ์ใบเสร็จ"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('คุณต้องการลบรายการขายนี้ใช่หรือไม่?')) {
                          onDeleteSale(sale.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-2xl">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">จำนวน</p>
                    <p className="font-bold text-gray-900">{sale.totalPigs} <span className="text-xs font-normal">ตัว</span></p>
                  </div>
                  <div className="text-center border-l border-r border-slate-200">
                    <p className="text-xs text-gray-500 mb-1">น้ำหนักรวม</p>
                    <p className="font-bold text-gray-900">{sale.totalNetWeight.toFixed(1)} <span className="text-xs font-normal">กก.</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">เฉลี่ย</p>
                    <p className="font-bold text-gray-900">{sale.avgWeight.toFixed(1)} <span className="text-xs font-normal">กก.</span></p>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="text-sm text-gray-500">
                    ราคา: {sale.pricePerKg} บ./กก.
                    {sale.deductions > 0 && <span className="text-red-500 ml-2">(หัก {sale.deductions})</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">ยอดสุทธิ</p>
                    <p className="text-xl font-black text-green-600">
                      ฿{sale.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Print/PDF Area */}
      <div className="absolute top-[-9999px] left-[-9999px] w-[800px] print:static print:w-full print:block">
        {printSale && <SaleReceipt sale={printSale} />}
      </div>
    </div>
  );
}
