-- Run this in the Supabase SQL Editor

-- 1. hr_users table
CREATE TABLE IF NOT EXISTS public.hr_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('hr', 'senior_hr', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for hr_users
ALTER TABLE public.hr_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read hr_users" ON public.hr_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin to manage hr_users" ON public.hr_users FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role = 'admin')
);

-- 2. generated_letters table
CREATE TABLE IF NOT EXISTS public.generated_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT NOT NULL,
    employee_email TEXT NOT NULL,
    letter_type TEXT NOT NULL,
    letter_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sent')),
    rejection_reason TEXT,
    created_by TEXT,
    created_by_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for generated_letters
ALTER TABLE public.generated_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR to manage letters" ON public.generated_letters FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role IN ('hr', 'senior_hr', 'admin'))
);

-- 3. employee_triggers table
CREATE TABLE IF NOT EXISTS public.employee_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT NOT NULL,
    employee_email TEXT UNIQUE NOT NULL,
    date_of_joining DATE NOT NULL,
    employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'resigned', 'terminated')),
    resignation_date DATE,
    onboarding_form_sent BOOLEAN NOT NULL DEFAULT FALSE,
    six_month_form_sent BOOLEAN NOT NULL DEFAULT FALSE,
    exit_form_sent BOOLEAN NOT NULL DEFAULT FALSE,
    date_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for employee_triggers
ALTER TABLE public.employee_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow HR to manage triggers" ON public.employee_triggers FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.hr_users WHERE id = auth.uid() AND role IN ('hr', 'senior_hr', 'admin'))
);
