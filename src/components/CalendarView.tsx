import { useState, useMemo } from 'react';
import { Sow } from '../types';
import { getUpcomingTasksForSow, EVENT_LABELS } from '../lib/cycleEngine';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO,
  startOfDay
} from 'date-fns';
import { th } from 'date-fns/locale';

interface CalendarViewProps {
  sows: Sow[];
  onSelectSow: (id: string) => void;
}

export default function CalendarView({ sows, onSelectSow }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Generate all tasks for all sows
  const allTasks = useMemo(() => {
    const tasks: { date: Date; sowId: string; type: string; status: string }[] = [];
    sows.forEach(sow => {
      if (sow.status === 'IDLE' || sow.status === 'CULLED') return;
      
      const upcoming = getUpcomingTasksForSow(sow);
      upcoming.forEach(task => {
        if (task.expectedDate) {
          tasks.push({
            date: startOfDay(parseISO(task.expectedDate)),
            sowId: sow.id,
            type: task.type,
            status: sow.status
          });
        }
      });
    });
    return tasks;
  }, [sows]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="p-4 flex flex-col h-full bg-slate-100">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-gray-800 capitalize">
            {format(currentDate, dateFormat, { locale: th })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center py-2 text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, i) => {
            const dayTasks = allTasks.filter(task => isSameDay(task.date, day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            return (
              <div 
                key={i} 
                className={cn(
                  "min-h-[80px] p-1 border-b border-r border-gray-100 relative",
                  !isCurrentMonth && "bg-gray-50/50 text-gray-400",
                  isCurrentMonth && "bg-white",
                  (i + 1) % 7 === 0 && "border-r-0"
                )}
              >
                <div className="flex justify-center mb-1">
                  <span className={cn(
                    "text-sm w-7 h-7 flex items-center justify-center rounded-full",
                    isTodayDate ? "bg-pink-600 text-white font-bold shadow-sm" : "text-gray-700 font-medium"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[60px] no-scrollbar">
                  {dayTasks.map((task, idx) => (
                    <div 
                      key={idx}
                      onClick={() => onSelectSow(task.sowId)}
                      className={cn(
                        "text-[10px] leading-tight p-1 rounded cursor-pointer truncate font-medium",
                        task.type === 'FARROW' ? "bg-purple-100 text-purple-700" :
                        task.type === 'WEAN' ? "bg-green-100 text-green-700" :
                        task.type === 'PREG_CHECK' ? "bg-blue-100 text-blue-700" :
                        "bg-orange-100 text-orange-700"
                      )}
                      title={`${task.sowId}: ${EVENT_LABELS[task.type]}`}
                    >
                      <span className="font-bold">{task.sowId}</span> {EVENT_LABELS[task.type]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Tasks List (Agenda View) */}
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-pink-600" />
        กำหนดการเร็วๆ นี้
      </h3>
      <div className="space-y-3 pb-4">
        {allTasks
          .filter(t => t.date >= startOfDay(new Date()))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 10)
          .map((task, i) => (
            <div 
              key={i}
              onClick={() => onSelectSow(task.sowId)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-pink-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold",
                  task.type === 'FARROW' ? "bg-purple-100 text-purple-700" :
                  task.type === 'WEAN' ? "bg-green-100 text-green-700" :
                  task.type === 'PREG_CHECK' ? "bg-blue-100 text-blue-700" :
                  "bg-orange-100 text-orange-700"
                )}>
                  {task.type === 'FARROW' ? '🐷' :
                   task.type === 'WEAN' ? '🍼' :
                   task.type === 'PREG_CHECK' ? '🔍' : '💉'}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">แม่หมู {task.sowId}</h4>
                  <p className="text-gray-500 text-sm">{EVENT_LABELS[task.type]}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {format(task.date, 'd MMM', { locale: th })}
                </div>
                <div className="text-xs text-gray-500">
                  {isToday(task.date) ? 'วันนี้' : format(task.date, 'EEEE', { locale: th })}
                </div>
              </div>
            </div>
          ))}
        {allTasks.filter(t => t.date >= startOfDay(new Date())).length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-100">
            ไม่มีกำหนดการในเร็วๆ นี้
          </div>
        )}
      </div>
    </div>
  );
}
