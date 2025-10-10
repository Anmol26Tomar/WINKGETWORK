# Winkget Business - Multi-Business Platform

A comprehensive multi-business platform that provides access to multiple business types including food delivery, marketplace, finance, express delivery, and more. Built with Node.js backend and React Native frontend.

## 🚀 Features

### Backend Features
- **Multi-Business Architecture**: Support for multiple business types
- **JWT Authentication**: Secure user authentication and authorization
- **Scalable API**: RESTful APIs for all business operations
- **Database Models**: Comprehensive data models for businesses, vendors, products, orders, and reviews
- **Real-time Updates**: Socket.io integration for real-time features

### Frontend Features
- **React Native App**: Cross-platform mobile application
- **Business Listing**: Beautiful cards showing all available businesses
- **Individual Business Pages**: Detailed business information with vendors and products
- **User Authentication**: Secure login and registration
- **Profile Management**: User profile with business access control
- **Search & Filter**: Advanced search and filtering capabilities

## 🏗️ Architecture

### Backend Structure
```
backend/
├── WinkgetExpress/          # Express delivery service
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
├── WinkgetBusiness/         # Multi-business platform
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
└── server.js               # Main server file
```

### Frontend Structure
```
frontend/
├── WinkgetBusiness/
│   ├── App/                # React Native mobile app
│   └── Website/            # React web application
└── WinkgetExpress/         # Express delivery app
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.io** for real-time features
- **bcryptjs** for password hashing

### Frontend
- **React Native** with Expo
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **Axios** for API calls
- **Context API** for state management

## 📦 Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file
MONGODB_URI=mongodb://localhost:27017/winkget-business
JWT_SECRET=your_jwt_secret_key
PORT=3001
```

4. Start the server:
```bash
npm run dev
```

5. Seed initial data (optional):
```bash
node seed.js
```

### Frontend Setup

1. Navigate to React Native app directory:
```bash
cd frontend/WinkgetBusiness/App
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## 🗄️ Database Models

### User Model
- User authentication and profile information
- Business access permissions
- Preferences and settings

### Business Model
- Business information and settings
- Features and contact details
- Statistics and configuration

### Vendor Model
- Vendor profiles and store information
- Ratings and reviews
- Operating hours and location

### Product Model
- Product details and specifications
- Pricing and inventory
- Images and categories

### Order Model
- Order management and tracking
- Payment information
- Shipping details

### Review Model
- Product and vendor reviews
- Rating system
- User feedback

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Business
- `GET /api/business` - List all businesses
- `GET /api/business/:slug` - Get business details
- `GET /api/business/:slug/vendors` - Get business vendors
- `GET /api/business/:slug/products` - Get business products

### Vendors
- `GET /api/vendors/:id` - Get vendor details
- `GET /api/vendors/:id/products` - Get vendor products
- `GET /api/vendors/:id/reviews` - Get vendor reviews

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/products/search` - Search products
- `GET /api/products/featured` - Get featured products

## 🎨 Business Types Supported

1. **Food Delivery** 🍕 - Restaurant and food delivery services
2. **Marketplace** 🛒 - Online marketplace for buying/selling
3. **Finance** 💳 - Financial services and products
4. **Express Delivery** 🚚 - Logistics and courier services
5. **B2B Services** 🏢 - Business-to-business services
6. **B2C Services** 👥 - Business-to-consumer services
7. **Healthcare** 🏥 - Medical and healthcare services
8. **Education** 🎓 - Educational services and courses
9. **Entertainment** 🎮 - Entertainment and media services

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting (can be added)

## 📱 Mobile App Features

### Home Screen
- Business listing with beautiful gradient cards
- Real-time statistics
- Smooth navigation between businesses

### Business Detail Screen
- Comprehensive business information
- Tabbed interface (Overview, Vendors, Products)
- Vendor and product listings
- Contact information

### Authentication
- Secure login and registration
- Profile management
- Business access control

### Components
- **VendorCard**: Displays vendor information with ratings
- **ProductCard**: Shows product details with pricing
- Reusable and modular design

## 🚀 Getting Started

1. **Clone the repository**
2. **Set up the backend** (follow backend setup instructions)
3. **Set up the frontend** (follow frontend setup instructions)
4. **Seed initial data** (optional but recommended)
5. **Start both servers**
6. **Open the mobile app** and register/login

## 📊 Sample Data

The seed script creates:
- Admin user (admin@winkget.com / admin123)
- 4 sample businesses (Food, Marketplace, Finance, Express)
- Sample vendors for each business
- Sample products for each vendor

## 🔧 Configuration

### Backend Configuration
- Database connection string
- JWT secret key
- Server port
- CORS settings

### Frontend Configuration
- API base URL
- Theme colors
- Navigation settings

## 📈 Future Enhancements

- Push notifications
- Offline support
- Advanced analytics
- Payment integration
- Social features
- Multi-language support
- Admin dashboard
- Real-time chat

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@winkget.com or create an issue in the repository.

## 🙏 Acknowledgments

- React Native community
- Expo team
- MongoDB team
- All contributors
