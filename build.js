// Build script for Vercel - injects environment variables into HTML files
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'gallery';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('⚠️  Supabase credentials not found in environment variables');
  console.log('   The site will work if config.js is present');
  process.exit(0);
}

// Create config.js with environment variables
const configContent = `// Supabase Configuration (injected from Vercel environment variables)
window.SUPABASE_URL = '${SUPABASE_URL}';
window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
window.SUPABASE_BUCKET = '${SUPABASE_BUCKET}';
`;

fs.writeFileSync(path.join(__dirname, 'config.js'), configContent);
console.log('✓ Created config.js from environment variables');

