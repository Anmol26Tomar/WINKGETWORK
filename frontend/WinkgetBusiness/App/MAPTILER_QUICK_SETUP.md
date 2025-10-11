# 🗺️ MapTiler API Key Setup - Quick Fix

## Current Issue
The environment variable `EXPO_PUBLIC_MAPTILER_KEY` is showing as `undefined` in the debug output.

## Quick Solution (Recommended)

### Step 1: Get Your MapTiler API Key
1. Visit [https://www.maptiler.com/](https://www.maptiler.com/)
2. Sign up for free (no credit card required)
3. Go to Dashboard → API Keys
4. Copy your API key

### Step 2: Add API Key Directly
1. Open `src/config/maptiler.js`
2. Find line 20: `API_KEY: 'YOUR_MAPTILER_API_KEY_HERE',`
3. Replace `YOUR_MAPTILER_API_KEY_HERE` with your actual API key
4. Save the file

### Step 3: Test
The app will automatically reload and show the interactive map!

## Alternative: Environment Variable Setup

If you prefer using environment variables:

### Step 1: Create .env file
Create a file named `.env` in `frontend/WinkgetBusiness/App/` directory:
```
EXPO_PUBLIC_MAPTILER_KEY=your_actual_api_key_here
```

### Step 2: Update maptiler.js
In `src/config/maptiler.js`, uncomment line 17 and comment line 20:
```javascript
// Option 1: Use environment variable (recommended)
API_KEY: process.env.EXPO_PUBLIC_MAPTILER_KEY || 'YOUR_MAPTILER_API_KEY_HERE',

// Option 2: Direct API key (uncomment and replace with your key)
// API_KEY: 'YOUR_MAPTILER_API_KEY_HERE',
```

### Step 3: Restart Expo
Stop the current Expo server (Ctrl+C) and restart:
```bash
cd frontend/WinkgetBusiness/App
npm start
```

## What You'll See After Setup

### Without API Key:
- Simple placeholder message
- "MapTiler API key not set" message

### With API Key:
- Full interactive map with MapTiler tiles
- Your location marker
- Google Maps-style interface
- Zoom and pan controls

## Debug Information
The debug function will show:
- `process.env.EXPO_PUBLIC_MAPTILER_KEY`: Should show your key (not undefined)
- `MAPTILER_CONFIG.API_KEY`: Should show your key (not YOUR_MAPTILER_API_KEY_HERE)

## Free Tier Limits
- 100,000 map loads per month
- Perfect for development and small apps
