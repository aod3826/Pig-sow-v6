import { useState, FormEvent } from 'react';
import { format } from 'date-fns';

interface AddSowProps {
  onAdd: (id: string, breed: string, birthDate: string, entryDate: string) => void;
}

export default function AddSow({ onAdd }: AddSowProps) {
  const [sowId, setSowId] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sowId.trim() || !entryDate) return;
    onAdd(sowId.trim(), breed.trim(), birthDate ? new Date(birthDate).toISOString() : '', new Date(entryDate).toISOString());
    setSowId('');
    setBreed('');
    setBirthDate('');
    setEntryDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
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
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="เช่น SOW-001"
              value={sowId}
              onChange={(e) => setSowId(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
              สายพันธุ์ (Breed)
            </label>
            <input
              type="text"
              id="breed"
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="เช่น ลาร์จไวท์, แลนด์เรซ"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
              วันเกิด (Birth Date) - ไม่บังคับ
            </label>
            <input
              type="date"
              id="birthDate"
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เข้าเล้า (Entry Date)
            </label>
            <input
              type="date"
              id="entryDate"
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-4 px-4 rounded-full hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-md text-lg"
          >
            บันทึกข้อมูล
          </button>
        </form>
      </div>
    </div>
  );
}
