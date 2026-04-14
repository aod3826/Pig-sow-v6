import { useState } from 'react';
import { ExpenseCategory } from '../../types';
import { X, Save } from 'lucide-react';

interface ExpenseFormProps {
  onSave: (expense: { category: ExpenseCategory; amount: number; date: string; note: string }) => Promise<void>;
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
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    if (!date) {
      alert('กรุณาเลือกวันที่');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        category,
        amount: Number(amount),
        date,
        note
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่รายจ่าย</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (บาท)</label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
              rows={3}
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
          className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
