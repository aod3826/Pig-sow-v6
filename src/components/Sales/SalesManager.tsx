import { useState } from 'react';
import { useSales } from '../../hooks/useSales';
import SalesList from './SalesList';
import SaleForm from './SaleForm';

interface SalesManagerProps {
  isAuthReady: boolean;
}

export default function SalesManager({ isAuthReady }: SalesManagerProps) {
  const { sales, addSale, deleteSale, updateSale, loading } = useSales(isAuthReady);
  const [isAdding, setIsAdding] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  if (isAdding) {
    return (
      <SaleForm 
        sales={sales}
        onSave={addSale} 
        onUpdateAfterSave={updateSale}
        onCancel={() => setIsAdding(false)} 
      />
    );
  }

  return (
    <SalesList 
      sales={sales} 
      onAddSale={() => setIsAdding(true)} 
      onDeleteSale={deleteSale} 
      onUpdateSale={updateSale}
    />
  );
}
