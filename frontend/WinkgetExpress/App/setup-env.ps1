# PowerShell script to setup environment variables
# Run this script in PowerShell: .\setup-env.ps1

Write-Host "Setting up environment variables..." -ForegroundColor Cyan

# Create .env file for development
@"
# API Configuration - Development
EXPO_PUBLIC_API_BASE=https://captain-winkget-express.vercel.app

# App Environment
APP_ENV=development

# Socket Configuration
EXPO_PUBLIC_SOCKET_URL=https://captain-winkget-express.vercel.app
"@ | Out-File -FilePath .env -Encoding utf8

# Create .env.production file
@"
# API Configuration - Production
EXPO_PUBLIC_API_BASE=https://captain-winkget-express.vercel.app

# App Environment
APP_ENV=production

# Socket Configuration
EXPO_PUBLIC_SOCKET_URL=https://captain-winkget-express.vercel.app
"@ | Out-File -FilePath .env.production -Encoding utf8

Write-Host "✅ Environment files created!" -ForegroundColor Green
Write-Host "📝 Please review and update the API URLs in .env and .env.production files" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update EXPO_PUBLIC_API_BASE with your actual backend URL"
Write-Host "2. Run: npm install"
Write-Host "3. Run: eas build --platform android --profile preview-apk"
