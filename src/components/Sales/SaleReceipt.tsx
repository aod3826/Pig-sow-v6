import { SaleRecord, WeighingRecord } from '../../types';
import { formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export default function SaleReceipt({ sale }: { sale: SaleRecord }) {
  // Decide column layout: 2 columns if more than 15 items to save space
  const isMultiColumn = sale.weighings.length > 15;
  const halfLength = Math.ceil(sale.weighings.length / 2);
  const firstCol = isMultiColumn ? sale.weighings.slice(0, halfLength) : sale.weighings;
  const secondCol = isMultiColumn ? sale.weighings.slice(halfLength) : [];

  const WeighingTable = ({ data, startIndex }: { data: WeighingRecord[], startIndex: number }) => (
    <table className="w-full text-[12px] sm:text-sm text-left border-collapse">
      <thead>
        <tr className="border-b-2 border-black">
          <th className="py-1 px-1 font-bold w-12 text-center">ตัวที่</th>
          <th className="py-1 px-1 font-bold text-right">รวม (กก.)</th>
          <th className="py-1 px-1 font-bold text-right">กรง (กก.)</th>
          <th className="py-1 px-1 font-bold text-right">สุทธิ (กก.)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-300">
        {data.map((w, index) => (
          <tr key={w.id} className="hover:bg-gray-50">
            <td className="py-1 px-1 text-center font-medium text-gray-600">{startIndex + index + 1}</td>
            <td className="py-1 px-1 text-right">{w.grossWeight.toFixed(1)}</td>
            <td className="py-1 px-1 text-right">{w.tareWeight.toFixed(1)}</td>
            <td className="py-1 px-1 text-right font-bold">{w.netWeight.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-4 sm:p-8 w-full max-w-[800px] mx-auto bg-white text-black font-sans print:p-0" id={`receipt-${sale.id}`}>
      {/* Print Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black mb-1">นิพนธ์ฟาร์ม</h1>
        <p className="text-sm text-gray-800">ตำบลโคกชะงาย อำเภอเมือง จังหวัดพัทลุง 93000</p>
        <p className="text-sm font-medium mt-1">ติดต่อโทร: 089-8766933</p>
        
        <div className="mt-4 border-y-2 border-black inline-block px-8 py-1.5">
          <h2 className="text-xl font-bold tracking-wide">ใบชั่งน้ำหนัก / INVOICE</h2>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-b-2 border-black pb-4 mb-4 text-sm">
        <div className="flex"><span className="font-bold w-24 shrink-0">วันที่:</span> <span>{formatDate(sale.date)}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">เลขอ้างอิง:</span> <span className="uppercase">{sale.id.slice(0, 8)}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">ชื่อลูกค้า:</span> <span>{sale.buyerName}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">ทะเบียนรถ:</span> <span>{sale.vehicleReg || '-'}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">รูปแบบการขาย:</span> <span>{sale.saleType}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">สถานะชำระ:</span> <span className="font-bold">{sale.paymentStatus === 'PAID' ? 'เงินสด' : 'ค้างชำระ'}</span></div>
      </div>

      {/* Weighing Tables */}
      <div className={`mb-6 ${isMultiColumn ? 'grid grid-cols-2 gap-8' : ''}`}>
        <div>
          <WeighingTable data={firstCol} startIndex={0} />
        </div>
        {isMultiColumn && (
          <div>
            <WeighingTable data={secondCol} startIndex={halfLength} />
          </div>
        )}
      </div>

      {/* Summary and Financials */}
      <div className="grid grid-cols-5 gap-6 mb-6 pt-4 border-t-2 border-black">
        {/* Pigs Summary */}
        <div className="col-span-2">
          <div className="border border-black rounded-lg p-3 text-center bg-gray-50/50">
            <h3 className="font-bold mb-2 pb-1 border-b border-black text-sm">สรุปยอดชั่งน้ำหนัก</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">จำนวน (ตัว)</p>
                <p className="font-bold text-lg">{sale.totalPigs}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">น้ำหนักรวม (กก.)</p>
                <p className="font-bold text-lg text-green-700">{sale.totalNetWeight.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">เฉลี่ย (กก./ตัว)</p>
                <p className="font-bold text-lg">{sale.avgWeight.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="col-span-3 space-y-1 text-sm bg-white p-2">
          <div className="flex justify-between items-center">
            <span className="w-32 text-gray-600">ราคาขาย (บาท/กก.):</span> 
            <span className="font-bold text-right">{sale.pricePerKg.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="w-32 text-gray-600">ยอดรวม (บาท):</span> 
            <span className="font-bold text-right">{sale.grossTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
          </div>
          {sale.deductions > 0 && (
            <div className="flex justify-between items-center text-red-600">
              <span className="w-32">หักค่าใช้จ่าย (บาท):</span> 
              <span className="font-bold text-right">-{sale.deductions.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t-2 border-black mt-2 pt-2">
            <span className="font-bold text-lg w-32">สุทธิ (NET) บาท:</span> 
            <span className="font-black text-xl text-right">{sale.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-16 mt-20 pt-4 px-8">
        <div className="text-center relative">
          <div className="border-b border-black w-48 mx-auto mb-2"></div>
          <p className="text-sm font-bold">ผู้ส่งมอบ / ผู้ขาย</p>
          <p className="text-xs text-gray-500 mt-1">( นิพนธ์ฟาร์ม )</p>
        </div>
        
        <div className="text-center relative">
          {sale.signature && (
             <img 
               src={sale.signature} 
               alt="Signature" 
               className="h-16 object-contain absolute bottom-12 left-1/2 -translate-x-1/2 mix-blend-multiply" 
             />
          )}
          <div className="border-b border-black w-48 mx-auto mb-2"></div>
          <p className="text-sm font-bold">ผู้รับสุกร / ผู้ซื้อ</p>
          <p className="text-xs text-gray-500 mt-1">( {sale.buyerName} )</p>
          {sale.paymentStatus === 'UNPAID' && (
            <p className="text-[10px] font-bold text-red-600 mt-1 border border-red-200 inline-block px-2 rounded">ค้างชำระ</p>
          )}
        </div>
      </div>
      
      {/* Footer Text */}
      <div className="mt-12 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-2">
        ออกเอกสารเมื่อ: {format(new Date(), 'dd/MM/yyyy HH:mm')} | พิมพ์จากระบบฟาร์มสุกรอัจฉริยะ (Smart Farm Management)
      </div>
    </div>
  );
}
