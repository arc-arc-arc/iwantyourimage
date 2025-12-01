-- Supabase Storage Policies for 'gallery' bucket
-- Run these statements ONE AT A TIME in Supabase SQL Editor

-- Step 1: Drop existing policies if they exist (optional, run if you get "already exists" errors)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Step 2: Create policy for uploads (INSERT)
-- Copy and paste this into SQL Editor and run it:
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'gallery');

-- Step 3: Create policy for reads (SELECT)
-- Copy and paste this into SQL Editor and run it separately:
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'gallery');

