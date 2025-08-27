-- Create user locations table to store user's current location
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "user_locations_select_own" ON public.user_locations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_locations_insert_own" ON public.user_locations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_locations_update_own" ON public.user_locations 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_locations_delete_own" ON public.user_locations 
  FOR DELETE USING (auth.uid() = user_id);
