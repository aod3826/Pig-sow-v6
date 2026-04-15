import { Sow } from '../types';
import { STATUS_LABELS, getUpcomingTasksForSow, EVENT_LABELS } from '../lib/cycleEngine';
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
      case 'BIRTH_DATE_ASC': return new Date(a.birthDate || 0).getTime() - new Date(b.birthDate || 0).getTime();
      case 'BIRTH_DATE_DESC': return new Date(b.birthDate || 0).getTime() - new Date(a.birthDate || 0).getTime();
      default: return 0;
    }
  });

  const getStatusColor = (status: Sow['status']) => {
    switch (status) {
      case 'GILT': return 'bg-pink-100 text-pink-700 border-pink-200';
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

  const getProgress = (sow: Sow) => {
    if (sow.status === 'IDLE' || sow.status === 'GILT') return 0;
    if (!sow.currentCycleStartDate) return 0;
    
    const start = new Date(sow.currentCycleStartDate).getTime();
    const now = new Date().getTime();
    const totalDays = 135; // 114 to farrow + 21 to wean
    const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
    
    let progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
    return progress;
  };

  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base shadow-sm"
            placeholder="ค้นหารหัสแม่หมู..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => exportSowsToCSV(sows)}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"
          title="ส่งออกข้อมูล (CSV)"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-full leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm appearance-none shadow-sm"
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
            <ArrowUpDown className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-full leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm appearance-none shadow-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="ID_ASC">รหัส (A-Z)</option>
            <option value="ID_DESC">รหัส (Z-A)</option>
            <option value="PARITY_DESC">รอบผลิต (มากไปน้อย)</option>
            <option value="PARITY_ASC">รอบผลิต (น้อยไปมาก)</option>
            <option value="ENTRY_DATE_DESC">เข้าเล้า (ใหม่สุด)</option>
            <option value="ENTRY_DATE_ASC">เข้าเล้า (เก่าสุด)</option>
            <option value="BIRTH_DATE_DESC">วันเกิด (อายุน้อยสุด)</option>
            <option value="BIRTH_DATE_ASC">วันเกิด (อายุมากสุด)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 space-y-3">
        {processedSows.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-base bg-app-card rounded-3xl border border-gray-200 shadow-sm">
            ไม่พบข้อมูลแม่หมู
          </div>
        ) : (
          processedSows.map(sow => {
            const upcomingTasks = getUpcomingTasksForSow(sow);
            const nextTask = upcomingTasks.length > 0 ? upcomingTasks[0] : null;

            return (
              <div 
                key={sow.id}
                onClick={() => onSelectSow(sow.id)}
                className="bg-app-card rounded-2xl border border-gray-200 shadow-sm p-4 cursor-pointer hover:border-emerald-300 hover:shadow-md active:bg-emerald-50 transition-all flex items-center justify-between"
              >
                {/* Left Side: ID, Parity, Status */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-xl text-gray-900">{sow.id}</h3>
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full border", getStatusColor(sow.status))}>
                      {STATUS_LABELS[sow.status]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    รอบผลิตที่ {Math.min((sow.parity ?? 0) + 1, 7)}
                  </div>
                </div>

                {/* Right Side: Next Task */}
                <div className="flex flex-col items-end gap-2">
                  {nextTask ? (
                    <>
                      <span className={cn(
                        "font-bold text-xs px-3 py-1 rounded-full",
                        nextTask.daysDiff < 0 ? "text-red-700 bg-red-50" :
                        nextTask.daysDiff === 0 ? "text-yellow-700 bg-yellow-50" :
                        "text-green-700 bg-green-50"
                      )}>
                        {nextTask.daysDiff < 0 ? `เลย ${Math.abs(nextTask.daysDiff)} วัน` :
                         nextTask.daysDiff === 0 ? "วันนี้" :
                         `อีก ${nextTask.daysDiff} วัน`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          nextTask.daysDiff < 0 ? "bg-red-500" :
                          nextTask.daysDiff === 0 ? "bg-yellow-500" :
                          "bg-green-500"
                        )}></div>
                        <span className="text-gray-700 font-bold text-sm">
                          {EVENT_LABELS[nextTask.type]}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm font-medium">ไม่มีกำหนดการ</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
