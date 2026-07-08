-- =============================================================================
-- ALOK HR System – RLS Fix for anon key usage
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bbbpbdxnxnprhtgpqpnr/sql/new
-- =============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. generated_letters table – allow anon to INSERT, SELECT, UPDATE
-- ─────────────────────────────────────────────────────────────

-- Allow anon to create letters (submit for approval)
CREATE POLICY "Allow anon to insert letters"
  ON public.generated_letters
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to read letters
CREATE POLICY "Allow anon to read letters"
  ON public.generated_letters
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update letters (approve/reject/send status changes)
CREATE POLICY "Allow anon to update letters"
  ON public.generated_letters
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 2. Storage bucket "letters" – allow anon to upload and read PDFs
-- ─────────────────────────────────────────────────────────────

-- Allow anon to upload (INSERT) PDFs into the letters bucket
CREATE POLICY "Allow anon to upload to letters bucket"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'letters');

-- Allow anon to update/upsert (needed when upsert: true is used)
CREATE POLICY "Allow anon to update letters bucket"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'letters')
  WITH CHECK (bucket_id = 'letters');

-- Allow public read of PDFs (so email download links work without auth)
CREATE POLICY "Allow public read of letters bucket"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'letters');


-- ─────────────────────────────────────────────────────────────
-- 3. employee_triggers table – allow anon to insert (non-critical)
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "Allow anon to insert employee triggers"
  ON public.employee_triggers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to read employee triggers"
  ON public.employee_triggers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update employee triggers"
  ON public.employee_triggers
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- 4. Make sure the "letters" bucket is public
-- Uncomment and run separately ONLY if the bucket doesn't exist yet:
-- ─────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('letters', 'letters', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;
