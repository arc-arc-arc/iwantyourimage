# Supabase Setup Instructions

## 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy your:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

## 2. Create a Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name it `images` (or update `SUPABASE_BUCKET` in script.js if you use a different name)
4. Make it **Public** (so images can be viewed in the gallery)
5. Click **Create bucket**

## 3. Set Up Bucket Policies

1. Go to **Storage** → **Policies** for your `images` bucket
2. Add policies to allow:
   - **INSERT** (for uploading images)
   - **SELECT** (for reading/listing images)

Example policies:
- **For INSERT**: Allow authenticated or anonymous users to upload
- **For SELECT**: Allow public read access

## 4. Configure in Your Code

### Option A: Direct Configuration (for testing)

Add this to `index.html` and `gallery.html` before the closing `</body>` tag:

```html
<script>
  window.SUPABASE_URL = 'https://your-project.supabase.co';
  window.SUPABASE_ANON_KEY = 'your-anon-key-here';
</script>
<script src="script.js"></script>
```

### Option B: Vercel Environment Variables (recommended for production)

1. In Vercel dashboard, go to your project → **Settings** → **Environment Variables**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
3. Create a build script that injects these into your HTML files, or use a simple script tag that reads from `process.env` during build

### Option C: Use a Config Script

Create a `config.js` file (and add it to `.gitignore`):

```javascript
window.SUPABASE_URL = 'https://your-project.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key-here';
```

Then include it in your HTML:
```html
<script src="config.js"></script>
<script src="script.js"></script>
```

## 5. Test

1. Upload an image on the main page
2. Check the browser console for upload confirmation
3. Visit the gallery page to see all uploaded images

## Troubleshooting

- **Images not uploading**: Check browser console for errors, verify bucket name matches
- **Gallery empty**: Ensure bucket is public and policies allow SELECT
- **403 errors**: Check that your anon key has proper permissions

