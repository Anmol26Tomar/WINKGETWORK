# Quick Start: Build Android APK

## 🚀 Fast Track (5 Steps)

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Setup Environment Variables

**Option A: Use the setup script (Windows)**
```powershell
.\setup-env.ps1
```

**Option B: Use the setup script (Mac/Linux)**
```bash
bash setup-env.sh
```

**Option C: Create manually**
- Create `.env` file (copy from `.env.example` if exists)
- Create `.env.production` file
- Update `EXPO_PUBLIC_API_BASE` with your backend URL

### 3. Login to Expo
```bash
eas login
```

### 4. Build APK
```bash
eas build --platform android --profile preview-apk
```

### 5. Download & Install
- Wait for build to complete (10-20 min)
- Download APK from the link provided
- Install on Android device

---

## 📝 Environment Variables

Create these files in the `App` folder:

### `.env`
```env
EXPO_PUBLIC_API_BASE=https://captain-winkget-express.vercel.app
APP_ENV=development
EXPO_PUBLIC_SOCKET_URL=https://captain-winkget-express.vercel.app
```

### `.env.production`
```env
EXPO_PUBLIC_API_BASE=https://captain-winkget-express.vercel.app
APP_ENV=production
EXPO_PUBLIC_SOCKET_URL=https://captain-winkget-express.vercel.app
```

**⚠️ Remember**: Replace the URLs with your actual backend server address!

---

## 🔧 Build Profiles

| Profile | Use Case | Command |
|---------|----------|---------|
| `preview-apk` | Testing/Internal | `eas build --platform android --profile preview-apk` |
| `production-apk` | Production Release | `eas build --platform android --profile production-apk` |
| `development` | Development Build | `eas build --platform android --profile development` |

---

## ❓ Common Issues

**"EAS CLI not found"**
```bash
npm install -g eas-cli
```

**"Build fails"**
- Check that `.env.production` exists
- Verify environment variables are correct
- Check build logs on expo.dev

**"Can't install APK"**
- Enable "Install from Unknown Sources" in Android settings
- Or use: `adb install app.apk`

---

For detailed instructions, see [BUILD_GUIDE.md](./BUILD_GUIDE.md)
