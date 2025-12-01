# Vercel Setup Instructions

## Environment Variables

Since `config.js` is not committed to git (for security), you need to set your Supabase credentials as environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://wpsxzdivbmxogqqfvxgb.supabase.co`
   
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwc3h6ZGl2Ym14b2dxcWZ2eGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEwNDIsImV4cCI6MjA4MDE4NzA0Mn0.0I40DrIRhA8AaOHSVIPPjeX_enx6XYzndbNRfwzx210`

4. Make sure to select **Production**, **Preview**, and **Development** environments
5. Click **Save**

## Alternative: Inject via Build Script

If environment variables don't work with static HTML, create a `vercel-build.sh` script that injects the variables into your HTML files, or use a simple Node.js script during build.

## After Deployment

1. Visit your Vercel site
2. Upload an image to test
3. Check the browser console (F12) for upload confirmations
4. Visit the gallery page to see uploaded images

