import { addDays } from 'date-fns';
import { Sow, Task, EventType } from '../types';
import { getDateStatus, getDaysDiff } from './utils';

// Define the cycle rules
export const CYCLE_RULES = {
  CHECK_ESTRUS: 21, // days after breed
  ULTRASOUND: 30, // days after breed
  FEED_BOOST: 85, // days after breed
  MOVE_TO_PEN: 108, // days after breed
  FARROW: 114, // days after breed
  WEAN: 21, // days after farrow
  REBREED: 5, // days after wean
};

export const EVENT_LABELS: Record<EventType, string> = {
  BREED: 'ผสมพันธุ์',
  CHECK_ESTRUS: 'ตรวจสัด',
  ULTRASOUND: 'อัลตราซาวด์',
  FEED_BOOST: 'บำรุงอาหาร',
  MOVE_TO_PEN: 'ย้ายเข้าคอกคลอด',
  FARROW: 'คลอด',
  WEAN: 'หย่านม',
  RETURN_ESTRUS: 'กลับสัด',
};

export const STATUS_LABELS: Record<Sow['status'], string> = {
  IDLE: 'รอผสม',
  BRED: 'ผสมแล้ว',
  PREGNANT: 'ตั้งท้อง',
  PREPARING: 'เตรียมคลอด',
  NURSING: 'เลี้ยงลูก',
};

export function getUpcomingTasksForSow(sow: Sow): Task[] {
  const tasks: Task[] = [];

  const addTask = (type: EventType, baseDateStr: string, daysToAdd: number) => {
    const expectedDate = addDays(new Date(baseDateStr), daysToAdd).toISOString();
    tasks.push({
      id: `${sow.id}-${type}-${expectedDate}`,
      sowId: sow.id,
      type,
      expectedDate,
      status: getDateStatus(expectedDate),
      daysDiff: getDaysDiff(expectedDate),
    });
  };

  if (sow.status === 'BRED' && sow.currentCycleStartDate) {
    // Hasn't done ultrasound yet
    const hasUltrasound = sow.history.some(e => e.type === 'ULTRASOUND' && e.date >= sow.currentCycleStartDate!);
    const hasCheckEstrus = sow.history.some(e => e.type === 'CHECK_ESTRUS' && e.date >= sow.currentCycleStartDate!);
    
    if (!hasCheckEstrus) addTask('CHECK_ESTRUS', sow.currentCycleStartDate, CYCLE_RULES.CHECK_ESTRUS);
    if (!hasUltrasound) addTask('ULTRASOUND', sow.currentCycleStartDate, CYCLE_RULES.ULTRASOUND);
  }

  if (sow.status === 'PREGNANT' && sow.currentCycleStartDate) {
    const hasFeedBoost = sow.history.some(e => e.type === 'FEED_BOOST' && e.date >= sow.currentCycleStartDate!);
    const hasMoveToPen = sow.history.some(e => e.type === 'MOVE_TO_PEN' && e.date >= sow.currentCycleStartDate!);

    if (!hasFeedBoost) addTask('FEED_BOOST', sow.currentCycleStartDate, CYCLE_RULES.FEED_BOOST);
    if (!hasMoveToPen) addTask('MOVE_TO_PEN', sow.currentCycleStartDate, CYCLE_RULES.MOVE_TO_PEN);
  }

  if (sow.status === 'PREPARING' && sow.currentCycleStartDate) {
    addTask('FARROW', sow.currentCycleStartDate, CYCLE_RULES.FARROW);
  }

  if (sow.status === 'NURSING' && sow.farrowDate) {
    addTask('WEAN', sow.farrowDate, CYCLE_RULES.WEAN);
  }

  if (sow.status === 'IDLE' && sow.weanDate) {
    addTask('BREED', sow.weanDate, CYCLE_RULES.REBREED);
  }

  // Sort tasks by expected date ascending
  return tasks.sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
}

export function getAllTasks(sows: Sow[]): Task[] {
  return sows.flatMap(getUpcomingTasksForSow).sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
}
