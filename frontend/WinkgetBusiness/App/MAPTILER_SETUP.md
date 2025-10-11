# Google Maps-Style Setup with MapTiler

## Getting Your Free MapTiler API Key

1. **Visit MapTiler**: Go to [https://www.maptiler.com/](https://www.maptiler.com/)

2. **Sign Up**: Create a free account (no credit card required)

3. **Get API Key**: 
   - Go to your account dashboard
   - Navigate to "API Keys" section
   - Copy your API key

4. **Configure the App**:
   - Open `src/config/maptiler.js`
   - Replace `YOUR_MAPTILER_API_KEY_HERE` with your actual API key
   - Save the file

## Example Configuration

```javascript
// In src/config/maptiler.js
export const MAPTILER_CONFIG = {
  API_KEY: 'your_actual_api_key_here', // Replace this
  // ... rest of config
};
```

## Google Maps-Style Features

### **Map Styles (Google Maps Compatible)**
- **streets-v2**: Google Maps street view (default)
- **satellite**: Google Earth satellite imagery
- **hybrid**: Google Maps hybrid (satellite + labels)
- **outdoors-v2**: Google Maps terrain style
- **light-v2**: Google Maps light theme
- **dark-v2**: Google Maps dark theme

### **Google Maps-Style Interface**
✅ **Google Maps Visual Style**: Same look and feel as Google Maps
✅ **Google-Style Markers**: Blue circular markers like Google Maps
✅ **Google Maps Popups**: Google-style popup design and typography
✅ **Google Maps Controls**: Zoom controls styled like Google Maps
✅ **Google Maps Colors**: Google's blue (#4285F4) color scheme
✅ **Google Maps Behavior**: Same interaction patterns as Google Maps
✅ **Location Button**: Google Maps-style location button
✅ **Scale Control**: Google Maps-style scale indicator
✅ **Accuracy Circle**: Google Maps-style location accuracy indicator

## Free Tier Limits

- **100,000 map loads per month**
- **Perfect for development and small apps**
- **No credit card required**

## Troubleshooting

If the map doesn't load:
1. Check your API key is correct
2. Ensure you have internet connection
3. Verify location permissions are granted
4. Check console for any error messages

## Support

- MapTiler Documentation: [https://docs.maptiler.com/](https://docs.maptiler.com/)
- Expo Maps Documentation: [https://docs.expo.dev/versions/latest/sdk/map-view/](https://docs.expo.dev/versions/latest/sdk/map-view/)
