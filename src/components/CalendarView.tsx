import { useState, useMemo } from 'react';
import { Sow } from '../types';
import { getUpcomingTasksForSow, EVENT_LABELS } from '../lib/cycleEngine';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ListTodo } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const selectedDayTasks = allTasks.filter(t => isSameDay(t.date, selectedDate));

  return (
    <div className="p-4 flex flex-col min-h-full bg-app-bg">
      <div className="bg-app-card rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-6 shrink-0">
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
            <div key={i} className="text-center py-3 text-xs font-bold text-gray-500">
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
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div 
                key={i} 
                onClick={() => {
                  setSelectedDate(day);
                  if (!isCurrentMonth) {
                    setCurrentDate(day);
                  }
                }}
                className={cn(
                  "min-h-[60px] sm:min-h-[80px] p-1 border-b border-r border-gray-100 relative cursor-pointer transition-all",
                  !isCurrentMonth && "bg-gray-50/50 text-gray-400",
                  isCurrentMonth && "bg-app-card hover:bg-gray-50",
                  isSelected && "bg-emerald-50/50",
                  (i + 1) % 7 === 0 && "border-r-0"
                )}
              >
                <div className="flex justify-center mb-1 mt-1">
                  <span className={cn(
                    "text-sm w-8 h-8 flex items-center justify-center rounded-full transition-all",
                    isSelected ? "bg-emerald-600 text-white font-bold shadow-md scale-110" : 
                    isTodayDate ? "bg-emerald-100 text-emerald-700 font-bold" : "text-gray-700 font-medium"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-1 px-1 mt-1">
                  {dayTasks.slice(0, 3).map((task, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        task.type === 'FARROW' ? "bg-purple-500" :
                        task.type === 'WEAN' ? "bg-green-500" :
                        (task.type === 'VISUAL_PREG_CHECK' || task.type === 'CHECK_ESTRUS') ? "bg-blue-500" :
                        "bg-orange-500"
                      )}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-emerald-600" />
          {isToday(selectedDate) ? 'กำหนดการวันนี้' : `วันที่ ${format(selectedDate, 'd MMM yyyy', { locale: th })}`}
        </h3>
        {selectedDayTasks.length > 0 && (
          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
            {selectedDayTasks.length} งาน
          </span>
        )}
      </div>

      <div className="space-y-3 pb-4">
        {selectedDayTasks.length > 0 ? (
          selectedDayTasks.map((task, i) => (
            <div 
              key={i}
              onClick={() => onSelectSow(task.sowId)}
              className="bg-app-card p-4 rounded-3xl shadow-md border border-gray-100 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm",
                  task.type === 'FARROW' ? "bg-purple-100 text-purple-700" :
                  task.type === 'WEAN' ? "bg-green-100 text-green-700" :
                  (task.type === 'VISUAL_PREG_CHECK' || task.type === 'CHECK_ESTRUS') ? "bg-blue-100 text-blue-700" :
                  "bg-orange-100 text-orange-700"
                )}>
                  {task.type === 'FARROW' ? '🐷' :
                   task.type === 'WEAN' ? '🍼' :
                   (task.type === 'VISUAL_PREG_CHECK' || task.type === 'CHECK_ESTRUS') ? '🔍' : '💉'}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">แม่หมู {task.sowId}</h4>
                  <p className="text-gray-500 text-sm font-medium">{EVENT_LABELS[task.type]}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {format(task.date, 'd MMM', { locale: th })}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {isToday(task.date) ? 'วันนี้' : format(task.date, 'EEEE', { locale: th })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 bg-app-card rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <CalendarIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-base font-medium">ไม่มีกำหนดการในวันนี้</p>
          </div>
        )}
      </div>
    </div>
  );
}
