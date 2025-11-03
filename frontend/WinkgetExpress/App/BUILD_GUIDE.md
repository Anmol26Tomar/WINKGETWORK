# Android APK Build Guide for Winkget Express Agent App

This guide will walk you through building an Android APK for your Expo React Native app.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI** (install globally: `npm install -g eas-cli`)
4. **Expo Account** (free account works)
5. **Java Development Kit (JDK)** - Version 17 or higher
6. **Android Studio** (for Android SDK)

## Step 1: Install Dependencies

```bash
cd frontend/WinkgetExpress/App
npm install
```

## Step 2: Environment Variables Setup

Create the following environment files in the `App` directory:

### Create `.env` (for development)

Create a file named `.env` in the root of the `App` folder with:

```env
# API Configuration - Development
EXPO_PUBLIC_API_BASE=https://captain-winkget-express.vercel.app

# App Environment
APP_ENV=development

# Socket Configuration
EXPO_PUBLIC_SOCKET_URL=https://captain-winkget-express.vercel.app
```

### Create `.env.production` (for production builds)

Create a file named `.env.production` with:

```env
# API Configuration - Production
EXPO_PUBLIC_API_BASE=https://captain-winkget-express.vercel.app

# App Environment
APP_ENV=production

# Socket Configuration
EXPO_PUBLIC_SOCKET_URL=https://captain-winkget-express.vercel.app
```

**⚠️ Important**: 
- Replace `https://captain-winkget-express.vercel.app` with your actual backend API URL
- Never commit `.env` or `.env.production` files to git (they're already in `.gitignore`)
- For different environments (staging, production), create separate env files

## Step 3: Configure Expo Application Services (EAS)

### 3.1 Login to EAS

```bash
eas login
```

If you don't have an Expo account, create one at [expo.dev](https://expo.dev)

### 3.2 Configure EAS Build

```bash
eas build:configure
```

This will create/update your `eas.json` file.

## Step 4: Update App Configuration

The `app.json` file is already configured with:
- **Package Name**: `com.winkgetexpress.agent`
- **Android Permissions**: Location permissions for pickup/delivery addresses
- **Version**: `1.0.0`

### Update App Details (Optional)

Edit `app.json` to customize:
- `name`: App display name
- `version`: App version (increment for new releases)
- `android.package`: Your unique package identifier

## Step 5: Build APK

### Option A: Preview/Testing APK (Recommended for First Build)

```bash
eas build --platform android --profile preview-apk
```

This builds an APK with production environment variables for internal testing.

### Option B: Production APK

```bash
eas build --platform android --profile production-apk
```

This builds an APK optimized for production.

### Option C: Development APK (with dev client)

```bash
eas build --platform android --profile development
```

**Note**: Development builds require the Expo Go app or a custom development client.

## Step 6: Monitor Build Progress

After running the build command:
1. You'll get a link to monitor the build on Expo's website
2. The build typically takes 10-20 minutes
3. You'll receive an email when the build completes

## Step 7: Download APK

Once the build completes:
1. Visit the build page link provided
2. Click "Download" to get your APK file
3. The APK will be named something like: `app-1.0.0.apk`

## Step 8: Install APK on Android Device

### Method 1: Direct Install
1. Transfer the APK to your Android device
2. Open the APK file on your device
3. Allow "Install from Unknown Sources" if prompted
4. Follow the installation prompts

### Method 2: Via USB
```bash
adb install path/to/your-app.apk
```

## Troubleshooting

### Issue: "EAS CLI not found"
**Solution**: Install EAS CLI globally:
```bash
npm install -g eas-cli
```

### Issue: Build fails with environment variable errors
**Solution**: 
1. Ensure `.env.production` exists with `APP_ENV=production`
2. Check that `EXPO_PUBLIC_*` variables are set
3. Verify `babel.config.js` is configured correctly

### Issue: "Package name conflict"
**Solution**: Update `app.json` with a unique package name:
```json
"android": {
  "package": "com.yourcompany.winkgetagent"
}
```

### Issue: Build takes too long
**Solution**: This is normal. EAS builds in the cloud and can take 10-20 minutes.

### Issue: APK doesn't connect to backend
**Solution**:
1. Verify `EXPO_PUBLIC_API_BASE` in `.env.production` is correct
2. Ensure your backend server is accessible from the device
3. Check network permissions in `app.json`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE` | Your backend API base URL | `https://api.example.com` |
| `EXPO_PUBLIC_SOCKET_URL` | WebSocket server URL | `https://api.example.com` |
| `APP_ENV` | Environment identifier | `production` or `development` |

**Important Notes:**
- Variables prefixed with `EXPO_PUBLIC_` are embedded in the build
- Never include sensitive secrets (API keys, tokens) in client-side environment variables
- Update `eas.json` to include env vars in build profiles for different environments

## Local Build (Alternative - Requires Android Studio)

If you prefer building locally instead of using EAS:

```bash
# 1. Generate native Android project
npx expo prebuild --platform android

# 2. Build APK locally
cd android
./gradlew assembleRelease

# 3. APK will be in: android/app/build/outputs/apk/release/app-release.apk
```

**Note**: Local builds require:
- Android Studio installed
- Android SDK configured
- JDK 17+ installed
- More setup complexity

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)
- [Android App Bundle vs APK](https://developer.android.com/guide/app-bundle)

## Quick Command Reference

```bash
# Login to EAS
eas login

# Configure build
eas build:configure

# Build preview APK
eas build --platform android --profile preview-apk

# Build production APK
eas build --platform android --profile production-apk

# View build status
eas build:list

# Download build
# (Use the link provided after build or visit expo.dev)
```

---

**Need Help?** Check the Expo documentation or the error messages in your build logs.
