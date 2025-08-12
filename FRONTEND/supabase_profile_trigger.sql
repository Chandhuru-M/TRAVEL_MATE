-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Change function owner if needed
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Remove old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created



  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();  AFTER INSERT ON auth.users












);  '{"full_name": "Test User", "avatar_url": "https://i.pravatar.cc/150?u=test@example.com"}'  NOW(),  'authenticated',  'authenticated',  'default',  'dummy',  'test@example.com',  'your-test-uuid-here',VALUES (INSERT INTO auth.users (id, email, encrypted_password, instance_id, aud, role, email_confirmed_at, raw_user_meta_data)-- Insert a test user (replace with a real UUID)-- List triggers
SELECT event_object_table, trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- List functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_type='FUNCTION' AND specific_schema='public';
