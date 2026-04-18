export type SowStatus = 'IDLE' | 'BRED' | 'PREGNANT' | 'PREPARING' | 'NURSING' | 'CULL_SUGGESTED' | 'CULLED' | 'GILT' | 'RECOVERING';

export type EventType = 
  | 'ENTRY'
  | 'BREED' 
  | 'CHECK_ESTRUS' 
  | 'VISUAL_PREG_CHECK'
  | 'FEED_BOOST' 
  | 'MOVE_TO_PEN' 
  | 'FARROW' 
  | 'WEAN' 
  | 'RETURN_ESTRUS'
  | 'CULL'
  | 'HEALTH_NOTE';

export type PregResult = 'POSITIVE' | 'NEGATIVE' | 'ABORTION';

export interface SowEvent {
  id: string;
  type: EventType;
  date: string; // ISO string
  notes?: string;
  parity?: number;
  
  // HEALTH_NOTE
  noteCategory?: 'SICK' | 'VACCINE' | 'GENERAL';
  
  // BREED
  breedingMethod?: 'NATURAL' | 'ARTIFICIAL';
  boarId?: string;
  semenId?: string;
  semenSource?: string;
  inseminator?: string;
  matingTime?: 'MORNING' | 'EVENING' | 'ANY';
  
  // PREG_CHECK (CHECK_ESTRUS, VISUAL_PREG_CHECK)
  pregResult?: PregResult;
  aiConfidence?: string;
  isSuccess?: boolean;
  bcsScore?: number;
  hasDischarge?: boolean;
  
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

  createdAt?: string;
}

export interface Sow {
  id: string; // User-defined ID, e.g., "SOW-001"
  breed?: string;
  birthDate?: string;
  entryDate?: string;
  status: SowStatus;
  parity?: number;
  currentCycleStartDate?: string; // Date of last BREED
  statusUpdatedAt?: string;
  failedBreedings?: number;
  farrowDate?: string; // Date of last FARROW
  weanDate?: string; // Date of last WEAN
  history: SowEvent[];
  updatedAt?: string;
  cageId?: string; // Location of the sow in the pen
}

export interface WeighingRecord {
  id: string;
  grossWeight: number; // น้ำหนักรวม
  tareWeight: number; // น้ำหนักกรง/ชุด
  netWeight: number; // น้ำหนักสุทธิ
}

export interface SaleRecord {
  id: string;
  buyerName: string;
  buyerEmail?: string;
  sellerName: string;
  vehicleReg: string;
  saleType: string;
  date: string;
  weighings: WeighingRecord[];
  totalPigs: number;
  totalNetWeight: number;
  avgWeight: number;
  pricePerKg: number;
  grossTotal: number;
  deductions: number;
  netTotal: number;
  paymentStatus: 'PAID' | 'UNPAID';
  signature?: string;
  receiptUrl?: string;
  createdAt?: string;
}

export interface Task {
  id: string; // Unique ID for the task
  sowId: string;
  type: EventType;
  expectedDate: string;
  status: 'OVERDUE' | 'TODAY' | 'FUTURE';
  daysDiff: number;
}

export type ExpenseCategory = 'FEED' | 'MEDICINE' | 'EQUIPMENT' | 'MAINTENANCE' | 'UTILITIES' | 'SALARY' | 'OTHER';

export interface ExpenseItem {
  id: string;
  name: string; // e.g., "รำละเอียด", "ปลายข้าว"
  quantity: number;
  unit: string; // e.g., "กก.", "กระสอบ"
  unitPrice: number;
  totalPrice: number;
}

export interface ExpenseRecord {
  id: string;
  shopName: string;
  category: ExpenseCategory;
  totalAmount: number;
  date: string; // ISO string
  note?: string;
  receiptUrl?: string;
  items: ExpenseItem[];
  createdAt?: string;
}
