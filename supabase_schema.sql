-- Supabase Database Schema for CycleSync App
-- Run this script in the Supabase SQL Editor

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  goal TEXT,
  average_cycle_length INTEGER DEFAULT 28,
  average_period_length INTEGER DEFAULT 5,
  birth_control_type TEXT,
  birth_control_reminder_time TEXT,
  fertility_mode INTEGER DEFAULT 0,
  created_at TEXT
);

-- 2. Cycles Table
CREATE TABLE public.cycles (
  id TEXT PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_predicted INTEGER DEFAULT 0
);

-- 3. Daily Logs Table
CREATE TABLE public.daily_logs (
  date TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  flow TEXT,
  symptoms TEXT,
  moods TEXT,
  discharge TEXT,
  sleep_quality REAL,
  sex_drive REAL,
  bbt REAL,
  ovulation_test TEXT,
  pill_taken INTEGER DEFAULT 0,
  notes TEXT,
  PRIMARY KEY (date, profile_id)
);

-- Enable Row Level Security (RLS) for Privacy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies so users can only read/write their own data
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own cycles" ON public.cycles FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own cycles" ON public.cycles FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own cycles" ON public.cycles FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can view own logs" ON public.daily_logs FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = profile_id);
