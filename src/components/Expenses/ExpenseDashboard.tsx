import { useState, useMemo } from 'react';
import { ExpenseRecord } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, ShoppingCart } from 'lucide-react';

interface ExpenseDashboardProps {
  expenses: ExpenseRecord[];
}

export default function ExpenseDashboard({ expenses }: ExpenseDashboardProps) {
  const [selectedItem, setSelectedItem] = useState<string>('รำละเอียด');

  // 1. Calculate Monthly Total Expenses
  const monthlyData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(exp => {
      const month = exp.date.substring(0, 7); // YYYY-MM
      const amount = exp.totalAmount ?? (exp as any).amount ?? 0;
      data[month] = (data[month] || 0) + amount;
    });
    
    return Object.entries(data)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses]);

  // 2. Extract unique item names for the dropdown
  const uniqueItems = useMemo(() => {
    const items = new Set<string>();
    expenses.forEach(exp => {
      if (exp.items) {
        exp.items.forEach(item => {
          if (item.name) items.add(item.name);
        });
      }
    });
    return Array.from(items).sort();
  }, [expenses]);

  // 3. Price Comparison Data for selected item
  const priceComparisonData = useMemo(() => {
    const data: any[] = [];
    expenses.forEach(exp => {
      if (exp.items) {
        exp.items.forEach(item => {
          if (item.name === selectedItem) {
            data.push({
              date: exp.date,
              shopName: exp.shopName || 'ไม่ระบุ',
              unitPrice: item.unitPrice,
              unit: item.unit
            });
          }
        });
      }
    });
    return data.sort((a, b) => a.date.localeCompare(b.date));
  }, [expenses, selectedItem]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-4 pb-24 space-y-6">
      
      {/* Monthly Expenses Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-red-500 w-6 h-6" />
          <h2 className="text-lg font-bold text-gray-800">สรุปรายจ่ายรวมรายเดือน</h2>
        </div>
        <div className="h-64 w-full">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `฿${value}`} />
                <Tooltip 
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, 'ยอดรวม']}
                  labelFormatter={(label) => `เดือน: ${label}`}
                  cursor={{ fill: '#fef2f2' }}
                />
                <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">ยังไม่มีข้อมูลรายจ่าย</div>
          )}
        </div>
      </div>

      {/* Price Comparison Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-indigo-500 w-6 h-6" />
            <h2 className="text-lg font-bold text-gray-800">เปรียบเทียบราคาวัตถุดิบ</h2>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">เลือกวัตถุดิบที่ต้องการเปรียบเทียบ</label>
          <select 
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            {uniqueItems.length === 0 && <option value="">ไม่มีข้อมูลวัตถุดิบ</option>}
            {uniqueItems.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="h-64 w-full">
          {priceComparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [`฿${value}/${props.payload.unit}`, props.payload.shopName]}
                  labelFormatter={(label) => `วันที่: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="unitPrice" 
                  name="ราคาต่อหน่วย" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              {uniqueItems.length > 0 ? 'ไม่มีข้อมูลราคาสำหรับวัตถุดิบนี้' : 'กรุณาเพิ่มรายการสินค้าในบิลรายจ่ายก่อน'}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          * กราฟนี้ช่วยให้คุณเห็นแนวโน้มราคาของวัตถุดิบแต่ละชนิดจากร้านต่างๆ เพื่อช่วยในการตัดสินใจซื้อครั้งต่อไป
        </p>
      </div>

    </div>
  );
}
