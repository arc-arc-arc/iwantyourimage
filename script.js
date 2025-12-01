let originalImage = null;
let alteredImageCanvas = null;
let selectedFrame = null;
const variationCanvases = [];
const framedCanvases = [];
let generationCount = 0; // Track number of image generations

const imageInput = document.getElementById('imageInput');
const outputCanvas = document.getElementById('outputCanvas');
const ctx = outputCanvas.getContext('2d');
const outputSection = document.getElementById('outputSection');
const moreBtn = document.getElementById('moreBtn');
const gallery = document.getElementById('gallery');

// Get or create user ID (stored in localStorage)
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        // Generate a unique user ID
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// Supabase configuration
// Priority: 1) window variables (from config.js), 2) Vercel env vars (NEXT_PUBLIC_*), 3) fallback values
// Note: anon key is public and safe to include in client-side code
// For Vercel: Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as environment variables
const SUPABASE_URL = window.SUPABASE_URL || (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_SUPABASE_URL) || 'https://wpsxzdivbmxogqqfvxgb.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwc3h6ZGl2Ym14b2dxcWZ2eGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEwNDIsImV4cCI6MjA4MDE4NzA0Mn0.0I40DrIRhA8AaOHSVIPPjeX_enx6XYzndbNRfwzx210';
const SUPABASE_BUCKET = window.SUPABASE_BUCKET || 'gallery';

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes('supabase.co')) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✓ Supabase client initialized');
    console.log('  URL:', SUPABASE_URL);
    console.log('  Bucket:', SUPABASE_BUCKET);
    console.log('  Anon key length:', SUPABASE_ANON_KEY.length);
} else {
    console.warn('⚠️ Supabase not configured properly');
    console.warn('  SUPABASE_URL:', SUPABASE_URL);
    console.warn('  SUPABASE_ANON_KEY exists:', !!SUPABASE_ANON_KEY);
    console.warn('  URL contains supabase.co:', SUPABASE_URL?.includes('supabase.co'));
}

// Available frame images (actual PNG files in FRAMES directory)
const frameFiles = [
    'Border_Frame_Clip_Art_Gold_PNG_Image.png',
    'Border_Frame_Gold_Ornate_PNG_Clipart.png',
    'Border_Frame_Gold_PNG_Clipart.png',
    'Gold_Border_Frame_Transparent_Clip_Art_Image.png',
    'Gold_Border_Frame_Transparent_PNG_Image.png'
];

// Load image
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Reset generation count when new image is uploaded
        generationCount = 0;
        
        // Reset button to original state
        if (moreBtn) {
            moreBtn.textContent = 'i want more image';
            moreBtn.classList.remove('gold-btn');
            moreBtn.classList.add('more-btn');
        }
        
        // Clear gallery when new image is uploaded
        if (gallery) {
            gallery.innerHTML = '';
        }
        variationCanvases.length = 0; // Clear previous variations
        framedCanvases.length = 0;    // Clear previous framed images
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                outputSection.style.display = 'none';
                applyRandomEffects();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Load random frame and composite image
function loadRandomFrame() {
    if (!alteredImageCanvas) return;
    
    // Randomly select a frame
    const randomIndex = randomInt(0, frameFiles.length - 1);
    const randomFrameFile = frameFiles[randomIndex];
    console.log('Selected frame index:', randomIndex, 'File:', randomFrameFile);
    console.log('Available frames:', frameFiles);
    
    const frameImg = new Image();
    
    // Note: crossOrigin doesn't work with file:// protocol
    // We'll use a compositing method that doesn't require getImageData()
    
    frameImg.onload = () => {
        selectedFrame = frameImg;
        console.log('✓ Frame loaded successfully:', randomFrameFile);
        console.log('Frame size:', frameImg.width, 'x', frameImg.height);
        console.log('Altered image canvas exists:', !!alteredImageCanvas);
        if (alteredImageCanvas) {
            console.log('Altered image size:', alteredImageCanvas.width, 'x', alteredImageCanvas.height);
        }
        compositeImageWithFrame();
    };
    
    frameImg.onerror = (error) => {
        console.error('Frame failed to load:', randomFrameFile, 'Path:', `./FRAMES/${randomFrameFile}`);
        console.error('Error details:', error);
        // If frame fails to load, just show the altered image
        outputCanvas.width = alteredImageCanvas.width;
        outputCanvas.height = alteredImageCanvas.height;
        ctx.drawImage(alteredImageCanvas, 0, 0);
        outputSection.style.display = 'block';
    };
    
    frameImg.src = `./FRAMES/${randomFrameFile}`;
}

// Composite altered image into frame
function compositeImageWithFrame() {
    if (!selectedFrame || !alteredImageCanvas) {
        console.error('✗ Missing frame or altered image');
        if (alteredImageCanvas) {
            // Fallback: show just the altered image
            outputCanvas.width = alteredImageCanvas.width;
            outputCanvas.height = alteredImageCanvas.height;
            ctx.drawImage(alteredImageCanvas, 0, 0);
            outputSection.style.display = 'block';
        }
        return;
    }
    
    console.log('Starting compositing...');
    console.log('Frame size:', selectedFrame.width, 'x', selectedFrame.height);
    console.log('Altered image size:', alteredImageCanvas.width, 'x', alteredImageCanvas.height);
    
    try {
        // Set canvas to frame size
        outputCanvas.width = selectedFrame.width;
        outputCanvas.height = selectedFrame.height;
        console.log('Canvas set to:', outputCanvas.width, 'x', outputCanvas.height);
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        // Draw frame first - this is the base layer
        ctx.drawImage(selectedFrame, 0, 0);
        console.log('✓ Frame drawn to canvas');
        
        // Calculate position and size for the image within the frame
        const insetPercent = 0.12; // 12% inset for frame border (less space between image and frame)
        const availableWidth = selectedFrame.width * (1 - insetPercent * 2);
        const availableHeight = selectedFrame.height * (1 - insetPercent * 2);
        
        // Scale image to fit within available space while maintaining aspect ratio
        const scaleWidth = availableWidth / alteredImageCanvas.width;
        const scaleHeight = availableHeight / alteredImageCanvas.height;
        const scale = Math.min(scaleWidth, scaleHeight);
        
        const imageWidth = alteredImageCanvas.width * scale;
        const imageHeight = alteredImageCanvas.height * scale;
        
        // Center the image within the available space
        const imageX = (selectedFrame.width - imageWidth) / 2;
        const imageY = (selectedFrame.height - imageHeight) / 2;
        
        console.log('Image placement - X:', imageX, 'Y:', imageY, 'W:', imageWidth, 'H:', imageHeight);
        console.log('Available space:', availableWidth, 'x', availableHeight);
        
        // Since we're using file:// protocol, we can't use getImageData()
        // Use compositing method that works with PNG transparency
        // Draw the altered image first in the center (scaled to fit)
        ctx.drawImage(alteredImageCanvas, imageX, imageY, imageWidth, imageHeight);
        console.log('✓ Altered image drawn in center');
        
        // Draw frame on top - transparent areas in PNG will show the image underneath
        // This works because PNG frames have transparency in the center opening
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(selectedFrame, 0, 0);
        console.log('✓ Frame drawn on top (transparent areas show image)');

        // Store a full-resolution framed version for download
        const framedCanvas = document.createElement('canvas');
        framedCanvas.width = outputCanvas.width;
        framedCanvas.height = outputCanvas.height;
        const framedCtx = framedCanvas.getContext('2d');
        framedCtx.drawImage(outputCanvas, 0, 0);
        framedCanvases.push(framedCanvas);
        
        // Upload to Supabase
        uploadImageToSupabase(framedCanvas);
        
        // Add all frames (including first) to gallery grid
        // All images will scale to fit the screen via CSS grid
        if (gallery) {
            const thumbCanvas = document.createElement('canvas');
            // Create thumbnail at reasonable size - CSS will scale it to fit grid
            const maxThumbSize = 300; // Base size, CSS grid will scale it
            const thumbScale = Math.min(maxThumbSize / outputCanvas.width, maxThumbSize / outputCanvas.height, 1);
            
            thumbCanvas.width = outputCanvas.width * thumbScale;
            thumbCanvas.height = outputCanvas.height * thumbScale;
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCtx.drawImage(outputCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
            gallery.appendChild(thumbCanvas);
            console.log('✓ Added image to gallery. Total images:', gallery.children.length);
        }
        
        // Hide the main outputCanvas since all frames go to gallery
        const frameContainer = document.querySelector('.frame-container');
        if (frameContainer) {
            frameContainer.style.display = 'none';
        }
        
        // Show output section and buttons
        outputSection.style.display = 'block';
        if (moreBtn) {
            moreBtn.style.display = 'inline-block';
        }
        console.log('✓ Output displayed');
    } catch (error) {
        console.error('✗ Error compositing:', error);
        console.error(error.stack);
        // Fallback: show just the altered image
        if (alteredImageCanvas) {
            outputCanvas.width = alteredImageCanvas.width;
            outputCanvas.height = alteredImageCanvas.height;
            ctx.drawImage(alteredImageCanvas, 0, 0);
            outputSection.style.display = 'block';
        }
    }
}


// Generate another random variation or go to gallery after 3 generations
if (moreBtn) {
    moreBtn.addEventListener('click', () => {
        if (!originalImage) return;
        
        // After 7 generations, redirect to gallery
        if (generationCount >= 7) {
            window.location.href = 'gallery.html';
            return;
        }
        
        // Otherwise, generate another variation
        applyRandomEffects();
    });
}

// Random number generator
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Apply random experimental effects (Man Ray style)
function applyRandomEffects() {
    if (!originalImage) return;
    
    // Increment generation count
    generationCount++;
    
    // After 7 generations, transform the button
    if (generationCount >= 7 && moreBtn) {
        moreBtn.textContent = 'i want all image';
        moreBtn.classList.add('gold-btn');
        moreBtn.classList.remove('more-btn');
    }

    // Keep canvas at original image size (for display)
    const displayWidth = originalImage.width;
    const displayHeight = originalImage.height;
    
    // Random resolution for pixelation (0.1 to 0.8 - lower = more pixelated)
    const resolution = random(0.1, 0.8);
    const pixelatedWidth = Math.round(displayWidth * resolution);
    const pixelatedHeight = Math.round(displayHeight * resolution);

    // Set canvas to display size
    outputCanvas.width = displayWidth;
    outputCanvas.height = displayHeight;
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw image at lower resolution first (for pixelation effect)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = pixelatedWidth;
    tempCanvas.height = pixelatedHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw original image at lower resolution
    tempCtx.drawImage(originalImage, 0, 0, pixelatedWidth, pixelatedHeight);
    
    // Scale up to display size (this creates pixelation)
    ctx.imageSmoothingEnabled = false; // Disable smoothing for crisp pixels
    ctx.drawImage(tempCanvas, 0, 0, displayWidth, displayHeight);
    ctx.imageSmoothingEnabled = true; // Re-enable for other effects
    
    let imageData = ctx.getImageData(0, 0, displayWidth, displayHeight);
    let data = imageData.data;

    // Randomly select 3-6 effects to apply
    const numEffects = randomInt(3, 6);
    const effects = [
        'solarization',
        'extremeContrast',
        'negative',
        'posterize',
        'extremeSaturation',
        'desaturate',
        'colorShift',
        'channelSwap',
        'extremeWarp',
        'barrelDistort',
        'pincushionDistort',
        'waveDistort',
        'kaleidoscope',
        'edgeDetect',
        'threshold'
    ];

    const selectedEffects = [];
    for (let i = 0; i < numEffects; i++) {
        const effect = effects[randomInt(0, effects.length - 1)];
        if (!selectedEffects.includes(effect)) {
            selectedEffects.push(effect);
        }
    }

    // Apply selected effects
    selectedEffects.forEach(effect => {
        switch(effect) {
            case 'solarization':
                applySolarization(data);
                break;
            case 'extremeContrast':
                applyExtremeContrast(data);
                break;
            case 'negative':
                applyNegative(data);
                break;
            case 'posterize':
                applyPosterize(data);
                break;
            case 'extremeSaturation':
                applyExtremeSaturation(data);
                break;
            case 'desaturate':
                applyDesaturate(data);
                break;
            case 'colorShift':
                applyColorShift(data);
                break;
            case 'channelSwap':
                applyChannelSwap(data);
                break;
            case 'extremeWarp':
                imageData = applyExtremeWarp(imageData, displayWidth, displayHeight);
                data = imageData.data;
                break;
            case 'barrelDistort':
                imageData = applyBarrelDistort(imageData, displayWidth, displayHeight);
                data = imageData.data;
                break;
            case 'pincushionDistort':
                imageData = applyPincushionDistort(imageData, displayWidth, displayHeight);
                data = imageData.data;
                break;
            case 'waveDistort':
                imageData = applyWaveDistort(imageData, displayWidth, displayHeight);
                data = imageData.data;
                break;
            case 'kaleidoscope':
                imageData = applyKaleidoscope(imageData, displayWidth, displayHeight);
                data = imageData.data;
                break;
            case 'edgeDetect':
                imageData = applyEdgeDetect(imageData, displayWidth, displayHeight);
                data = imageData.data;
                break;
            case 'threshold':
                applyThreshold(data);
                break;
        }
    });

    ctx.putImageData(imageData, 0, 0);
    
    // Store the altered image
    alteredImageCanvas = document.createElement('canvas');
    alteredImageCanvas.width = displayWidth;
    alteredImageCanvas.height = displayHeight;
    const alteredCtx = alteredImageCanvas.getContext('2d');
    alteredCtx.drawImage(outputCanvas, 0, 0);
    
    // Also store this variation (unframed) for multi-variation download
    const variationCanvas = document.createElement('canvas');
    variationCanvas.width = displayWidth;
    variationCanvas.height = displayHeight;
    const variationCtx = variationCanvas.getContext('2d');
    variationCtx.drawImage(outputCanvas, 0, 0);
    variationCanvases.push(variationCanvas);
    
    // Load and apply random frame
    loadRandomFrame();
}

// Solarization (Sabattier effect) - Man Ray signature
function applySolarization(data) {
    const threshold = random(100, 200);
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] < threshold) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    }
}

// Extreme contrast
function applyExtremeContrast(data) {
    const factor = random(2, 5);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    }
}

// Negative/inversion
function applyNegative(data) {
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
    }
}

// Posterization (reduce color levels)
function applyPosterize(data) {
    const levels = randomInt(3, 8);
    const step = 255 / levels;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(data[i] / step) * step;
        data[i + 1] = Math.floor(data[i + 1] / step) * step;
        data[i + 2] = Math.floor(data[i + 2] / step) * step;
    }
}

// Extreme saturation
function applyExtremeSaturation(data) {
    const factor = random(2, 4);
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = Math.min(255, Math.max(0, gray + (data[i] - gray) * factor));
        data[i + 1] = Math.min(255, Math.max(0, gray + (data[i + 1] - gray) * factor));
        data[i + 2] = Math.min(255, Math.max(0, gray + (data[i + 2] - gray) * factor));
    }
}

// Desaturate
function applyDesaturate(data) {
    const amount = random(0.3, 0.9);
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = data[i] * (1 - amount) + gray * amount;
        data[i + 1] = data[i + 1] * (1 - amount) + gray * amount;
        data[i + 2] = data[i + 2] * (1 - amount) + gray * amount;
    }
}

// Color shift
function applyColorShift(data) {
    const shift = randomInt(-50, 50);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + shift));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - shift));
    }
}

// Channel swap
function applyChannelSwap(data) {
    const swapType = randomInt(0, 2);
    for (let i = 0; i < data.length; i += 4) {
        if (swapType === 0) {
            // Swap R and G
            [data[i], data[i + 1]] = [data[i + 1], data[i]];
        } else if (swapType === 1) {
            // Swap G and B
            [data[i + 1], data[i + 2]] = [data[i + 2], data[i + 1]];
        } else {
            // Swap R and B
            [data[i], data[i + 2]] = [data[i + 2], data[i]];
        }
    }
}

// Extreme warping
function applyExtremeWarp(imageData, width, height) {
    const warpX = random(-80, 80);
    const warpY = random(-80, 80);
    return applyWarp(imageData, width, height, warpX, warpY, 0);
}

// Barrel distortion
function applyBarrelDistort(imageData, width, height) {
    const strength = random(0.3, 0.8);
    return applyDistortion(imageData, width, height, strength);
}

// Pincushion distortion
function applyPincushionDistort(imageData, width, height) {
    const strength = random(-0.8, -0.3);
    return applyDistortion(imageData, width, height, strength);
}

// Wave distortion
function applyWaveDistort(imageData, width, height) {
    const sourceData = imageData.data;
    const destData = ctx.createImageData(width, height);
    const destPixels = destData.data;
    
    const amplitude = random(10, 40);
    const frequency = random(0.01, 0.05);
    const direction = random(0, Math.PI * 2);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const waveX = Math.sin(y * frequency + direction) * amplitude;
            const waveY = Math.cos(x * frequency + direction) * amplitude;
            
            let sourceX = Math.round(x + waveX);
            let sourceY = Math.round(y + waveY);
            
            sourceX = Math.max(0, Math.min(width - 1, sourceX));
            sourceY = Math.max(0, Math.min(height - 1, sourceY));
            
            const sourceIndex = (sourceY * width + sourceX) * 4;
            const destIndex = (y * width + x) * 4;
            
            destPixels[destIndex] = sourceData[sourceIndex];
            destPixels[destIndex + 1] = sourceData[sourceIndex + 1];
            destPixels[destIndex + 2] = sourceData[sourceIndex + 2];
            destPixels[destIndex + 3] = sourceData[sourceIndex + 3];
        }
    }
    
    return destData;
}

// Kaleidoscope effect
function applyKaleidoscope(imageData, width, height) {
    const sourceData = imageData.data;
    const destData = ctx.createImageData(width, height);
    const destPixels = destData.data;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const segments = randomInt(4, 12);
    const angle = (Math.PI * 2) / segments;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            let theta = Math.atan2(dy, dx);
            
            // Mirror into first segment
            theta = theta % (angle * 2);
            if (theta > angle) {
                theta = angle * 2 - theta;
            }
            
            const sourceX = Math.round(centerX + Math.cos(theta) * distance);
            const sourceY = Math.round(centerY + Math.sin(theta) * distance);
            
            const sx = Math.max(0, Math.min(width - 1, sourceX));
            const sy = Math.max(0, Math.min(height - 1, sourceY));
            
            const sourceIndex = (sy * width + sx) * 4;
            const destIndex = (y * width + x) * 4;
            
            destPixels[destIndex] = sourceData[sourceIndex];
            destPixels[destIndex + 1] = sourceData[sourceIndex + 1];
            destPixels[destIndex + 2] = sourceData[sourceIndex + 2];
            destPixels[destIndex + 3] = sourceData[sourceIndex + 3];
        }
    }
    
    return destData;
}

// Edge detection
function applyEdgeDetect(imageData, width, height) {
    const sourceData = imageData.data;
    const destData = ctx.createImageData(width, height);
    const destPixels = destData.data;
    
    const threshold = random(20, 60);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // Sobel operator
            const gx = 
                -1 * getGray(sourceData, width, x - 1, y - 1) +
                1 * getGray(sourceData, width, x + 1, y - 1) +
                -2 * getGray(sourceData, width, x - 1, y) +
                2 * getGray(sourceData, width, x + 1, y) +
                -1 * getGray(sourceData, width, x - 1, y + 1) +
                1 * getGray(sourceData, width, x + 1, y + 1);
            
            const gy = 
                -1 * getGray(sourceData, width, x - 1, y - 1) +
                -2 * getGray(sourceData, width, x, y - 1) +
                -1 * getGray(sourceData, width, x + 1, y - 1) +
                1 * getGray(sourceData, width, x - 1, y + 1) +
                2 * getGray(sourceData, width, x, y + 1) +
                1 * getGray(sourceData, width, x + 1, y + 1);
            
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            const edge = magnitude > threshold ? 255 : 0;
            
            destPixels[idx] = edge;
            destPixels[idx + 1] = edge;
            destPixels[idx + 2] = edge;
            destPixels[idx + 3] = 255;
        }
    }
    
    return destData;
}

function getGray(data, width, x, y) {
    const idx = (y * width + x) * 4;
    return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
}

// Threshold
function applyThreshold(data) {
    const threshold = random(80, 180);
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const value = gray > threshold ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
    }
}

// Helper functions for warping and distortion
function applyWarp(imageData, width, height, warpX, warpY, distortion) {
    const sourceData = imageData.data;
    const destData = ctx.createImageData(width, height);
    const destPixels = destData.data;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sourceX = x + (x - centerX) * (warpX / 100);
            let sourceY = y + (y - centerY) * (warpY / 100);
            
            sourceX = Math.max(0, Math.min(width - 1, Math.round(sourceX)));
            sourceY = Math.max(0, Math.min(height - 1, Math.round(sourceY)));
            
            const sourceIndex = (sourceY * width + sourceX) * 4;
            const destIndex = (y * width + x) * 4;
            
            destPixels[destIndex] = sourceData[sourceIndex];
            destPixels[destIndex + 1] = sourceData[sourceIndex + 1];
            destPixels[destIndex + 2] = sourceData[sourceIndex + 2];
            destPixels[destIndex + 3] = sourceData[sourceIndex + 3];
        }
    }
    
    return destData;
}

function applyDistortion(imageData, width, height, strength) {
    const sourceData = imageData.data;
    const destData = ctx.createImageData(width, height);
    const destPixels = destData.data;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const normalizedDist = distance / maxDist;
            
            const factor = 1 + strength * normalizedDist * normalizedDist;
            let sourceX = centerX + dx * factor;
            let sourceY = centerY + dy * factor;
            
            sourceX = Math.max(0, Math.min(width - 1, Math.round(sourceX)));
            sourceY = Math.max(0, Math.min(height - 1, Math.round(sourceY)));
            
            const sourceIndex = (sourceY * width + sourceX) * 4;
            const destIndex = (y * width + x) * 4;
            
            destPixels[destIndex] = sourceData[sourceIndex];
            destPixels[destIndex + 1] = sourceData[sourceIndex + 1];
            destPixels[destIndex + 2] = sourceData[sourceIndex + 2];
            destPixels[destIndex + 3] = sourceData[sourceIndex + 3];
        }
    }
    
    return destData;
}

// Upload image to Supabase storage
async function uploadImageToSupabase(canvas) {
    console.log('uploadImageToSupabase called');
    console.log('supabaseClient exists:', !!supabaseClient);
    console.log('SUPABASE_BUCKET:', SUPABASE_BUCKET);
    
    if (!supabaseClient) {
        console.error('❌ Supabase not configured, skipping upload');
        console.error('SUPABASE_URL:', SUPABASE_URL);
        console.error('SUPABASE_ANON_KEY exists:', !!SUPABASE_ANON_KEY);
        return;
    }
    
    try {
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            if (!blob) {
                console.error('❌ Failed to convert canvas to blob');
                return;
            }
            
            console.log('✓ Canvas converted to blob, size:', blob.size, 'bytes');
            
            // Get user ID and generate unique filename
            const userId = getUserId();
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 15);
            const randomFilename = `${timestamp}-${randomId}.png`;
            
            // Create object key: ${userId}/${randomFilename}
            const objectKey = `${userId}/${randomFilename}`;
            
            console.log('📤 Uploading to Supabase...');
            console.log('  Bucket:', SUPABASE_BUCKET);
            console.log('  Object key:', objectKey);
            console.log('  User ID:', userId);
            
            // Upload to Supabase bucket
            const { data, error } = await supabaseClient.storage
                .from(SUPABASE_BUCKET)
                .upload(objectKey, blob, {
                    contentType: 'image/png',
                    upsert: false
                });
            
            if (error) {
                console.error('❌ Error uploading to Supabase:', error);
                console.error('  Error message:', error.message);
                console.error('  Error code:', error.statusCode);
            } else {
                console.log('✅ Image uploaded successfully to Supabase!');
                console.log('  Path:', data.path);
                console.log('  Full URL:', supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(data.path).data.publicUrl);
            }
        }, 'image/png');
    } catch (error) {
        console.error('❌ Exception in uploadImageToSupabase:', error);
        console.error('  Stack:', error.stack);
    }
}
