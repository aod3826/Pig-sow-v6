import { Sow } from '../types';
import { STATUS_LABELS } from '../lib/cycleEngine';
import { cn, formatDate } from '../lib/utils';
import { ChevronRight, Search, Calendar, Download, Filter, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import { exportSowsToCSV } from '../lib/export';

interface SowListProps {
  sows: Sow[];
  onSelectSow: (id: string) => void;
}

export default function SowList({ sows, onSelectSow }: SowListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('ID_ASC');

  // 1. Filter by Search
  let processedSows = sows.filter(s => s.id.toLowerCase().includes(search.toLowerCase()));

  // 2. Filter by Status
  if (filterStatus !== 'ALL') {
    processedSows = processedSows.filter(s => s.status === filterStatus);
  }

  // 3. Sort
  processedSows.sort((a, b) => {
    switch (sortBy) {
      case 'ID_ASC': return a.id.localeCompare(b.id);
      case 'ID_DESC': return b.id.localeCompare(a.id);
      case 'PARITY_ASC': return (a.parity || 1) - (b.parity || 1);
      case 'PARITY_DESC': return (b.parity || 1) - (a.parity || 1);
      case 'ENTRY_DATE_ASC': return new Date(a.entryDate || 0).getTime() - new Date(b.entryDate || 0).getTime();
      case 'ENTRY_DATE_DESC': return new Date(b.entryDate || 0).getTime() - new Date(a.entryDate || 0).getTime();
      default: return 0;
    }
  });

  const getStatusColor = (status: Sow['status']) => {
    switch (status) {
      case 'IDLE': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'BRED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PREGNANT': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PREPARING': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'NURSING': return 'bg-green-50 text-green-700 border-green-200';
      case 'CULL_SUGGESTED': return 'bg-red-50 text-red-700 border-red-200';
      case 'CULLED': return 'bg-gray-800 text-white border-gray-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
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
        <button 
          onClick={() => exportSowsToCSV(sows)}
          className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"
          title="ส่งออกข้อมูล (CSV)"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">สถานะทั้งหมด</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
          </div>
          <select
            className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm appearance-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="ID_ASC">รหัส (A-Z)</option>
            <option value="ID_DESC">รหัส (Z-A)</option>
            <option value="PARITY_DESC">รอบผลิต (มากไปน้อย)</option>
            <option value="PARITY_ASC">รอบผลิต (น้อยไปมาก)</option>
            <option value="ENTRY_DATE_DESC">เข้าเล้า (ใหม่สุด)</option>
            <option value="ENTRY_DATE_ASC">เข้าเล้า (เก่าสุด)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 pb-4">
        {processedSows.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            ไม่พบข้อมูลแม่หมู
          </div>
        ) : (
          processedSows.map(sow => (
            <div 
              key={sow.id}
              onClick={() => onSelectSow(sow.id)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="font-bold text-lg text-gray-900">{sow.id}</h3>
                <div className="flex gap-2 mt-1 mb-2">
                  <span className={cn("inline-block px-2 py-1 text-xs font-medium rounded-md border", getStatusColor(sow.status))}>
                    {STATUS_LABELS[sow.status]}
                  </span>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-md border bg-gray-50 text-gray-600 border-gray-200">
                    รอบที่ {Math.min((sow.parity ?? 0) + 1, 7)}/7
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>เข้าเล้า: {formatDate(sow.entryDate)}</span>
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
