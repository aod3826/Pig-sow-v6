import { useState, useEffect } from 'react';
import { SaleRecord } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export function useSales(isAuthReady: boolean) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleRecord));
      setSales(salesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sales:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const addSale = async (saleData: Omit<SaleRecord, 'id' | 'createdAt'>) => {
    const newId = crypto.randomUUID();
    const newSale: SaleRecord = {
      ...saleData,
      id: newId,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'sales', newId), newSale);
      return newId;
    } catch (error) {
      console.error("Error adding sale:", error);
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sales', id));
    } catch (error) {
      console.error("Error deleting sale:", error);
      throw error;
    }
  };

  const updateSale = async (id: string, data: Partial<SaleRecord>) => {
    try {
      await setDoc(doc(db, 'sales', id), data, { merge: true });
    } catch (error) {
      console.error("Error updating sale:", error);
      throw error;
    }
  };

  return { sales, addSale, deleteSale, updateSale, loading };
}
