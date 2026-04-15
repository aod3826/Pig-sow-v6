import { useState } from 'react';
import { ExpenseRecord, ExpenseCategory } from '../../types';
import { Plus, Search, Trash2, FileText } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface ExpenseListProps {
  expenses: ExpenseRecord[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  'FEED': 'ค่าอาหาร',
  'MEDICINE': 'ค่ายา/วัคซีน',
  'EQUIPMENT': 'ค่าอุปกรณ์',
  'MAINTENANCE': 'ค่าซ่อมบำรุง',
  'UTILITIES': 'ค่าน้ำ/ค่าไฟ',
  'SALARY': 'ค่าจ้างคนงาน',
  'OTHER': 'อื่นๆ'
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'FEED': 'bg-orange-100 text-orange-800',
  'MEDICINE': 'bg-blue-100 text-blue-800',
  'EQUIPMENT': 'bg-purple-100 text-purple-800',
  'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
  'UTILITIES': 'bg-cyan-100 text-cyan-800',
  'SALARY': 'bg-green-100 text-green-800',
  'OTHER': 'bg-gray-100 text-gray-800'
};

export default function ExpenseList({ expenses, onAdd, onDelete }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExpenses = expenses.filter(expense => 
    CATEGORY_LABELS[expense.category].toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.note && expense.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.totalAmount ?? (exp as any).amount ?? 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 shadow-sm z-10 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">ประวัติรายจ่าย</h2>
          <button 
            onClick={onAdd}
            className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            เพิ่มรายจ่าย
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหารายจ่าย, ร้านค้า..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-red-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-red-50 p-4 border-b border-red-100 shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-red-800 font-medium">ยอดรวมรายจ่าย (ที่ค้นหา)</span>
          <span className="text-xl font-bold text-red-600">฿ {totalExpenses.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg">ยังไม่มีประวัติรายจ่าย</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map(expense => {
              const amount = expense.totalAmount ?? (expense as any).amount ?? 0;
              return (
              <div key={expense.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${CATEGORY_COLORS[expense.category]}`}>
                        {CATEGORY_LABELS[expense.category]}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
                    </div>
                    <h3 className="font-bold text-gray-800">{expense.shopName || 'ไม่ระบุร้านค้า'}</h3>
                    {expense.note && (
                      <p className="text-sm text-gray-600 mt-1">{expense.note}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-red-600 text-lg">
                      -฿ {amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                    <button 
                      onClick={() => {
                        if(window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
                          onDelete(expense.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Show items summary if exists */}
                {expense.items && expense.items.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500 bg-slate-50 p-2 rounded-lg">
                    <p className="font-medium text-gray-700 mb-1">รายการสินค้า ({expense.items.length}):</p>
                    <ul className="list-disc list-inside space-y-1">
                      {expense.items.slice(0, 2).map((item, idx) => (
                        <li key={idx}>
                          {item.name} {item.quantity} {item.unit} (฿{item.unitPrice}/{item.unit})
                        </li>
                      ))}
                      {expense.items.length > 2 && (
                        <li className="text-gray-400 italic">...และอีก {expense.items.length - 2} รายการ</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
