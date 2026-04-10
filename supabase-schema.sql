-- Create Sows table
CREATE TABLE sows (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  parity INTEGER DEFAULT 1,
  current_cycle_start_date TIMESTAMP WITH TIME ZONE,
  farrow_date TIMESTAMP WITH TIME ZONE,
  wean_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Sow Events table
CREATE TABLE sow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id TEXT REFERENCES sows(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  piglet_count INTEGER,
  parity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Note: In a real production environment, you should also set up Row Level Security (RLS) policies.
-- For example:
-- ALTER TABLE sows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sow_events ENABLE ROW LEVEL SECURITY;
