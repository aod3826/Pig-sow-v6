import { useState, useMemo } from 'react';
import { useSales } from '../../hooks/useSales';
import { useExpenses } from '../../hooks/useExpenses';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

interface FinancialReportProps {
  isAuthReady: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  'FEED': 'ค่าอาหาร',
  'MEDICINE': 'ค่ายา/วัคซีน',
  'EQUIPMENT': 'ค่าอุปกรณ์',
  'MAINTENANCE': 'ค่าซ่อมบำรุง',
  'UTILITIES': 'ค่าน้ำ/ค่าไฟ',
  'SALARY': 'ค่าจ้างคนงาน',
  'OTHER': 'อื่นๆ'
};

const COLORS = ['#E91E63', '#10B981', '#F06292', '#34D399', '#F48FB1', '#059669', '#F8BBD0', '#6EE7B7'];

export default function FinancialReport({ isAuthReady }: FinancialReportProps) {
  const { sales, loading: salesLoading } = useSales(isAuthReady);
  const { expenses, loading: expensesLoading } = useExpenses(isAuthReady);
  const [timeRange, setTimeRange] = useState<'all' | 'thisMonth' | 'thisYear'>('all');

  const loading = salesLoading || expensesLoading;

  const filteredData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filteredSales = sales.filter(sale => {
      if (timeRange === 'all') return true;
      const date = parseISO(sale.date);
      if (timeRange === 'thisMonth') return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      if (timeRange === 'thisYear') return date.getFullYear() === currentYear;
      return true;
    });

    const filteredExpenses = expenses.filter(expense => {
      if (timeRange === 'all') return true;
      const date = parseISO(expense.date);
      if (timeRange === 'thisMonth') return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      if (timeRange === 'thisYear') return date.getFullYear() === currentYear;
      return true;
    });

    return { filteredSales, filteredExpenses };
  }, [sales, expenses, timeRange]);

  const { totalIncome, totalExpense, profit } = useMemo(() => {
    const income = filteredData.filteredSales.reduce((sum, sale) => sum + sale.netTotal, 0);
    const expense = filteredData.filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      profit: income - expense
    };
  }, [filteredData]);

  const monthlyData = useMemo(() => {
    const dataMap: Record<string, { name: string; income: number; expense: number; sortKey: string }> = {};

    filteredData.filteredSales.forEach(sale => {
      const date = parseISO(sale.date);
      const key = format(date, 'yyyy-MM');
      if (!dataMap[key]) {
        dataMap[key] = { name: format(date, 'MMM yy', { locale: th }), income: 0, expense: 0, sortKey: key };
      }
      dataMap[key].income += sale.netTotal;
    });

    filteredData.filteredExpenses.forEach(expense => {
      const date = parseISO(expense.date);
      const key = format(date, 'yyyy-MM');
      if (!dataMap[key]) {
        dataMap[key] = { name: format(date, 'MMM yy', { locale: th }), income: 0, expense: 0, sortKey: key };
      }
      dataMap[key].expense += expense.amount;
    });

    return Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredData]);

  const expensePieData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    filteredData.filteredExpenses.forEach(expense => {
      const label = CATEGORY_LABELS[expense.category] || expense.category;
      dataMap[label] = (dataMap[label] || 0) + expense.amount;
    });
    return Object.entries(dataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 shadow-sm z-10 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">รายงานผลประกอบการ</h2>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setTimeRange('thisMonth')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === 'thisMonth' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
          >
            เดือนนี้
          </button>
          <button 
            onClick={() => setTimeRange('thisYear')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === 'thisYear' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
          >
            ปีนี้
          </button>
          <button 
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">รายรับรวม</p>
              <p className="text-xl font-bold text-gray-900">฿ {totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">รายจ่ายรวม</p>
              <p className="text-xl font-bold text-gray-900">฿ {totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${profit >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">กำไรสุทธิ</p>
              <p className={`text-xl font-bold ${profit >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                ฿ {profit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">รายรับ - รายจ่าย (รายเดือน)</h3>
          <div className="h-64 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `฿${(val/1000)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`฿ ${value.toLocaleString('th-TH')}`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">ไม่มีข้อมูลในช่างเวลานี้</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">สัดส่วนรายจ่าย</h3>
          <div className="h-64 w-full">
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`฿ ${value.toLocaleString('th-TH')}`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">ไม่มีข้อมูลรายจ่าย</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
