import { SaleRecord } from '../../types';
import { formatDate } from '../../lib/utils';

export default function SaleReceipt({ sale }: { sale: SaleRecord }) {
  return (
    <div className="p-8 w-full" id={`receipt-${sale.id}`} style={{ backgroundColor: '#ffffff', color: '#000000' }}>
      {/* Print Header */}
      <div className="text-center mb-8 border-b-2 pb-4" style={{ borderColor: '#1f2937' }}>
        <h1 className="text-3xl font-bold mb-2">ใบชั่งน้ำหนัก</h1>
        <h2 className="text-xl" style={{ color: '#374151' }}>{sale.sellerName || 'นิพนธุ์ฟาร์ม'}</h2>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 mb-8 text-lg">
        <div><span className="font-semibold">วันที่ขาย:</span> {formatDate(sale.date)}</div>
        <div><span className="font-semibold">ประเภท:</span> {sale.saleType}</div>
        <div><span className="font-semibold">ผู้ซื้อ (Buyer):</span> {sale.buyerName}</div>
        <div><span className="font-semibold">ทะเบียนรถ:</span> {sale.vehicleReg || '-'}</div>
      </div>

      {/* Weighings */}
      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-b-2" style={{ borderColor: '#1f2937' }}>
            <th className="pb-2 font-bold w-16 text-center">อันดับที่</th>
            <th className="pb-2 font-bold px-2 text-right">รวม (กก.)</th>
            <th className="pb-2 font-bold px-2 text-right">- น้ำหนักกรง</th>
            <th className="pb-2 font-bold px-2 text-right">สุทธิ (กก.)</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: '#d1d5db' }}>
          {sale.weighings.map((w, index) => (
            <tr key={w.id}>
              <td className="py-2 text-center">{index + 1}</td>
              <td className="py-2 px-2 text-right">{w.grossWeight.toFixed(1)}</td>
              <td className="py-2 px-2 text-right">{w.tareWeight.toFixed(1)}</td>
              <td className="py-2 px-2 text-right font-bold">{w.netWeight.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 font-bold" style={{ borderColor: '#1f2937' }}>
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
          <p className="mb-1" style={{ color: '#4b5563' }}>หมูทั้งหมดละ</p>
          <p className="text-2xl font-bold">{sale.totalPigs}</p>
        </div>
        <div className="border-l border-r" style={{ borderColor: '#1f2937' }}>
          <p className="mb-1" style={{ color: '#4b5563' }}>นน.สุทธิรวม</p>
          <p className="text-2xl font-bold">{sale.totalNetWeight.toFixed(1)}</p>
        </div>
        <div>
          <p className="mb-1" style={{ color: '#4b5563' }}>เฉลี่ย/ตัว</p>
          <p className="text-2xl font-bold">{sale.avgWeight.toFixed(2)}</p>
        </div>
      </div>

      {/* Financials */}
      <div className="space-y-2 mb-16 text-lg">
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
            <span className="font-bold">{sale.deductions.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
          </div>
        )}
        <div className="flex justify-between text-2xl font-bold mt-4 pt-4 border-t-2" style={{ borderColor: '#1f2937' }}>
          <span>รวมเงินทั้งสิ้น (NET TOTAL):</span>
          <span>{sale.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-32 pt-8 border-t" style={{ borderColor: '#9ca3af' }}>
        <div className="text-center w-48">
          <div className="border-b mb-2" style={{ borderColor: '#1f2937' }}></div>
          <p>ผู้ส่งมอบ / ฟาร์ม</p>
        </div>
        <div className="text-center w-48 flex flex-col items-center relative">
          {sale.paymentStatus === 'UNPAID' && sale.signature ? (
            <img src={sale.signature} alt="Signature" className="h-20 object-contain absolute bottom-full mb-2" />
          ) : null}
          <div className="w-full border-b mb-2" style={{ borderColor: '#1f2937' }}></div>
          <p>ผู้รับ / ผู้ซื้อ</p>
          {sale.paymentStatus === 'UNPAID' && <p className="font-bold mt-1" style={{ color: '#4b5563' }}>(ค้างชำระ)</p>}
          {sale.paymentStatus === 'PAID' && <p className="font-bold mt-1" style={{ color: '#4b5563' }}>(ชำระเงินแล้ว)</p>}
        </div>
      </div>
    </div>
  );
}
