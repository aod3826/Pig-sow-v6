import { SaleRecord } from '../../types';
import { formatDate } from '../../lib/utils';

export default function SaleReceipt({ sale }: { sale: SaleRecord }) {
  return (
    <div className="hidden print:block p-8 bg-white w-full text-black">
      {/* Print Header */}
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold mb-2">ใบชั่งน้ำหนัก</h1>
        <h2 className="text-xl text-gray-700">{sale.sellerName || 'นิพนธุ์ฟาร์ม'}</h2>
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
          <tr className="border-b-2 border-gray-800">
            <th className="pb-2 font-bold w-16 text-center">อันดับที่</th>
            <th className="pb-2 font-bold px-2 text-right">รวม (กก.)</th>
            <th className="pb-2 font-bold px-2 text-right">- น้ำหนักกรง</th>
            <th className="pb-2 font-bold px-2 text-right">สุทธิ (กก.)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300">
          {sale.weighings.map((w, index) => (
            <tr key={w.id}>
              <td className="py-2 text-center">{index + 1}</td>
              <td className="py-2 px-2 text-right">{w.grossWeight.toFixed(1)}</td>
              <td className="py-2 px-2 text-right">{w.tareWeight.toFixed(1)}</td>
              <td className="py-2 px-2 text-right font-bold">{w.netWeight.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-gray-800 font-bold">
          <tr>
            <td className="py-2 text-center">นน.รวม</td>
            <td colSpan={2}></td>
            <td className="py-2 px-2 text-right text-xl">{sale.totalNetWeight.toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 text-center mb-8 border-2 border-gray-800 p-4 rounded-xl">
        <div>
          <p className="text-gray-600 mb-1">หมูทั้งหมดละ</p>
          <p className="text-2xl font-bold">{sale.totalPigs}</p>
        </div>
        <div className="border-l border-r border-gray-800">
          <p className="text-gray-600 mb-1">นน.สุทธิรวม</p>
          <p className="text-2xl font-bold">{sale.totalNetWeight.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-gray-600 mb-1">เฉลี่ย/ตัว</p>
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
          <div className="flex justify-between text-red-600">
            <span>หักค่าใช้จ่าย:</span>
            <span className="font-bold">{sale.deductions.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
          </div>
        )}
        <div className="flex justify-between text-2xl font-bold mt-4 pt-4 border-t-2 border-gray-800">
          <span>รวมเงินทั้งสิ้น (NET TOTAL):</span>
          <span>{sale.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-32 pt-8 border-t border-gray-400">
        <div className="text-center w-48">
          <div className="border-b border-gray-800 mb-2"></div>
          <p>ผู้ส่งมอบ / ฟาร์ม</p>
        </div>
        <div className="text-center w-48 flex flex-col items-center relative">
          {sale.paymentStatus === 'UNPAID' && sale.signature ? (
            <img src={sale.signature} alt="Signature" className="h-20 object-contain absolute bottom-full mb-2" />
          ) : null}
          <div className="w-full border-b border-gray-800 mb-2"></div>
          <p>ผู้รับ / ผู้ซื้อ</p>
          {sale.paymentStatus === 'UNPAID' && <p className="font-bold mt-1 text-gray-600">(ค้างชำระ)</p>}
          {sale.paymentStatus === 'PAID' && <p className="font-bold mt-1 text-gray-600">(ชำระเงินแล้ว)</p>}
        </div>
      </div>
    </div>
  );
}
