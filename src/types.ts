export type SowStatus = 'IDLE' | 'BRED' | 'PREGNANT' | 'PREPARING' | 'NURSING';

export type EventType = 
  | 'BREED' 
  | 'CHECK_ESTRUS' 
  | 'ULTRASOUND' 
  | 'FEED_BOOST' 
  | 'MOVE_TO_PEN' 
  | 'FARROW' 
  | 'WEAN' 
  | 'RETURN_ESTRUS';

export interface SowEvent {
  id: string;
  type: EventType;
  date: string; // ISO string
  notes?: string;
  pigletCount?: number; // Only for FARROW
}

export interface Sow {
  id: string; // User-defined ID, e.g., "SOW-001"
  status: SowStatus;
  currentCycleStartDate?: string; // Date of last BREED
  farrowDate?: string; // Date of last FARROW
  weanDate?: string; // Date of last WEAN
  history: SowEvent[];
}

export interface Task {
  id: string; // Unique ID for the task
  sowId: string;
  type: EventType;
  expectedDate: string;
  status: 'OVERDUE' | 'TODAY' | 'FUTURE';
  daysDiff: number;
}
