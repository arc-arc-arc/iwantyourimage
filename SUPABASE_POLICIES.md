# Supabase Storage Policies Setup

Your `gallery` bucket needs policies to allow uploads and reads. Here's how to set them up:

## Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → Click on your `gallery` bucket
3. Go to the **Policies** tab
4. Click **"New Policy"** or **"Add Policy"**

### Policy 1: Allow Public Uploads (INSERT)

**Policy Name:** `Allow public uploads`

**Policy Definition:**
- **Allowed operation:** INSERT
- **Target roles:** anon, authenticated
- **Policy definition (SQL):**
```sql
(bucket_id = 'gallery'::text) AND (auth.role() = 'anon'::text OR auth.role() = 'authenticated'::text)
```

Or use the visual policy editor:
- **Operation:** INSERT
- **Allowed:** true
- **Check:** Leave empty (or add: `bucket_id = 'gallery'`)
- **With check:** Leave empty

### Policy 2: Allow Public Reads (SELECT)

**Policy Name:** `Allow public reads`

**Policy Definition:**
- **Allowed operation:** SELECT
- **Target roles:** anon, authenticated  
- **Policy definition (SQL):**
```sql
(bucket_id = 'gallery'::text) AND (auth.role() = 'anon'::text OR auth.role() = 'authenticated'::text)
```

Or use the visual policy editor:
- **Operation:** SELECT
- **Allowed:** true
- **Check:** Leave empty (or add: `bucket_id = 'gallery'`)
- **With check:** Leave empty

## Option 2: Using SQL Editor (Advanced)

Go to **SQL Editor** in Supabase and run these **ONE AT A TIME** (run each statement separately):

### Step 1: Allow public uploads
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'gallery');
```

### Step 2: Allow public reads
```sql
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'gallery');
```

**Important:** Run each CREATE POLICY statement separately, not all at once!

If you get an error that the policy already exists, first drop it:
```sql
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
```

Then create them again.

## Quick Fix: If You Get Syntax Errors

If you're getting syntax errors, try this approach:

1. Go to **SQL Editor** in Supabase
2. Run **ONLY this first statement** (copy the entire block):
```sql
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
```

3. Then run **ONLY this second statement**:
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'gallery');
```

4. Then run **ONLY this third statement**:
```sql
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
```

5. Finally, run **ONLY this fourth statement**:
```sql
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'gallery');
```

**Key:** Run each statement separately, one at a time. Don't run multiple statements together.

## Option 3: More Restrictive (Recommended for Production)

If you want to restrict uploads to specific paths (user folders):

```sql
-- Allow uploads only to user folders
CREATE POLICY "Allow uploads to user folders"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'gallery' 
  AND (storage.foldername(name))[1] LIKE 'user_%'
);

-- Allow reads from anywhere in gallery
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'gallery');
```

## Verify Policies

After creating policies:
1. Go to **Storage** → `gallery` → **Policies**
2. You should see at least 2 policies:
   - One for INSERT (uploads)
   - One for SELECT (reads)

## Test

After setting up policies:
1. Try uploading an image on your site
2. Check browser console for upload confirmation
3. Check Supabase Storage → `gallery` bucket to see the uploaded file

