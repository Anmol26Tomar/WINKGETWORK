# Quick Setup Guide

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/winkget-business
   JWT_SECRET=your_jwt_secret_key_here
   PORT=3001
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

5. **Seed initial data (optional):**
   ```bash
   node seed.js
   ```

## Frontend Setup (React Native)

1. **Navigate to React Native app directory:**
   ```bash
   cd frontend/WinkgetBusiness/App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on specific platforms:**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For Web
   ```

## Testing the App

1. **Backend should be running on:** `http://localhost:3001`
2. **API endpoints available at:** `http://localhost:3001/api/`
3. **Health check:** `http://localhost:3001/health`

## Sample Data

After running the seed script, you'll have:
- **Admin user:** admin@winkget.com / admin123
- **4 sample businesses:** Food Delivery, Marketplace, Finance, Express
- **Sample vendors and products** for each business

## Troubleshooting

### Common Issues:

1. **Metro bundler issues:** Clear cache with `npx expo start --clear`
2. **Dependency conflicts:** Delete `node_modules` and `package-lock.json`, then `npm install`
3. **Backend connection:** Ensure MongoDB is running and backend server is started
4. **Port conflicts:** Change PORT in `.env` file if 3001 is occupied

### Development Tips:

- Use Expo Go app on your phone for testing
- Enable hot reloading for faster development
- Check console logs for debugging
- Use React Native Debugger for advanced debugging

## Next Steps

1. Customize the business colors and themes
2. Add more business types
3. Implement additional features like search, filters
4. Add push notifications
5. Integrate payment systems
6. Add offline support
