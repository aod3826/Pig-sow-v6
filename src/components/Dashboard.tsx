import { useState, useEffect } from 'react';
import { Sow } from '../types';
import { getAllTasks, EVENT_LABELS, STATUS_LABELS, getUpcomingTasksForSow } from '../lib/cycleEngine';
import { cn, formatDate } from '../lib/utils';
import { AlertCircle, Calendar, CheckCircle2, TrendingUp, HelpCircle, X, BellRing } from 'lucide-react';
import { format } from 'date-fns';
import InstallPrompt from './InstallPrompt';

interface DashboardProps {
  sows: Sow[];
  onSelectSow: (id: string) => void;
}

export default function Dashboard({ sows, onSelectSow }: DashboardProps) {
  const [showLegend, setShowLegend] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        checkAndSendNotifications(true);
      }
    }
  };

  const checkAndSendNotifications = async (force = false) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastNotified = localStorage.getItem('lastNotificationDate');

    if (!force && lastNotified === todayStr) return;

    let todayCount = 0;
    let overdueCount = 0;

    sows.forEach(sow => {
      const tasks = getUpcomingTasksForSow(sow);
      tasks.forEach(task => {
        if (task.status === 'TODAY') todayCount++;
        if (task.status === 'OVERDUE') overdueCount++;
      });
    });

    const total = todayCount + overdueCount;

    if (total > 0) {
      const title = 'นิพนธุ์ฟาร์ม - แจ้งเตือนงานด่วน 🐷';
      const body = `คุณมีงานที่ต้องทำวันนี้ ${total} งาน\n(ถึงกำหนด ${todayCount} งาน, เลยกำหนด ${overdueCount} งาน)`;
      
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          vibrate: [200, 100, 200]
        } as any);
      } catch (e) {
        new Notification(title, { body, icon: '/icon.svg' });
      }
      localStorage.setItem('lastNotificationDate', todayStr);
    } else if (force) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification('นิพนธุ์ฟาร์ม', {
          body: 'เปิดการแจ้งเตือนสำเร็จ! เราจะแจ้งเตือนคุณเมื่อมีงานด่วน',
          icon: '/icon.svg'
        });
      } catch (e) {
        new Notification('นิพนธุ์ฟาร์ม', { body: 'เปิดการแจ้งเตือนสำเร็จ!' });
      }
    }
  };

  useEffect(() => {
    if (sows.length > 0 && notifPermission === 'granted') {
      checkAndSendNotifications();
    }
  }, [sows, notifPermission]);

  const allTasks = getAllTasks(sows);
  const overdueTasks = allTasks.filter(t => t.status === 'OVERDUE');
  const todayTasks = allTasks.filter(t => t.status === 'TODAY');
  const upcomingTasks = allTasks.filter(t => t.status === 'FUTURE' && t.daysDiff <= 7); // Show next 7 days
  
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

  const TaskCard = ({ task, isDanger }: { task: any, isDanger?: boolean }) => (
    <div 
      onClick={() => onSelectSow(task.sowId)}
      className={cn(
        "bg-white p-4 rounded-2xl shadow-sm border cursor-pointer transition-colors flex items-center justify-between",
        task.status === 'OVERDUE' ? "border-red-200 hover:bg-red-50" : 
        task.status === 'TODAY' ? "border-yellow-200 hover:bg-yellow-50" : "border-emerald-100 hover:bg-emerald-50"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm",
          task.status === 'OVERDUE' ? "bg-red-100 text-red-600" : 
          task.status === 'TODAY' ? "bg-yellow-100 text-yellow-600" : "bg-emerald-100 text-emerald-600"
        )}>
          {task.type === 'FARROW' ? '🐷' :
           task.type === 'WEAN' ? '🍼' :
           (task.type === 'VISUAL_PREG_CHECK' || task.type === 'CHECK_ESTRUS') ? '🔍' : 
           task.type === 'BREED' ? '✨' : '💉'}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-gray-900">{task.sowId}</h3>
            {task.status === 'OVERDUE' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">เลยกำหนด {Math.abs(task.daysDiff)} วัน</span>
            )}
            {task.status === 'TODAY' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">วันนี้</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-600">{EVENT_LABELS[task.type]}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={cn(
          "text-xs font-bold",
          task.status === 'OVERDUE' ? "text-red-600" : 
          task.status === 'TODAY' ? "text-yellow-600" : "text-emerald-600"
        )}>
          {formatDate(task.expectedDate)}
        </div>
        <button className="mt-1 text-xs px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">
          บันทึก
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      {/* Header Summary Stats */}
      <div className="bg-[#FFF0F3] -mx-4 -mt-4 p-6 text-[#880E4F] shadow-md rounded-b-3xl">
        <h2 className="text-2xl font-bold mb-4">สรุปงานประจำวัน 📝</h2>
        <div className="flex gap-4">
          <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-pink-100">
            <div className="text-red-500 text-sm font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4"/> เลยกำหนด</div>
            <div className="text-3xl font-black text-red-600">{overdueTasks.length}</div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-pink-100">
            <div className="text-orange-500 text-sm font-medium flex items-center gap-1"><Calendar className="w-4 h-4"/> งานวันนี้</div>
            <div className="text-3xl font-black text-orange-600">{todayTasks.length}</div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-pink-100">
            <div className="text-pink-600 text-sm font-medium flex items-center gap-1"><Calendar className="w-4 h-4"/> ล่วงหน้า</div>
            <div className="text-3xl font-black text-pink-700">{upcomingTasks.length}</div>
          </div>
        </div>
      </div>
      
      <InstallPrompt />

      {notifPermission === 'default' && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-sm sm:text-base">เปิดการแจ้งเตือน</h3>
              <p className="text-xs sm:text-sm text-blue-700">รับแจ้งเตือนงานด่วนและงานที่เลยกำหนด</p>
            </div>
          </div>
          <button 
            onClick={requestNotificationPermission}
            className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm"
          >
            เปิดใช้งาน
          </button>
        </div>
      )}

      {/* Task Sections */}
      <div className="space-y-6">
        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <section>
            <h3 className="text-lg font-black text-red-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-6 bg-red-600 rounded-full"></span>
              ค้างดำเนินการ ({overdueTasks.length})
            </h3>
            <div className="space-y-2">
              {overdueTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </section>
        )}

        {/* Today */}
        <section>
          <h3 className="text-lg font-black text-yellow-600 mb-3 flex items-center gap-2">
            <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
            ต้องทำวันนี้ ({todayTasks.length})
          </h3>
          {todayTasks.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
              <CheckCircle2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-medium">ไม่มีงานกำหนดการสำหรับวันนี้</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </section>

        {/* Upcoming */}
        {upcomingTasks.length > 0 && (
          <section>
            <h3 className="text-lg font-black text-emerald-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              ล่วงหน้าไวๆ นี้ (7 วัน)
            </h3>
            <div className="space-y-2">
              {upcomingTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </section>
        )}
      </div>

      <div className="h-4"></div>

      {/* Summary Cards */}
      <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">จำนวนแม่หมูตามสถานะ</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">{label}</span>
              <span className="text-lg font-bold text-emerald-600">{statusCounts[status] || 0}</span>
            </div>
          ))}
          <div className="bg-emerald-50 p-4 rounded-3xl shadow-md border border-emerald-100 flex justify-between items-center col-span-2">
            <span className="text-sm text-emerald-800 font-bold">รวมทั้งหมด</span>
            <span className="text-xl font-black text-emerald-600">{sows.length}</span>
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
          <div className="bg-white p-5 rounded-3xl shadow-md border border-blue-100 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-gray-500 mb-1">ลูกเกิดรอดเฉลี่ย</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-blue-600">{avgLiveBorn}</span>
              <span className="text-xs text-gray-400 ml-1">ตัว/ครอก</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-md border border-green-100 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-gray-500 mb-1">ลูกหย่านมเฉลี่ย</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-green-600">{avgWeaned}</span>
              <span className="text-xs text-gray-400 ml-1">ตัว/ครอก</span>
            </div>
          </div>
        </div>
      </section>

      {/* Legend Modal */}
      {showLegend && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-emerald-600" /> คู่มือการใช้งาน
              </h3>
              <button onClick={() => setShowLegend(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">ความหมายของสี (กำหนดการ)</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-red-500 shrink-0"></span> สีแดง = เลยกำหนด (ต้องรีบทำ!)</li>
                  <li className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-yellow-500 shrink-0"></span> สีเหลือง = ถึงกำหนดวันนี้</li>
                  <li className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-green-500 shrink-0"></span> สีเขียว = เร็วๆ นี้ (ยังไม่ถึงกำหนด)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">ความหมายของสี (สถานะแม่หมู)</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-400"></span> รอผสม</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> ผสมแล้ว</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> ตั้งท้อง</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> เตรียมคลอด</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> เลี้ยงลูก</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> พักฟื้น</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> ควรคัดออก</div>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-2">วงจรการผลิต</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-emerald-700">
                  <li><strong>ผสมพันธุ์</strong> (วันที่ 0)</li>
                  <li><strong>ตรวจกลับสัด</strong> (วันที่ 21)</li>
                  <li><strong>ตรวจพุง (AI)</strong> (วันที่ 60)</li>
                  <li><strong>บำรุงอาหารข้น</strong> (วันที่ 85)</li>
                  <li><strong>เข้าคอกคลอด</strong> (วันที่ 108)</li>
                  <li><strong>คลอด</strong> (วันที่ 114)</li>
                  <li><strong>หย่านมลูก</strong> (วันที่ 21 หลังคลอด)</li>
                  <li><strong>ผสมรอบใหม่</strong> (วันที่ 5 หลังหย่านม)</li>
                </ol>
              </div>
            </div>
            
            <button 
              onClick={() => setShowLegend(false)}
              className="w-full mt-6 bg-gray-100 text-gray-800 font-bold py-3 rounded-full hover:bg-gray-200 transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
