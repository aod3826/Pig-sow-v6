import { SaleRecord } from '../../types';
import { formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export default function SaleReceipt({ sale }: { sale: SaleRecord }) {
  return (
    <div className="p-8 w-[800px] mx-auto font-sans" id={`receipt-${sale.id}`} style={{ backgroundColor: '#ffffff', color: '#000000' }}>
      {/* Print Header */}
      <div className="text-center mb-8 border-b-2 pb-4" style={{ borderColor: '#1f2937' }}>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>ใบชั่งน้ำหนัก / INVOICE</h1>
        <h2 className="text-xl font-bold" style={{ color: '#1f2937' }}>นิพนธ์ฟาร์ม</h2>
        <p className="text-base mt-2" style={{ color: '#374151' }}>
          ตำบลโคกชะงาย อำเภอเมือง จังหวัดพัทลุง 93000<br/>
          ติดต่อโทร: 089-8766933
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 mb-8 text-lg" style={{ color: '#000000' }}>
        <div><span className="font-bold">วันที่ขาย:</span> {formatDate(sale.date)}</div>
        <div><span className="font-bold">ประเภท:</span> {sale.saleType}</div>
        <div><span className="font-bold">ผู้ซื้อ (Buyer):</span> {sale.buyerName}</div>
        <div><span className="font-bold">ทะเบียนรถ:</span> {sale.vehicleReg || '-'}</div>
      </div>

      {/* Weighings */}
      <table className="w-full text-left border-collapse mb-8" style={{ color: '#000000' }}>
        <thead>
          <tr className="border-b-2" style={{ borderColor: '#1f2937' }}>
            <th className="pb-2 font-bold w-16 text-center">อันดับที่</th>
            <th className="pb-2 font-bold px-2 text-right">รวม (กก.)</th>
            <th className="pb-2 font-bold px-2 text-right">กรง (กก.)</th>
            <th className="pb-2 font-bold px-2 text-right">สุทธิ (กก.)</th>
          </tr>
        </thead>
        <tbody>
          {sale.weighings.map((w, index) => (
            <tr key={w.id} style={{ borderBottom: '1px solid #d1d5db' }}>
              <td className="py-2 text-center">{index + 1}</td>
              <td className="py-2 px-2 text-right">{w.grossWeight.toFixed(1)}</td>
              <td className="py-2 px-2 text-right">{w.tareWeight.toFixed(1)}</td>
              <td className="py-2 px-2 text-right font-bold">{w.netWeight.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 font-bold" style={{ borderTopWidth: '2px', borderColor: '#1f2937' }}>
          <tr>
            <td className="py-2 text-center">นน.รวม</td>
            <td colSpan={2}></td>
            <td className="py-2 px-2 text-right text-xl">{sale.totalNetWeight.toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 text-center mb-8 border-2 p-4 rounded-2xl" style={{ borderColor: '#1f2937' }}>
        <div>
          <p className="mb-1" style={{ color: '#4b5563' }}>จำนวนสุกร (ตัว)</p>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>{sale.totalPigs}</p>
        </div>
        <div className="border-l border-r" style={{ borderColor: '#1f2937' }}>
          <p className="mb-1" style={{ color: '#4b5563' }}>นน.สุทธิรวม (กก.)</p>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>{sale.totalNetWeight.toFixed(1)}</p>
        </div>
        <div>
          <p className="mb-1" style={{ color: '#4b5563' }}>เฉลี่ย (กก./ตัว)</p>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>{sale.avgWeight.toFixed(2)}</p>
        </div>
      </div>

      {/* Financials */}
      <div className="space-y-2 mb-16 text-lg" style={{ color: '#000000' }}>
        <div className="flex justify-between">
          <span>ราคาขาย:</span>
          <span className="font-bold">{sale.pricePerKg} บาท/กก.</span>
        </div>
        <div className="flex justify-between">
          <span>ยอดรวม:</span>
          <span className="font-bold">{sale.grossTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
        </div>
        {sale.deductions > 0 && (
          <div className="flex justify-between" style={{ color: '#dc2626' }}>
            <span>หักค่าใช้จ่าย:</span>
            <span className="font-bold">-{sale.deductions.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
          </div>
        )}
        <div className="flex justify-between text-2xl font-bold mt-4 pt-4 border-t-2" style={{ borderColor: '#1f2937' }}>
          <span>รวมเงินทั้งสิ้น (NET TOTAL):</span>
          <span>{sale.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-32 pt-8 border-t" style={{ borderColor: '#9ca3af' }}>
        <div className="text-center w-48 relative flex flex-col items-center justify-end h-24">
          <div className="mt-auto border-b w-full mb-2" style={{ borderColor: '#1f2937' }}></div>
          <p className="font-bold" style={{ color: '#000000' }}>ผู้ส่งมอบ / ฟาร์ม</p>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>( นิพนธ์ฟาร์ม )</p>
        </div>
        <div className="text-center w-48 relative flex flex-col items-center justify-end h-24">
          {sale.signature ? (
            <img src={sale.signature} alt="Signature" className="h-16 object-contain mix-blend-multiply mb-1" />
          ) : (
            <div className="h-16 mb-1"></div>
          )}
          <div className="border-b w-full mb-2" style={{ borderColor: '#1f2937' }}></div>
          <p className="font-bold" style={{ color: '#000000' }}>ผู้รับสุกร / ผู้ซื้อ</p>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>( {sale.buyerName} )</p>
          {sale.paymentStatus === 'UNPAID' && <p className="font-bold mt-1" style={{ color: '#dc2626' }}>ค้างชำระ</p>}
        </div>
      </div>
      
      <div className="mt-12 text-center text-[11px] border-t pt-4" style={{ borderColor: '#f3f4f6', color: '#9ca3af' }}>
        ออกเอกสารเมื่อ: {format(new Date(), 'dd/MM/yyyy HH:mm')}
      </div>
    </div>
  );
}
