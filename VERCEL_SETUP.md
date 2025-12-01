# Vercel Setup Instructions

## Environment Variables (Required)

**Important:** You must set these environment variables in Vercel for Supabase to work properly. These are exposed to the browser (which is safe for the anon key).

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://wpsxzdivbmxogqqfvxgb.supabase.co`
   - **Environment**: Select **Production**, **Preview**, and **Development**
   
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_KEY` - both work)
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwc3h6ZGl2Ym14b2dxcWZ2eGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEwNDIsImV4cCI6MjA4MDE4NzA0Mn0.0I40DrIRhA8AaOHSVIPPjeX_enx6XYzndbNRfwzx210`
   - **Environment**: Select **Production**, **Preview**, and **Development**
   
   **Note:** The variable name should be `NEXT_PUBLIC_SUPABASE_ANON_KEY` (with "ANON" in it), but the build script also accepts `NEXT_PUBLIC_SUPABASE_KEY` as a fallback.

4. Click **Save**

**Note:** The build script (`build.js`) will automatically create `config.js` from these environment variables during deployment.

## Alternative: Inject via Build Script

If environment variables don't work with static HTML, create a `vercel-build.sh` script that injects the variables into your HTML files, or use a simple Node.js script during build.

## After Deployment

1. Visit your Vercel site
2. Upload an image to test
3. Check the browser console (F12) for upload confirmations
4. Visit the gallery page to see uploaded images

