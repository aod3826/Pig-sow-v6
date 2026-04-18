import { useEffect, useState } from 'react';
import { SaleRecord, WeighingRecord } from '../../types';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, List, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import SignaturePad from './SignaturePad';

interface SaleFormProps {
  sales?: SaleRecord[];
  onSave: (data: Omit<SaleRecord, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function SaleForm({ sales = [], onSave, onCancel }: SaleFormProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [sellerName, setSellerName] = useState('นิพนธุ์');
  const [vehicleReg, setVehicleReg] = useState('');
  const [saleType, setSaleType] = useState('ขายเหมา');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [totalPigsInput, setTotalPigsInput] = useState<number | ''>('');
  const [pricePerKg, setPricePerKg] = useState<number | ''>('');
  const [deductions, setDeductions] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('PAID');
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'INFO' | 'WEIGHING' | 'PAYMENT'>('INFO');
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD');

  const [weighings, setWeighings] = useState<Partial<WeighingRecord>[]>([
    { id: crypto.randomUUID(), grossWeight: undefined, tareWeight: undefined }
  ]);

  const [isSaving, setIsSaving] = useState(false);

  // Auto-update total pigs when weighings change
  useEffect(() => {
    setTotalPigsInput(weighings.length);
  }, [weighings.length]);

  const handleBuyerChange = (name: string) => {
    setBuyerName(name);
    // Find previous sale by this buyer
    const pastSale = sales.find(s => s.buyerName === name && (s.vehicleReg || s.buyerEmail));
    if (pastSale) {
      if (!vehicleReg && pastSale.vehicleReg) setVehicleReg(pastSale.vehicleReg);
      if (!buyerEmail && pastSale.buyerEmail) setBuyerEmail(pastSale.buyerEmail);
    }
  };

  // Calculations
  const processedWeighings = weighings.map(w => {
    const grossWeight = Number(w.grossWeight) || 0;
    const tareWeight = Number(w.tareWeight) || 0;
    const netWeight = Math.max(0, grossWeight - tareWeight);
    return { ...w, grossWeight, tareWeight, netWeight };
  });

  const totalNetWeight = processedWeighings.reduce((sum, w) => sum + w.netWeight, 0);
  const totalPigs = Number(totalPigsInput) || 0;
  const avgWeight = totalPigs > 0 ? totalNetWeight / totalPigs : 0;
  
  const grossTotal = totalNetWeight * (Number(pricePerKg) || 0);
  const netTotal = grossTotal - (Number(deductions) || 0);

  const handleAddRow = () => {
    const lastTareWeight = weighings[0]?.tareWeight;
    setWeighings([
      { id: crypto.randomUUID(), grossWeight: undefined, tareWeight: lastTareWeight },
      ...weighings
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (weighings.length > 1) {
      setWeighings(weighings.filter(w => w.id !== id));
    }
  };

  const handleChangeRow = (id: string, field: keyof WeighingRecord, value: string) => {
    setWeighings(weighings.map(w => w.id === id ? { ...w, [field]: value === '' ? undefined : Number(value) } : w));
  };

  const handleSubmit = async () => {
    const validWeighings = processedWeighings.filter(w => w.grossWeight > 0);

    if (!buyerName || !date || validWeighings.length === 0 || !totalPigsInput) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อผู้ซื้อ, วันที่, จำนวนหมูทั้งหมด, และน้ำหนักรวมอย่างน้อย 1 รายการ)');
      return;
    }

    if (paymentStatus === 'UNPAID' && !signature) {
      alert('กรุณาให้ผู้ซื้อเซ็นชื่อสำหรับรายการค้างชำระ');
      setShowSignaturePad(true);
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        buyerName,
        buyerEmail,
        sellerName,
        vehicleReg,
        saleType,
        date,
        weighings: validWeighings as WeighingRecord[],
        totalPigs,
        totalNetWeight,
        avgWeight,
        pricePerKg: Number(pricePerKg) || 0,
        grossTotal,
        deductions: Number(deductions) || 0,
        netTotal,
        paymentStatus,
        signature: signature || undefined
      });
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b flex items-center justify-between sticky top-0 z-30">
        <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-gray-100 flex items-center gap-1">
          <ArrowLeft className="w-7 h-7 text-gray-700" />
          <span className="font-medium text-gray-700 text-base">ยกเลิก</span>
        </button>
        <h2 className="text-xl font-bold text-gray-900">บันทึกการขาย</h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white px-4 py-3 border-b flex justify-between items-center sticky top-[61px] z-20 shadow-sm">
        <button onClick={() => setActiveTab('INFO')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${activeTab === 'INFO' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${activeTab === 'INFO' ? 'bg-emerald-100' : 'bg-gray-100'}`}>1</div>
          <span className="text-xs font-bold">ข้อมูล</span>
        </button>
        <div className="h-px bg-gray-200 flex-1 mx-1"></div>
        <button onClick={() => setActiveTab('WEIGHING')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${activeTab === 'WEIGHING' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${activeTab === 'WEIGHING' ? 'bg-emerald-100' : 'bg-gray-100'}`}>2</div>
          <span className="text-xs font-bold">ชั่งน้ำหนัก</span>
        </button>
        <div className="h-px bg-gray-200 flex-1 mx-1"></div>
        <button onClick={() => setActiveTab('PAYMENT')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${activeTab === 'PAYMENT' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${activeTab === 'PAYMENT' ? 'bg-emerald-100' : 'bg-gray-100'}`}>3</div>
          <span className="text-xs font-bold">สรุปยอด</span>
        </button>
      </div>

      <div className="p-4 pb-32">
        
        {/* Tab 1: INFO */}
        <div className={activeTab === 'INFO' ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ข้อมูลทั่วไป</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ขาย</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none print:border-none print:p-0 print:font-bold print:text-lg"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ซื้อ (Buyer)</label>
              <input 
                type="text" 
                list="buyer-names"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none print:border-none print:p-0 print:font-bold print:text-lg"
                value={buyerName}
                onChange={e => handleBuyerChange(e.target.value)}
                placeholder="ระบุชื่อผู้ซื้อ"
              />
              <datalist id="buyer-names">
                {Array.from(new Set(sales.map(s => s.buyerName))).map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลผู้ซื้อ (Gmail)</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none print:border-none print:p-0 print:font-bold print:text-lg"
                value={buyerEmail}
                onChange={e => setBuyerEmail(e.target.value)}
                placeholder="example@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ขาย (Seller)</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none print:border-none print:p-0 print:font-bold print:text-lg"
                value={sellerName}
                onChange={e => setSellerName(e.target.value)}
                placeholder="นิพนธุ์ฟาร์ม"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ทะเบียนรถ</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none print:border-none print:p-0 print:font-bold print:text-lg"
                value={vehicleReg}
                onChange={e => setVehicleReg(e.target.value)}
                placeholder="ระบุทะเบียนรถ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select 
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none print:border-none print:p-0 print:font-bold print:text-lg appearance-none bg-white"
                value={saleType}
                onChange={e => setSaleType(e.target.value)}
              >
                <option value="ขายเหมา">ขายเหมา</option>
                <option value="ขายชั่งกิโล">ขายชั่งกิโล</option>
                <option value="หมูปลด">หมูปลด</option>
              </select>
            </div>
          </div>
          </div>
        </div>

        {/* Tab 2: WEIGHING */}
        <div className={activeTab === 'WEIGHING' ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">รายการชั่งน้ำหนัก</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode(viewMode === 'CARD' ? 'TABLE' : 'CARD')} 
                  className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  title="เปลี่ยนมุมมอง"
                >
                  {viewMode === 'CARD' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                </button>
                <button 
                  onClick={handleAddRow}
                  className="flex items-center gap-1 bg-emerald-100 text-emerald-700 font-bold hover:bg-emerald-200 px-4 py-2 rounded-full transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" /> เพิ่ม
                </button>
              </div>
            </div>

            {viewMode === 'TABLE' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-gray-600 text-sm">
                      <th className="pb-3 font-medium w-12 text-center">ที่</th>
                      <th className="pb-3 font-medium px-1 text-right">รวม(กก.)</th>
                      <th className="pb-3 font-medium px-1 text-right">-กรง</th>
                      <th className="pb-3 font-medium px-1 text-right text-emerald-600">สุทธิ</th>
                      <th className="pb-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processedWeighings.map((w, index) => {
                      const displayIndex = weighings.length - index;
                      return (
                      <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-center font-medium text-gray-500">{displayIndex}</td>
                        <td className="py-3 px-1">
                          <input 
                            type="number" min="0" step="0.1"
                            autoFocus={index === 0 && weighings.length > 1}
                            className="w-full text-right px-2 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                            value={w.grossWeight || ''}
                            onChange={e => handleChangeRow(w.id!, 'grossWeight', e.target.value)}
                            placeholder="0.0"
                          />
                        </td>
                        <td className="py-3 px-1">
                          <input 
                            type="number" min="0" step="0.1"
                            className="w-full text-right px-2 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                            value={w.tareWeight || ''}
                            onChange={e => handleChangeRow(w.id!, 'tareWeight', e.target.value)}
                            placeholder="0.0"
                          />
                        </td>
                        <td className="py-3 px-1 text-right font-bold text-emerald-600 text-lg">
                          {w.netWeight.toFixed(1)}
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => handleRemoveRow(w.id!)}
                            disabled={weighings.length === 1}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <tr>
                      <td className="py-4 text-center text-gray-700">รวม</td>
                      <td colSpan={2}></td>
                      <td className="py-4 px-1 text-right text-xl text-emerald-600">{totalNetWeight.toFixed(1)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
              {processedWeighings.map((w, index) => {
                const displayIndex = weighings.length - index;
                return (
                  <div key={w.id} className="bg-slate-50 p-5 rounded-3xl border border-gray-200 shadow-sm relative">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-700 bg-white px-4 py-1.5 rounded-full text-sm border border-gray-200 shadow-sm">
                        ชั่งครั้งที่ {displayIndex}
                      </span>
                      <button 
                        onClick={() => handleRemoveRow(w.id!)}
                        disabled={weighings.length === 1}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1 text-center">น้ำหนักรวม (กก.)</label>
                        <input 
                          type="number" min="0" step="0.1"
                          autoFocus={index === 0 && weighings.length > 1}
                          className="w-full text-center px-2 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-2xl font-bold bg-white shadow-inner"
                          value={w.grossWeight || ''}
                          onChange={e => handleChangeRow(w.id!, 'grossWeight', e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1 text-center">หักกรง (กก.)</label>
                        <input 
                          type="number" min="0" step="0.1"
                          className="w-full text-center px-2 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-2xl font-bold bg-white shadow-inner"
                          value={w.tareWeight || ''}
                          onChange={e => handleChangeRow(w.id!, 'tareWeight', e.target.value)}
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                      <span className="text-base font-bold text-gray-600">น้ำหนักสุทธิ</span>
                      <span className="text-3xl font-black text-emerald-600">{w.netWeight.toFixed(1)} <span className="text-lg font-bold">กก.</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
            
            {/* Total Net Weight Summary at the bottom of the list */}
            {viewMode === 'CARD' && (
              <div className="mt-6 bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex justify-between items-center shadow-sm">
                 <span className="font-bold text-emerald-800 text-lg">น้ำหนักสุทธิรวม</span>
                 <span className="text-3xl font-black text-emerald-600">{totalNetWeight.toFixed(1)} กก.</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab 3: PAYMENT */}
        <div className={activeTab === 'PAYMENT' ? 'block space-y-6' : 'hidden'}>
          {/* Summary */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">สรุปรายการ (Summary)</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">จำนวนหมู (ตัว)</p>
                <input 
                  type="number" min="1"
                  className="w-24 text-center mx-auto px-2 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-bold"
                  value={totalPigsInput}
                  onChange={e => setTotalPigsInput(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                />
              </div>
              <div className="border-l border-r border-slate-200">
                <p className="text-sm text-gray-500 mb-1">นน.สุทธิรวม</p>
                <p className="text-2xl font-bold text-gray-900 py-2">{totalNetWeight.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">เฉลี่ย/ตัว</p>
                <p className="text-2xl font-bold text-gray-900 py-2">{avgWeight.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">ราคาขาย:</span>
                <input 
                  type="number" min="0" step="0.5"
                  className="w-32 text-right px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold"
                  value={pricePerKg}
                  onChange={e => setPricePerKg(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">ยอดรวม (บาท)</span>
                <span className="text-xl font-bold text-gray-900">{grossTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">หักค่าใช้จ่าย (ถ้ามี)</span>
                <input 
                  type="number" min="0"
                  className="w-32 text-right px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-lg text-red-600 font-bold"
                  value={deductions}
                  onChange={e => setDeductions(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                />
              </div>
              <div className="pt-4 border-t border-slate-200 flex flex-col items-center bg-green-500 text-white rounded-2xl p-4">
                <span className="text-sm font-medium mb-1">รวมเงินทั้งสิ้น (NET TOTAL)</span>
                <span className="text-4xl font-black">{netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-normal">บาท</span></span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">สถานะการชำระเงิน</h3>
            <div className="flex gap-4">
              <button
                onClick={() => { setPaymentStatus('PAID'); setSignature(null); }}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                  paymentStatus === 'PAID' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50/50'
                }`}
              >
                <CheckCircle2 className={paymentStatus === 'PAID' ? 'text-green-500' : 'text-gray-400'} />
                จ่ายแล้ว
              </button>
              <button
                onClick={() => { setPaymentStatus('UNPAID'); if (!signature) setShowSignaturePad(true); }}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                  paymentStatus === 'UNPAID' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-200 text-gray-500 hover:border-orange-200 hover:bg-orange-50/50'
                }`}
              >
                <AlertCircle className={paymentStatus === 'UNPAID' ? 'text-orange-500' : 'text-gray-400'} />
                ค้างชำระ
              </button>
            </div>

            {paymentStatus === 'UNPAID' && (
              <div className="mt-6 p-4 border-2 border-dashed border-orange-200 rounded-2xl bg-orange-50/30 flex flex-col items-center justify-center">
                {signature ? (
                  <div className="w-full flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-2">ลายเซ็นผู้ซื้อ:</p>
                    <img src={signature} alt="Signature" className="h-32 object-contain bg-white border rounded-lg mb-3 w-full max-w-xs" />
                    <button 
                      onClick={() => setShowSignaturePad(true)}
                      className="text-sm text-orange-600 font-medium hover:underline"
                    >
                      เซ็นใหม่
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowSignaturePad(true)}
                    className="py-3 px-6 bg-orange-100 text-orange-700 font-bold rounded-2xl hover:bg-orange-200 transition-colors"
                  >
                    คลิกเพื่อเซ็นชื่อผู้ค้างชำระ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-3 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {activeTab === 'INFO' && (
          <button 
            onClick={() => setActiveTab('WEIGHING')} 
            className="w-full bg-gradient-to-r from-[#E91E63] to-[#F06292] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            ต่อไป: ชั่งน้ำหนัก <ChevronRight className="w-6 h-6" />
          </button>
        )}
        {activeTab === 'WEIGHING' && (
          <>
            <button 
              onClick={() => setActiveTab('INFO')} 
              className="w-1/3 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" /> กลับ
            </button>
            <button 
              onClick={() => setActiveTab('PAYMENT')} 
              className="w-2/3 bg-gradient-to-r from-[#E91E63] to-[#F06292] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              ต่อไป: สรุปยอด <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        {activeTab === 'PAYMENT' && (
          <>
            <button 
              onClick={() => setActiveTab('WEIGHING')} 
              className="w-1/3 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" /> กลับ
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-2/3 bg-gradient-to-r from-[#E91E63] to-[#F06292] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
            >
              <Save className="w-6 h-6" /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกการขาย'}
            </button>
          </>
        )}
      </div>

        {showSignaturePad && (
          <SignaturePad 
            onSave={(sig) => {
              setSignature(sig);
              setShowSignaturePad(false);
            }}
            onCancel={() => {
              setShowSignaturePad(false);
              if (!signature) setPaymentStatus('PAID'); // Revert if cancelled and no signature
            }}
          />
        )}
    </div>
  );
}
