import { useState } from 'react';
import { format } from 'date-fns';

interface AddSowProps {
  onAdd: (id: string, breedDate: string) => void;
}

export default function AddSow({ onAdd }: AddSowProps) {
  const [sowId, setSowId] = useState('');
  const [breedDate, setBreedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sowId.trim() || !breedDate) return;
    onAdd(sowId.trim(), new Date(breedDate).toISOString());
    setSowId('');
    setBreedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">เพิ่มแม่หมูใหม่</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="sowId" className="block text-sm font-medium text-gray-700 mb-1">
              รหัสแม่หมู (Sow ID)
            </label>
            <input
              type="text"
              id="sowId"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
              placeholder="เช่น SOW-001"
              value={sowId}
              onChange={(e) => setSowId(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="breedDate" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่ผสมพันธุ์ (Breed Date)
            </label>
            <input
              type="date"
              id="breedDate"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
              value={breedDate}
              onChange={(e) => setBreedDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-pink-700 active:bg-pink-800 transition-colors shadow-md"
          >
            บันทึกข้อมูล
          </button>
        </form>
      </div>
    </div>
  );
}
