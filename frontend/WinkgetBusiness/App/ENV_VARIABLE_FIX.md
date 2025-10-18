# 🔧 MapTiler Environment Variable Fix

## Problem
`process.env.EXPO_PUBLIC_MAPTILER_KEY` is showing as `undefined` in the debug output.

## Root Cause
Expo environment variables require:
1. `.env` file in the correct location
2. Server restart after creating `.env` file
3. Proper variable naming with `EXPO_PUBLIC_` prefix

## Solutions (Choose One)

### 🚀 Solution 1: Direct API Key (Immediate Fix)
**Works immediately, no server restart needed**

1. Open `src/config/maptiler.js`
2. Find line 22: `API_KEY: 'YOUR_MAPTILER_API_KEY_HERE',`
3. Replace `YOUR_MAPTILER_API_KEY_HERE` with your actual MapTiler API key
4. Save the file
5. App will auto-reload with the map working

### 🔧 Solution 2: Environment Variable (Proper Setup)
**Requires server restart but follows best practices**

#### Step 1: Create .env file
Create `.env` file in `frontend/WinkgetBusiness/App/` directory:
```
EXPO_PUBLIC_MAPTILER_KEY=your_actual_api_key_here
```

#### Step 2: Update maptiler.js
In `src/config/maptiler.js`, uncomment line 19 and comment line 22:
```javascript
// Method 1: Environment variable (requires .env file and server restart)
API_KEY: process.env.EXPO_PUBLIC_MAPTILER_KEY || 'YOUR_MAPTILER_API_KEY_HERE',

// Method 2: Direct API key (works immediately - recommended for testing)
// API_KEY: 'YOUR_MAPTILER_API_KEY_HERE',
```

#### Step 3: Restart Expo Server
```bash
# Stop current server (Ctrl+C)
cd frontend/WinkgetBusiness/App
npm start
```

### 🎯 Solution 3: Hardcoded API Key (Production Ready)
**For production apps, replace with your actual key**

1. Open `src/config/maptiler.js`
2. Comment line 22 and uncomment line 25:
```javascript
// Method 2: Direct API key (works immediately - recommended for testing)
// API_KEY: 'YOUR_MAPTILER_API_KEY_HERE',

// Method 3: Hardcoded API key (replace with your actual key)
API_KEY: 'your_actual_mapTiler_api_key_here',
```
3. Replace `your_actual_mapTiler_api_key_here` with your real API key

## Debug Information
The enhanced debug function will now show:
- `process.env.EXPO_PUBLIC_MAPTILER_KEY`: Should show your key (not undefined)
- `MAPTILER_CONFIG.API_KEY`: Should show your key (not YOUR_MAPTILER_API_KEY_HERE)
- `All EXPO env vars`: List of all EXPO_ environment variables

## Why Environment Variables Fail
1. **Missing .env file**: File doesn't exist in App directory
2. **Server not restarted**: Expo needs restart to load new env vars
3. **Wrong location**: .env file must be in App root, not src/
4. **Wrong prefix**: Must use `EXPO_PUBLIC_` prefix for client-side access

## Quick Test
After implementing any solution, check the debug output:
```
=== MapTiler Debug Info ===
process.env.EXPO_PUBLIC_MAPTILER_KEY: your_key_here (not undefined)
MAPTILER_CONFIG.API_KEY: your_key_here (not YOUR_MAPTILER_API_KEY_HERE)
========================
```

## Recommendation
Use **Solution 1** for immediate testing, then switch to **Solution 2** for proper environment variable setup.
