import { Sow } from '../types';
import { STATUS_LABELS, getUpcomingTasksForSow, EVENT_LABELS } from '../lib/cycleEngine';
import { cn, formatDate } from '../lib/utils';
import { ChevronRight, Search, Calendar as CalendarIcon, Download, Filter, ArrowUpDown, Check } from 'lucide-react';
import { useState } from 'react';
import { exportSowsToCSV } from '../lib/export';

interface SowListProps {
  sows: Sow[];
  onSelectSow: (id: string) => void;
  onRecordEvent?: (id: string, type: any, date: string, payload?: any) => void;
}

const RecoveryPanel = ({ sow, onReady }: { sow: Sow, onReady: () => void }) => {
  const daysRested = sow.statusUpdatedAt 
    ? Math.floor((new Date().getTime() - new Date(sow.statusUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const failEvent = [...sow.history].reverse().find(e => ['CHECK_ESTRUS', 'VISUAL_PREG_CHECK', 'ABORTION'].includes(e.type) && (e.pregResult === 'NEGATIVE' || e.pregResult === 'ABORTION'));
  
  let reason = "ไม่ทราบสาเหตุ";
  if (failEvent) {
    if (failEvent.pregResult === 'ABORTION') reason = 'แท้ง';
    else if (failEvent.hasDischarge) reason = 'มดลูกอักเสบ (มีเมือก/หนอง)';
    else if (failEvent.bcsScore && failEvent.bcsScore < 3) reason = 'ผอม/ทรุดโทรม (BCS ต่ำ)';
    else reason = 'ไม่ตั้งท้อง (ตรวจพุง/กลับสัด)';
  }

  return (
    <div className="mt-4 pt-4 border-t border-amber-100 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-amber-800 font-bold">
          <span className="text-xl">🏥</span>
          <span>พักฟื้นในห้องพยาบาล</span>
        </div>
        <div className="bg-amber-100 px-3 py-1 rounded-full text-sm font-bold text-amber-800">
          ผ่านมาแล้ว: {daysRested} วัน
        </div>
      </div>
      
      <div className="text-sm text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
        <span className="font-bold">สาเหตุที่ถูกคัดออกพัก:</span> {reason}
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onReady(); }}
        className="mt-1 w-full bg-gradient-to-r from-[#E91E63] to-[#F06292] text-white font-bold py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
      >
        ✅ พร้อมแล้ว เริ่มรอบผสมหมูสาว
      </button>
    </div>
  );
}

const CycleStepper = ({ status }: { status: Sow['status'] }) => {
  if (['CULLED', 'CULL_SUGGESTED', 'RECOVERING'].includes(status)) return null;

  const steps = [
    { label: status === 'RECOVERING' ? 'พักฟื้น' : 'รอผสม', statuses: ['IDLE', 'GILT', 'RECOVERING'] },
    { label: 'รอตรวจ', statuses: ['BRED'] },
    { label: 'ตั้งท้อง', statuses: ['PREGNANT', 'PREPARING'] },
    { label: 'เลี้ยงลูก', statuses: ['NURSING'] }
  ];

  let currentIndex = 0;
  if (['NURSING'].includes(status)) currentIndex = 3;
  else if (['PREGNANT', 'PREPARING'].includes(status)) currentIndex = 2;
  else if (['BRED'].includes(status)) currentIndex = 1;
  else currentIndex = 0;

  return (
    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col">
      {/* Stepper UI */}
      <div className="relative flex justify-between items-center px-4 mb-3">
        {/* Progress Line */}
        <div className="absolute left-[10%] right-[10%] top-2.5 h-[3px] bg-gray-200 -z-10"></div>
        <div 
          className="absolute left-[10%] top-2.5 h-[3px] bg-emerald-500 transition-all duration-500 -z-10"
          style={{ width: `${(currentIndex / 3) * 80}%` }}
        ></div>

        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5 bg-white px-1">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors",
                isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                isActive ? "bg-white border-emerald-500 ring-2 ring-emerald-100" :
                "bg-white border-gray-300"
              )}>
                {isCompleted && <Check className="w-3 h-3" />}
                {!isCompleted && isActive && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
              </div>
              <span className={cn(
                "text-[10px] font-bold",
                isActive || isCompleted ? "text-gray-800" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Tip */}
      <ActionTip status={status} />
    </div>
  );
};

const ActionTip = ({ status }: { status: Sow['status'] }) => {
  switch(status) {
    case 'GILT':
    case 'IDLE':
      return (
        <div className="text-xs text-pink-700 bg-pink-50/70 p-2.5 rounded-xl border border-pink-100 flex items-start gap-2 leading-relaxed">
          <span className="text-sm leading-none shrink-0">🔍</span> 
          <span><b>ข้อปฏิบัติ:</b> สังเกตอาการเป็นสัด (อวัยวะเพศบวม/แดง/ยืนนิ่ง) เพื่อเตรียมตัวผสมพันธุ์</span>
        </div>
      );
    case 'BRED':
       return (
        <div className="text-xs text-blue-700 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2 leading-relaxed">
          <span className="text-sm leading-none shrink-0">⏳</span> 
          <span><b>ข้อปฏิบัติ:</b> เฝ้าระวังการกลับสัดอย่างใกล้ชิดในช่วง 21 วันแรก ไม่ควรเคลื่อนย้าย หรือทำให้หมูเครียด</span>
        </div>
       );
    case 'PREGNANT':
       return (
        <div className="text-xs text-purple-700 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100 flex items-start gap-2 leading-relaxed">
          <span className="text-sm leading-none shrink-0">🍎</span> 
          <span><b>ข้อปฏิบัติ:</b> ปรับเพิ่มอาหารตามระยะตั้งครรภ์ และฉีดวัคซีนบำรุงตามโปรแกรมของฟาร์ม</span>
        </div>
       );
    case 'PREPARING':
       return (
        <div className="text-xs text-orange-700 bg-orange-50/70 p-2.5 rounded-xl border border-orange-100 flex items-start gap-2 leading-relaxed">
          <span className="text-sm leading-none shrink-0">🛁</span> 
          <span><b>ข้อปฏิบัติ:</b> อาบน้ำฆ่าเชื้อแม่หมู ย้ายเข้าคอกคลอดที่สะอาด เตรียมไฟกก และเฝ้าระวังการคลอด</span>
        </div>
       );
    case 'NURSING':
       return (
        <div className="text-xs text-green-700 bg-green-50/70 p-2.5 rounded-xl border border-green-100 flex items-start gap-2 leading-relaxed">
          <span className="text-sm leading-none shrink-0">🍼</span> 
          <span><b>ข้อปฏิบัติ:</b> ระวังแม่ทับลูก ให้อาหารแม่เต็มที่ (กินไม่จำกัด) เพื่อให้ผลิตน้ำนมเพียงพอ</span>
        </div>
       );
    case 'CULL_SUGGESTED':
       return (
        <div className="text-xs text-red-700 bg-red-50/70 p-2.5 rounded-xl border border-red-100 flex items-start gap-2 leading-relaxed">
          <span className="text-sm leading-none shrink-0">🚨</span> 
          <span><b>ข้อปฏิบัติ:</b> ผสมไม่ติดครบ 3 ครั้งในรอบนี้ แนะนำให้คัดทิ้งเพื่อลดต้นทุนค่าอาหาร</span>
        </div>
       );
    default: return null;
  }
};

export default function SowList({ sows, onSelectSow, onRecordEvent }: SowListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('UPDATED_DESC');

  // 1. Filter by Search
  let processedSows = sows.filter(s => s.id.toLowerCase().includes(search.toLowerCase()));

  // 2. Filter by Status
  if (filterStatus !== 'ALL') {
    processedSows = processedSows.filter(s => s.status === filterStatus);
  }

  // 3. Sort
  processedSows.sort((a, b) => {
    switch (sortBy) {
      case 'UPDATED_DESC': return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
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
      case 'RECOVERING': return 'bg-amber-100 text-amber-800 border-amber-200';
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
            <option value="UPDATED_DESC">บันทึกล่าสุด</option>
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
          <div className="text-center py-10 text-gray-500 text-base bg-white rounded-3xl border border-gray-200 shadow-sm">
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
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 cursor-pointer hover:border-emerald-300 hover:shadow-md active:bg-emerald-50 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between">
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
                      <span className="text-gray-400 text-sm font-medium mt-1">ไม่มีกำหนดการ</span>
                    )}
                  </div>
                </div>

                {/* Progress Stepper & Action Tip OR Recovery Panel */}
                {sow.status === 'RECOVERING' ? (
                  <RecoveryPanel sow={sow} onReady={() => onRecordEvent?.(sow.id, 'RETURN_ESTRUS', new Date().toISOString(), { notes: 'ฟื้นฟูเสร็จสิ้นกลับสู่รอบผสม' })} />
                ) : (
                  <CycleStepper status={sow.status} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
