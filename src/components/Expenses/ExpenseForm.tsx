import { useState, useEffect } from 'react';
import { ExpenseCategory, ExpenseItem } from '../../types';
import { X, Save, ScanLine, Plus, Trash2 } from 'lucide-react';
import { scanReceiptImage } from '../../services/ocrService';

interface ExpenseFormProps {
  onSave: (expense: { 
    category: ExpenseCategory; 
    shopName: string;
    totalAmount: number; 
    date: string; 
    note: string;
    items: ExpenseItem[];
  }) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'FEED', label: 'ค่าอาหาร' },
  { value: 'MEDICINE', label: 'ค่ายา/วัคซีน' },
  { value: 'EQUIPMENT', label: 'ค่าอุปกรณ์' },
  { value: 'MAINTENANCE', label: 'ค่าซ่อมบำรุง' },
  { value: 'UTILITIES', label: 'ค่าน้ำ/ค่าไฟ' },
  { value: 'SALARY', label: 'ค่าจ้างคนงาน' },
  { value: 'OTHER', label: 'อื่นๆ' },
];

export default function ExpenseForm({ onSave, onCancel }: ExpenseFormProps) {
  const [category, setCategory] = useState<ExpenseCategory>('FEED');
  const [shopName, setShopName] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [items, setItems] = useState<Omit<ExpenseItem, 'id'>[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Auto-calculate total amount when items change
  useEffect(() => {
    if (items.length > 0) {
      const sum = items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
      setTotalAmount(sum);
    }
  }, [items]);

  const handleScanBill = async () => {
    try {
      setIsScanning(true);
      // Mock file input
      const mockFile = new File([""], "dummy.jpg", { type: "image/jpeg" });
      const result = await scanReceiptImage(mockFile);
      
      setShopName(result.shopName);
      setTotalAmount(result.totalAmount);
      setDate(result.date);
      setItems(result.items);
      setCategory('FEED'); // Default to feed for OCR mock
      
      alert('AI อ่านข้อมูลบิลสำเร็จ กรุณาตรวจสอบความถูกต้องก่อนบันทึก');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการอ่านบิล');
    } finally {
      setIsScanning(false);
    }
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: 'กก.', unitPrice: 0, totalPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof Omit<ExpenseItem, 'id'>, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto calculate total price if quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) : newItems[index].quantity;
      const price = field === 'unitPrice' ? Number(value) : newItems[index].unitPrice;
      newItems[index].totalPrice = qty * price;
    }
    
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (totalAmount <= 0) {
      alert('กรุณากรอกยอดรวมให้ถูกต้อง');
      return;
    }
    if (!date) {
      alert('กรุณาเลือกวันที่');
      return;
    }

    try {
      setIsSaving(true);
      
      // Add random IDs to items before saving
      const itemsWithIds = items.map(item => ({
        ...item,
        id: crypto.randomUUID()
      }));

      await onSave({
        category,
        shopName: shopName || 'ไม่ระบุร้านค้า',
        totalAmount,
        date,
        note,
        items: itemsWithIds
      });
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 shadow-sm flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold text-gray-800">บันทึกรายจ่าย</h2>
        <button onClick={onCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          
          {/* AI Scan Button */}
          <button
            onClick={handleScanBill}
            disabled={isScanning}
            className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold py-3 px-4 rounded-2xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isScanning ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700"></div>
            ) : (
              <ScanLine size={20} />
            )}
            สแกนบิลด้วย AI (ทดสอบ)
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อร้านค้า</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="เช่น โรงสีเจริญทรัพย์"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">รายการสินค้า</h3>
              <button onClick={addItem} className="text-sm text-red-600 font-medium flex items-center gap-1 hover:text-red-700">
                <Plus size={16} /> เพิ่มรายการ
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative">
                  <button 
                    onClick={() => removeItem(index)}
                    className="absolute -top-2 -right-2 bg-white border border-gray-200 text-red-500 rounded-full p-1 shadow-sm hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12">
                      <input
                        type="text"
                        placeholder="ชื่อสินค้า (เช่น รำละเอียด)"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="จำนวน"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="หน่วย"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="ราคา/หน่วย"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">ยังไม่มีรายการสินค้า (สามารถกรอกแต่ยอดรวมด้านล่างได้)</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ยอดรวมสุทธิ (บาท)</label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none text-xl font-bold text-red-600"
              value={totalAmount || ''}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
            <textarea
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t border-gray-200 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <>
              <Save size={24} />
              บันทึกรายจ่าย
            </>
          )}
        </button>
      </div>
    </div>
  );
}
