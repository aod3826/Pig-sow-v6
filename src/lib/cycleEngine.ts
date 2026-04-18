import { addDays } from 'date-fns';
import { Sow, Task, EventType } from '../types';
import { getDateStatus, getDaysDiff } from './utils';

// Define the cycle rules
export const CYCLE_RULES = {
  CHECK_ESTRUS: 21, // days after breed
  VISUAL_PREG_CHECK: 60, // days after breed
  FEED_BOOST: 85, // days after breed
  MOVE_TO_PEN: 108, // days after breed
  FARROW: 114, // days after breed
  WEAN: 21, // days after farrow
  REBREED: 5, // days after wean
};

export const EVENT_LABELS: Record<EventType, string> = {
  ENTRY: 'เข้าเล้า',
  BREED: 'ผสมพันธุ์',
  CHECK_ESTRUS: 'ตรวจกลับสัด (21 วัน)',
  VISUAL_PREG_CHECK: 'ตรวจพุงแม่หมู (60 วัน)',
  FEED_BOOST: 'บำรุงอาหาร',
  MOVE_TO_PEN: 'ย้ายเข้าคอกคลอด',
  FARROW: 'คลอด',
  WEAN: 'หย่านม',
  RETURN_ESTRUS: 'กลับสัด',
  CULL: 'คัดออก',
  HEALTH_NOTE: 'บันทึกสุขภาพ/หมายเหตุ',
};

export const STATUS_LABELS: Record<Sow['status'], string> = {
  GILT: 'แม่หมูสาว (รอผสม)',
  IDLE: 'รอผสม',
  BRED: 'ผสมแล้ว',
  PREGNANT: 'ตั้งท้อง',
  PREPARING: 'เตรียมคลอด',
  NURSING: 'เลี้ยงลูก',
  CULL_SUGGESTED: 'ควรคัดออก',
  CULLED: 'คัดออกแล้ว',
  RECOVERING: 'พักฟื้น/รอรอบสัด',
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

  // Find the events after the last BREED
  const lastBreedIndex = sow.history.map(e => e.type).lastIndexOf('BREED');
  const eventsAfterBreed = lastBreedIndex !== -1 ? sow.history.slice(lastBreedIndex + 1) : [];

  if (sow.status === 'BRED' && sow.currentCycleStartDate) {
    // Hasn't done check estrus yet
    const hasCheckEstrus = eventsAfterBreed.some(e => e.type === 'CHECK_ESTRUS');
    const hasVisualCheck = eventsAfterBreed.some(e => e.type === 'VISUAL_PREG_CHECK');
    
    if (!hasCheckEstrus) {
      addTask('CHECK_ESTRUS', sow.currentCycleStartDate, CYCLE_RULES.CHECK_ESTRUS);
    } else if (!hasVisualCheck) {
      addTask('VISUAL_PREG_CHECK', sow.currentCycleStartDate, CYCLE_RULES.VISUAL_PREG_CHECK);
    }
  }

  if (sow.status === 'PREGNANT' && sow.currentCycleStartDate) {
    const hasVisualCheck = eventsAfterBreed.some(e => e.type === 'VISUAL_PREG_CHECK');
    const hasFeedBoost = eventsAfterBreed.some(e => e.type === 'FEED_BOOST');
    const hasMoveToPen = eventsAfterBreed.some(e => e.type === 'MOVE_TO_PEN');

    // For backward compatibility: if they are PREGNANT but haven't done Visual Check, show it first
    if (!hasVisualCheck) {
      addTask('VISUAL_PREG_CHECK', sow.currentCycleStartDate, CYCLE_RULES.VISUAL_PREG_CHECK);
    } else {
      if (!hasFeedBoost) addTask('FEED_BOOST', sow.currentCycleStartDate, CYCLE_RULES.FEED_BOOST);
      if (!hasMoveToPen) addTask('MOVE_TO_PEN', sow.currentCycleStartDate, CYCLE_RULES.MOVE_TO_PEN);
      
      // Also show FARROW task so they know when it's coming
      addTask('FARROW', sow.currentCycleStartDate, CYCLE_RULES.FARROW);
    }
  }

  if (sow.status === 'PREPARING' && sow.currentCycleStartDate) {
    addTask('FARROW', sow.currentCycleStartDate, CYCLE_RULES.FARROW);
  }

  if (sow.status === 'NURSING' && sow.farrowDate) {
    addTask('WEAN', sow.farrowDate, CYCLE_RULES.WEAN);
  }

  if (sow.status === 'IDLE' || sow.status === 'GILT') {
    const lastEvent = sow.history[sow.history.length - 1];
    if (lastEvent) {
      if (lastEvent.type === 'WEAN') {
        addTask('BREED', lastEvent.date, CYCLE_RULES.REBREED);
      } else if (['CHECK_ESTRUS', 'VISUAL_PREG_CHECK', 'RETURN_ESTRUS'].includes(lastEvent.type) && lastEvent.pregResult !== 'ABORTION') {
        addTask('BREED', lastEvent.date, 0); // Breed immediately
      } else if (lastEvent.type === 'ENTRY') {
        addTask('BREED', lastEvent.date, 0); // Ready to breed
      } else {
        if (sow.weanDate) addTask('BREED', sow.weanDate, CYCLE_RULES.REBREED);
      }
    } else {
      if (sow.entryDate) addTask('BREED', sow.entryDate, 0);
    }
  }

  if (sow.status === 'RECOVERING') {
    // Find the fail event that caused recovery
    const failEvent = [...sow.history].reverse().find(e => ['CHECK_ESTRUS', 'VISUAL_PREG_CHECK', 'ABORTION'].includes(e.type) && (e.pregResult === 'NEGATIVE' || e.pregResult === 'ABORTION'));
    const baseDate = failEvent ? failEvent.date : (sow.statusUpdatedAt || new Date().toISOString());

    // 1. Task: Flushing Diet (Feed Boost)
    // We want to remind them to do this within the first 1-2 days
    const hasFeedBoostSinceFail = sow.history.slice(sow.history.findIndex(e => e.id === failEvent?.id) + 1).some(e => e.type === 'FEED_BOOST');
    if (!hasFeedBoostSinceFail && failEvent) {
      addTask('FEED_BOOST', baseDate, 1);
    } else if (!failEvent) {
      addTask('FEED_BOOST', baseDate, 1);
    }

    // 2. Task: Boar Test & Breed (Re-breed at Day 18 after fail)
    addTask('BREED', baseDate, 18);
  }

  // Sort tasks by expected date ascending
  return tasks.sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
}

export function getAllTasks(sows: Sow[]): Task[] {
  return sows.flatMap(getUpcomingTasksForSow).sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
}
