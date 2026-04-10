-- 1. ลบตารางเดิมทิ้ง (ถ้ามี) เพื่อสร้างใหม่ตามลำดับที่ถูกต้อง
DROP TABLE IF EXISTS sow_events;
DROP TABLE IF EXISTS sows;

-- 2. สร้างตารางหลัก (sows)
CREATE TABLE sows (
  id TEXT PRIMARY KEY,
  breed TEXT,
  birth_date TIMESTAMPTZ,
  entry_date TIMESTAMPTZ,
  status TEXT NOT NULL,
  parity INTEGER DEFAULT 0,
  current_cycle_start_date TIMESTAMPTZ,
  farrow_date TIMESTAMPTZ,
  wean_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้างตารางประวัติ (sow_events) พร้อม Foreign Key
CREATE TABLE sow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id TEXT REFERENCES sows(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  parity INTEGER DEFAULT 0,
  
  -- ข้อมูลสำหรับการผสมพันธุ์ (BREED)
  boar_id TEXT,
  inseminator TEXT,
  
  -- ข้อมูลสำหรับการตรวจท้อง (PREG_CHECK)
  preg_result TEXT,
  
  -- ข้อมูลสำหรับการคลอด (FARROW)
  piglet_count INTEGER,
  live_born INTEGER,
  stillborn INTEGER,
  mummified INTEGER,
  avg_birth_weight NUMERIC,
  
  -- ข้อมูลสำหรับการหย่านม (WEAN)
  weaned_count INTEGER,
  total_wean_weight NUMERIC,
  
  -- ข้อมูลสำหรับการคัดออก (CULL)
  cull_reason TEXT,
  cull_price NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_events ENABLE ROW LEVEL SECURITY;

-- 5. สร้าง Policy ให้ทุกคนสามารถ Read/Write ได้ (สำหรับการทดสอบ)
CREATE POLICY "Allow public all operations on sows" 
ON sows FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public all operations on sow_events" 
ON sow_events FOR ALL 
USING (true) 
WITH CHECK (true);

-- 6. ข้อมูลตัวอย่าง (Seed Data)
INSERT INTO sows (id, breed, entry_date, status, parity, current_cycle_start_date)
VALUES 
  ('SOW-001', 'Large White', NOW() - INTERVAL '100 days', 'PREGNANT', 1, NOW() - INTERVAL '40 days'),
  ('SOW-002', 'Landrace', NOW() - INTERVAL '200 days', 'IDLE', 1, NULL);

INSERT INTO sow_events (sow_id, type, date, parity, boar_id, inseminator, preg_result, live_born, stillborn, mummified, avg_birth_weight, weaned_count, total_wean_weight)
VALUES
  -- ประวัติของ SOW-001 (กำลังตั้งท้อง)
  ('SOW-001', 'ENTRY', NOW() - INTERVAL '100 days', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('SOW-001', 'BREED', NOW() - INTERVAL '40 days', 1, 'BOAR-A1', 'หมอสมชาย', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('SOW-001', 'ULTRASOUND', NOW() - INTERVAL '10 days', 1, NULL, NULL, 'POSITIVE', NULL, NULL, NULL, NULL, NULL, NULL),
  
  -- ประวัติของ SOW-002 (เคยให้ลูก 1 ครอก ตอนนี้รอผสมรอบ 2)
  ('SOW-002', 'ENTRY', NOW() - INTERVAL '200 days', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('SOW-002', 'BREED', NOW() - INTERVAL '180 days', 1, 'BOAR-B2', 'หมอสมหญิง', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('SOW-002', 'FARROW', NOW() - INTERVAL '66 days', 1, NULL, NULL, NULL, 12, 1, 0, 1.4, NULL, NULL),
  ('SOW-002', 'WEAN', NOW() - INTERVAL '45 days', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 11, 75.5);
