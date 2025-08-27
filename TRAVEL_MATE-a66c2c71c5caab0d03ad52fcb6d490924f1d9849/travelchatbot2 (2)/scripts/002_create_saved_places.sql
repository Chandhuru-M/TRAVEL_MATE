-- Create saved places table to store user's favorite places
CREATE TABLE IF NOT EXISTS public.saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  foursquare_id TEXT,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  category TEXT,
  rating DECIMAL(3, 2),
  phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "saved_places_select_own" ON public.saved_places 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_places_insert_own" ON public.saved_places 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_places_update_own" ON public.saved_places 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "saved_places_delete_own" ON public.saved_places 
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON public.saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_foursquare_id ON public.saved_places(foursquare_id);
