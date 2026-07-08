import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbbpbdxnxnprhtgpqpnr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYnBiZHhueG5wcmh0Z3BxcG5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5ODQwMDcsImV4cCI6MjA5ODU2MDAwN30.K4DfGy6y9Ldo6ydYfDimlQZM13e9rRyvNQfhsykjByo';

export const isSupabaseConfigured = true;
export const supabase = createClient(supabaseUrl, supabaseKey);
