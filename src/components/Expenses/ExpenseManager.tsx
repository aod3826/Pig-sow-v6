import { useState } from 'react';
import { useExpenses } from '../../hooks/useExpenses';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';
import ExpenseDashboard from './ExpenseDashboard';
import { List, PlusCircle, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ExpenseManagerProps {
  isAuthReady: boolean;
}

export default function ExpenseManager({ isAuthReady }: ExpenseManagerProps) {
  const { expenses, addExpense, deleteExpense, loading } = useExpenses(isAuthReady);
  const [view, setView] = useState<'list' | 'form' | 'dashboard'>('dashboard');

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Top Navigation for Expenses */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-center gap-2 shrink-0">
        <button
          onClick={() => setView('dashboard')}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
            view === 'dashboard' ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
          )}
        >
          <BarChart2 size={20} />
          ภาพรวม
        </button>
        <button
          onClick={() => setView('list')}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
            view === 'list' ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
          )}
        >
          <List size={20} />
          ประวัติ
        </button>
        <button
          onClick={() => setView('form')}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
            view === 'form' ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
          )}
        >
          <PlusCircle size={20} />
          บันทึก
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'dashboard' && <ExpenseDashboard expenses={expenses} />}
        {view === 'list' && (
          <ExpenseList 
            expenses={expenses} 
            onAdd={() => setView('form')} 
            onDelete={deleteExpense} 
          />
        )}
        {view === 'form' && (
          <ExpenseForm 
            onSave={async (data) => {
              await addExpense(data);
              setView('list');
            }} 
            onCancel={() => setView('list')} 
          />
        )}
      </div>
    </div>
  );
}
