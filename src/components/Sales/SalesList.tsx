import { useState } from 'react';
import { SaleRecord } from '../../types';
import { Plus, Search, FileText, Trash2, Printer, Mail, Loader2, ExternalLink } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import SaleReceipt from './SaleReceipt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

  const handleSendEmail = async (sale: SaleRecord) => {
    if (!sale.buyerEmail) return;
    
    setIsGeneratingPdf(sale.id);
    setPrintSale(sale);

    try {
      // Wait for the DOM to update and render the receipt
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const receiptElement = document.getElementById(`receipt-${sale.id}`);
      if (!receiptElement) throw new Error('Receipt element not found');

      const canvas = await html2canvas(receiptElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const fileName = `receipt_${sale.id}.pdf`;
      
      try {
        // Upload to Firebase Storage with timeout
        const storageRef = ref(storage, `receipts/${fileName}`);
        
        // Create a timeout promise (4 seconds)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 4000)
        );
        
        // Race the upload against the timeout
        await Promise.race([
          uploadBytes(storageRef, pdfBlob),
          timeoutPromise
        ]);
        
        const downloadUrl = await getDownloadURL(storageRef);

        // Save URL to database
        await onUpdateSale(sale.id, { receiptUrl: downloadUrl });

        const subject = `ใบสรุปการขายหมูขุน นิพนธุ์ฟาร์ม - ${formatDate(sale.date)}`;
        const body = `เรียน คุณ ${sale.buyerName},\n\nสรุปรายการขายหมูขุน วันที่ ${formatDate(sale.date)}\nทะเบียนรถ: ${sale.vehicleReg || '-'}\n\nจำนวนหมู: ${sale.totalPigs} ตัว\nน้ำหนักสุทธิรวม: ${sale.totalNetWeight.toFixed(1)} กก.\nน้ำหนักเฉลี่ย: ${sale.avgWeight.toFixed(2)} กก./ตัว\nราคาขาย: ${sale.pricePerKg} บาท/กก.\n\nยอดรวม: ${sale.grossTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\nหักค่าใช้จ่าย: ${sale.deductions.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\nยอดสุทธิ (NET TOTAL): ${sale.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\n\nสถานะการชำระเงิน: ${sale.paymentStatus === 'PAID' ? 'ชำระเงินแล้ว' : 'ค้างชำระ'}\n\nสามารถดาวน์โหลดหรือดูใบเสร็จรูปแบบ PDF ได้ที่ลิงก์นี้:\n${downloadUrl}\n\nขอขอบคุณที่ใช้บริการ\nนิพนธุ์ฟาร์ม`;

        // Open email client with link
        const mailtoLink = `mailto:${sale.buyerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const a = document.createElement('a');
        a.href = mailtoLink;
        a.click();
        
      } catch (uploadError: any) {
        console.error('Upload Error:', uploadError);
        
        // Fallback to local download
        pdf.save(`ใบชั่งน้ำหนัก_${sale.buyerName}_${sale.date}.pdf`);
        
        const subject = `ใบสรุปการขายหมูขุน นิพนธุ์ฟาร์ม - ${formatDate(sale.date)}`;
        const body = `เรียน คุณ ${sale.buyerName},\n\nสรุปรายการขายหมูขุน วันที่ ${formatDate(sale.date)}\nทะเบียนรถ: ${sale.vehicleReg || '-'}\n\nจำนวนหมู: ${sale.totalPigs} ตัว\nน้ำหนักสุทธิรวม: ${sale.totalNetWeight.toFixed(1)} กก.\nน้ำหนักเฉลี่ย: ${sale.avgWeight.toFixed(2)} กก./ตัว\nราคาขาย: ${sale.pricePerKg} บาท/กก.\n\nยอดรวม: ${sale.grossTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\nหักค่าใช้จ่าย: ${sale.deductions.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\nยอดสุทธิ (NET TOTAL): ${sale.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\n\nสถานะการชำระเงิน: ${sale.paymentStatus === 'PAID' ? 'ชำระเงินแล้ว' : 'ค้างชำระ'}\n\nขอขอบคุณที่ใช้บริการ\nนิพนธุ์ฟาร์ม`;
        const mailtoLink = `mailto:${sale.buyerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        const a = document.createElement('a');
        a.href = mailtoLink;
        a.click();

        if (uploadError.message === 'STORAGE_TIMEOUT' || uploadError.code?.includes('storage/')) {
          alert('ไม่สามารถอัปโหลดไฟล์ PDF ขึ้นระบบได้ (อาจยังไม่ได้เปิดใช้งาน Firebase Storage)\n\nระบบได้ทำการดาวน์โหลดไฟล์ PDF ลงเครื่องให้แล้ว กรุณาแนบไฟล์นี้ด้วยตัวเองตอนส่งอีเมลครับ');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setIsGeneratingPdf(null);
    }
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
                  <div className="flex items-center">
                    {sale.receiptUrl && (
                      <a 
                        href={sale.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="ดูใบเสร็จ PDF"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    {sale.buyerEmail && (
                      <button 
                        onClick={() => handleSendEmail(sale)}
                        disabled={isGeneratingPdf === sale.id}
                        className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                        title={sale.receiptUrl ? "ส่งอีเมลอีกครั้ง" : "สร้างลิงก์และส่งอีเมล"}
                      >
                        {isGeneratingPdf === sale.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
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
