-- =============================================================================
-- ALOK HR System – COMPLETE FIX (run this ONE script in Supabase SQL Editor)
-- https://supabase.com/dashboard/project/bbbpbdxnxnprhtgpqpnr/sql/new
--
-- This combines: missing columns + FK drop + DELETE policy + storage bucket
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS / ON CONFLICT everywhere)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────
-- 1. Add missing columns the app code expects
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.generated_letters
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS date_of_joining TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by_email TEXT;


-- ─────────────────────────────────────────────────────────────
-- 2. Drop FK constraints on created_by / approved_by
--    (App uses localStorage IDs like "hr-user-1", not auth.uid() UUIDs)
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  fk_name TEXT;
BEGIN
  FOR fk_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.generated_letters'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE 'ALTER TABLE public.generated_letters DROP CONSTRAINT ' || quote_ident(fk_name);
  END LOOP;
END $$;

-- Convert to TEXT so any string ID is accepted
ALTER TABLE public.generated_letters
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- approved_by might still be UUID — convert it too
DO $$
BEGIN
  ALTER TABLE public.generated_letters
    ALTER COLUMN approved_by TYPE TEXT USING approved_by::TEXT;
EXCEPTION WHEN others THEN
  NULL; -- already TEXT, skip
END $$;


-- ─────────────────────────────────────────────────────────────
-- 3. Add missing DELETE policy for generated_letters (anon)
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generated_letters'
      AND policyname = 'Allow anon to delete letters'
  ) THEN
    CREATE POLICY "Allow anon to delete letters"
      ON public.generated_letters
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 4. Add missing DELETE policy for storage.objects (anon, letters bucket)
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'Allow anon to delete from letters bucket'
  ) THEN
    CREATE POLICY "Allow anon to delete from letters bucket"
      ON storage.objects
      FOR DELETE
      TO anon
      USING (bucket_id = 'letters');
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 5. Remove unique constraint on employee email (allows re-sends)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.employee_triggers
  DROP CONSTRAINT IF EXISTS employee_triggers_employee_email_key;


-- ─────────────────────────────────────────────────────────────
-- 6. Ensure "letters" storage bucket exists and is public
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'letters',
  'letters',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;


-- ─────────────────────────────────────────────────────────────
-- 7. Verify
-- ─────────────────────────────────────────────────────────────

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'generated_letters'
ORDER BY ordinal_position;
