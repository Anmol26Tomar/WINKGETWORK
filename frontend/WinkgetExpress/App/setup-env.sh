#!/bin/bash

# Setup script for environment variables
# Run this script: bash setup-env.sh

echo "Setting up environment variables..."

# Create .env file for development
cat > .env << EOF
# API Configuration - Development
EXPO_PUBLIC_API_BASE=https://captain-winkget-express.vercel.app

# App Environment
APP_ENV=development

# Socket Configuration
EXPO_PUBLIC_SOCKET_URL=https://captain-winkget-express.vercel.app
EOF

# Create .env.production file
cat > .env.production << EOF
# API Configuration - Production
EXPO_PUBLIC_API_BASE=https://captain-winkget-express.vercel.app

# App Environment
APP_ENV=production

# Socket Configuration
EXPO_PUBLIC_SOCKET_URL=https://captain-winkget-express.vercel.app
EOF

echo "✅ Environment files created!"
echo "📝 Please review and update the API URLs in .env and .env.production files"
echo ""
echo "Next steps:"
echo "1. Update EXPO_PUBLIC_API_BASE with your actual backend URL"
echo "2. Run: npm install"
echo "3. Run: eas build --platform android --profile preview-apk"
