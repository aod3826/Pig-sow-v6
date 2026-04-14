import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ExpenseRecord } from '../types';

export function useExpenses(isAuthReady: boolean) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData: ExpenseRecord[] = [];
      snapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() } as ExpenseRecord);
      });
      setExpenses(expensesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const addExpense = async (expenseData: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding expense: ", error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      console.error("Error deleting expense: ", error);
      throw error;
    }
  };

  return { expenses, addExpense, deleteExpense, loading };
}
