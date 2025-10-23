# API Configuration Guide

## Current Configuration
The app is configured to use your machine's IP address: `http://10.134.88.162:5000/api`

## If Network Issues Persist

### Option 1: Try Alternative IP Addresses
Update `frontend/WinkgetBusiness/App/src/config/api.js` line 19:

```javascript
// Try these IP addresses one by one:
return 'http://10.0.2.2:5000/api';        // Traditional Android emulator IP
return 'http://localhost:5000/api';      // If using web version
return 'http://127.0.0.1:5000/api';        // Alternative localhost
```

### Option 2: Use Environment Variable
Create a `.env` file in `frontend/WinkgetBusiness/App/` with:
```
EXPO_PUBLIC_API_BASE_URL=http://10.134.88.162:5000/api
```

### Option 3: Check Windows Firewall
1. Open Windows Defender Firewall
2. Allow Node.js through firewall
3. Or temporarily disable firewall for testing

## Testing Connectivity
The app will automatically test connectivity and show results in the console.
