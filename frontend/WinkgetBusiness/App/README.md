# Winkget Business - React Native App

A comprehensive multi-business React Native application that provides access to multiple business types including food delivery, marketplace, finance, express delivery, and more.

## Features

### 🏠 Home Page
- Business listing with beautiful cards
- Multiple business categories
- Real-time statistics
- Smooth navigation

### 🏢 Business Pages
- Detailed business information
- Vendor listings
- Product catalogs
- Contact information
- Business-specific features

### 👤 User Authentication
- Secure JWT-based authentication
- User registration and login
- Profile management
- Business access control

### 🛍️ Vendor & Product Management
- Vendor profiles with ratings
- Product listings with images
- Search and filter functionality
- Reviews and ratings system

## Tech Stack

- **React Native** with Expo
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **Expo Linear Gradient** for gradients
- **Axios** for API calls
- **AsyncStorage** for local storage
- **Context API** for state management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on specific platforms:
```bash
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── VendorCard.js
│   └── ProductCard.js
├── config/              # Configuration files
│   └── api.js
├── context/             # Context providers
│   ├── AuthContext.js
│   └── BusinessContext.js
├── navigation/          # Navigation setup
│   └── AppNavigator.js
├── screens/             # Screen components
│   ├── auth/
│   ├── business/
│   ├── home/
│   └── placeholder/
├── theme/               # Theme configuration
│   └── theme.js
└── App.js              # Main app component
```

## API Integration

The app integrates with the Winkget Business backend API:

- **Authentication**: User registration, login, profile management
- **Businesses**: List all businesses, get business details
- **Vendors**: Vendor listings, details, products
- **Products**: Product catalogs, search, details
- **Reviews**: Rating and review system

## Business Types Supported

1. **Food Delivery** 🍕
2. **Marketplace** 🛒
3. **Finance** 💳
4. **Express Delivery** 🚚
5. **B2B Services** 🏢
6. **B2C Services** 👥
7. **Healthcare** 🏥
8. **Education** 🎓
9. **Entertainment** 🎮

## Key Components

### VendorCard
Displays vendor information including:
- Store name and description
- Rating and reviews
- Categories
- Location
- Operating hours

### ProductCard
Shows product details including:
- Product images
- Name and description
- Pricing with discounts
- Vendor information
- Stock status
- Ratings

## State Management

The app uses React Context API for state management:

- **AuthContext**: Handles user authentication and profile
- **BusinessContext**: Manages business data and operations

## Styling

- Uses React Native Paper theme system
- Custom business-specific color schemes
- Responsive design for different screen sizes
- Consistent UI/UX across all screens

## Future Enhancements

- Push notifications
- Offline support
- Advanced search filters
- Wishlist functionality
- Order tracking
- Payment integration
- Social features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
