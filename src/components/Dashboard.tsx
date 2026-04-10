import { Sow } from '../types';
import { getAllTasks, EVENT_LABELS, STATUS_LABELS } from '../lib/cycleEngine';
import { cn, formatDate } from '../lib/utils';
import { AlertCircle, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';

interface DashboardProps {
  sows: Sow[];
  onSelectSow: (id: string) => void;
}

export default function Dashboard({ sows, onSelectSow }: DashboardProps) {
  const allTasks = getAllTasks(sows);
  const overdueTasks = allTasks.filter(t => t.status === 'OVERDUE');
  const todayTasks = allTasks.filter(t => t.status === 'TODAY');
  
  const statusCounts = sows.reduce((acc, sow) => {
    acc[sow.status] = (acc[sow.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate Analytics
  let totalFarrowEvents = 0;
  let totalLiveBorn = 0;
  let totalWeanEvents = 0;
  let totalWeaned = 0;

  sows.forEach(sow => {
    sow.history.forEach(event => {
      if (event.type === 'FARROW' && event.liveBorn !== undefined) {
        totalFarrowEvents++;
        totalLiveBorn += event.liveBorn;
      }
      if (event.type === 'WEAN' && event.weanedCount !== undefined) {
        totalWeanEvents++;
        totalWeaned += event.weanedCount;
      }
    });
  });

  const avgLiveBorn = totalFarrowEvents > 0 ? (totalLiveBorn / totalFarrowEvents).toFixed(1) : '-';
  const avgWeaned = totalWeanEvents > 0 ? (totalWeaned / totalWeanEvents).toFixed(1) : '-';

  return (
    <div className="p-4 space-y-6">
      {/* Summary Cards */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-3">ภาพรวมสถานะ</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">{label}</span>
              <span className="text-lg font-bold text-pink-600">{statusCounts[status] || 0}</span>
            </div>
          ))}
          <div className="bg-pink-50 p-3 rounded-xl shadow-sm border border-pink-100 flex justify-between items-center col-span-2">
            <span className="text-sm text-pink-800 font-bold">รวมทั้งหมด</span>
            <span className="text-xl font-black text-pink-600">{sows.length}</span>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          สถิติประสิทธิภาพฟาร์ม
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-gray-500 mb-1">ลูกเกิดรอดเฉลี่ย</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-blue-600">{avgLiveBorn}</span>
              <span className="text-xs text-gray-400 ml-1">ตัว/ครอก</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-gray-500 mb-1">ลูกหย่านมเฉลี่ย</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-green-600">{avgWeaned}</span>
              <span className="text-xs text-gray-400 ml-1">ตัว/ครอก</span>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
          สิ่งที่ต้องทำ (Alerts)
        </h2>
        
        {overdueTasks.length === 0 && todayTasks.length === 0 ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center justify-center border border-green-100">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span className="font-medium">ไม่มีงานค้างหรือถึงกำหนดวันนี้</span>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => onSelectSow(task.sowId)}
                className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl shadow-sm cursor-pointer hover:bg-red-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded-full mb-2 inline-block">เลยกำหนด {Math.abs(task.daysDiff)} วัน</span>
                    <h3 className="font-bold text-gray-900">{task.sowId}</h3>
                    <p className="text-sm text-gray-700">{EVENT_LABELS[task.type]}</p>
                  </div>
                  <div className="text-right">
                    <Calendar className="w-4 h-4 text-red-400 inline mr-1" />
                    <span className="text-xs text-red-600 font-medium">{formatDate(task.expectedDate)}</span>
                  </div>
                </div>
              </div>
            ))}

            {todayTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => onSelectSow(task.sowId)}
                className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-xl shadow-sm cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full mb-2 inline-block">ถึงกำหนดวันนี้</span>
                    <h3 className="font-bold text-gray-900">{task.sowId}</h3>
                    <p className="text-sm text-gray-700">{EVENT_LABELS[task.type]}</p>
                  </div>
                  <div className="text-right">
                    <Calendar className="w-4 h-4 text-yellow-500 inline mr-1" />
                    <span className="text-xs text-yellow-700 font-medium">{formatDate(task.expectedDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
