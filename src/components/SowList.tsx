import { Sow } from '../types';
import { STATUS_LABELS } from '../lib/cycleEngine';
import { cn } from '../lib/utils';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';

interface SowListProps {
  sows: Sow[];
  onSelectSow: (id: string) => void;
}

export default function SowList({ sows, onSelectSow }: SowListProps) {
  const [search, setSearch] = useState('');

  const filteredSows = sows.filter(s => s.id.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (status: Sow['status']) => {
    switch (status) {
      case 'IDLE': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'BRED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PREGNANT': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PREPARING': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'NURSING': return 'bg-green-50 text-green-700 border-green-200';
      case 'CULL_SUGGESTED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
          placeholder="ค้นหารหัสแม่หมู..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3 pb-4">
        {filteredSows.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            ไม่พบข้อมูลแม่หมู
          </div>
        ) : (
          filteredSows.map(sow => (
            <div 
              key={sow.id}
              onClick={() => onSelectSow(sow.id)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="font-bold text-lg text-gray-900">{sow.id}</h3>
                <div className="flex gap-2 mt-1">
                  <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-md border", getStatusColor(sow.status))}>
                    {STATUS_LABELS[sow.status]}
                  </span>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-md border bg-gray-50 text-gray-600 border-gray-200">
                    รอบที่ {sow.parity || 1}
                  </span>
                </div>
              </div>
              <ChevronRight className="text-gray-400" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
