export type SowStatus = 'IDLE' | 'BRED' | 'PREGNANT' | 'PREPARING' | 'NURSING' | 'CULL_SUGGESTED' | 'CULLED';

export type EventType = 
  | 'ENTRY'
  | 'BREED' 
  | 'CHECK_ESTRUS' 
  | 'ULTRASOUND' 
  | 'FEED_BOOST' 
  | 'MOVE_TO_PEN' 
  | 'FARROW' 
  | 'WEAN' 
  | 'RETURN_ESTRUS'
  | 'CULL';

export type PregResult = 'POSITIVE' | 'NEGATIVE' | 'ABORTION';

export interface SowEvent {
  id: string;
  type: EventType;
  date: string; // ISO string
  notes?: string;
  parity?: number;
  
  // BREED
  boarId?: string;
  inseminator?: string;
  
  // PREG_CHECK (CHECK_ESTRUS, ULTRASOUND)
  pregResult?: PregResult;
  
  // FARROW
  pigletCount?: number; // Total or Live born
  liveBorn?: number;
  stillborn?: number;
  mummified?: number;
  avgBirthWeight?: number;
  
  // WEAN
  weanedCount?: number;
  totalWeanWeight?: number;
  
  // CULL
  cullReason?: string;
  cullPrice?: number;
}

export interface Sow {
  id: string; // User-defined ID, e.g., "SOW-001"
  breed?: string;
  birthDate?: string;
  entryDate?: string;
  status: SowStatus;
  parity?: number;
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
