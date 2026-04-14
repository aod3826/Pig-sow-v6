import { useState } from 'react';
import { useExpenses } from '../../hooks/useExpenses';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';

interface ExpenseManagerProps {
  isAuthReady: boolean;
}

export default function ExpenseManager({ isAuthReady }: ExpenseManagerProps) {
  const { expenses, addExpense, deleteExpense, loading } = useExpenses(isAuthReady);
  const [view, setView] = useState<'list' | 'form'>('list');

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50">
      {view === 'list' ? (
        <ExpenseList 
          expenses={expenses} 
          onAdd={() => setView('form')} 
          onDelete={deleteExpense} 
        />
      ) : (
        <ExpenseForm 
          onSave={async (data) => {
            await addExpense(data);
            setView('list');
          }} 
          onCancel={() => setView('list')} 
        />
      )}
    </div>
  );
}
