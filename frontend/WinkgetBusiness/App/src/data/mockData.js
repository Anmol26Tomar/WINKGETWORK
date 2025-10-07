// Mock data for the marketplace app

export const categories = [
  {
    id: 1,
    name: 'Groceries',
    icon: '🛒',
    description: 'Fresh fruits, vegetables, dairy, and daily essentials'
  },
  {
    id: 2,
    name: 'Electronics',
    icon: '📱',
    description: 'Mobile phones, laptops, accessories, and gadgets'
  },
  {
    id: 3,
    name: 'Home & Kitchen',
    icon: '🏠',
    description: 'Appliances, furniture, and home decor items'
  },
  {
    id: 4,
    name: 'Fashion',
    icon: '👕',
    description: 'Clothing, shoes, and accessories for all ages'
  },
  {
    id: 5,
    name: 'Health & Beauty',
    icon: '💊',
    description: 'Medicines, cosmetics, and personal care products'
  },
  {
    id: 6,
    name: 'Sports & Fitness',
    icon: '⚽',
    description: 'Sports equipment, fitness gear, and outdoor items'
  }
];

export const vendors = [
  {
    id: 1,
    name: 'Fresh Mart Grocery',
    category: 'Groceries',
    rating: 4.5,
    phone: '+1-555-0101',
    email: 'contact@freshmart.com',
    address: '123 Market Street, Downtown',
    description: 'Your neighborhood grocery store with fresh produce and daily essentials',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    deliveryTime: '30-45 mins',
    minOrder: 25,
    isOpen: true,
    openHours: '6:00 AM - 10:00 PM'
  },
  {
    id: 2,
    name: 'TechHub Electronics',
    category: 'Electronics',
    rating: 4.7,
    phone: '+1-555-0102',
    email: 'info@techhub.com',
    address: '456 Tech Avenue, Silicon Valley',
    description: 'Latest gadgets and electronics with warranty and support',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    deliveryTime: '1-2 days',
    minOrder: 100,
    isOpen: true,
    openHours: '9:00 AM - 9:00 PM'
  },
  {
    id: 3,
    name: 'Home Essentials Store',
    category: 'Home & Kitchen',
    rating: 4.3,
    phone: '+1-555-0103',
    email: 'hello@homeessentials.com',
    address: '789 Home Street, Residential Area',
    description: 'Everything you need to make your house a home',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    deliveryTime: '2-3 days',
    minOrder: 50,
    isOpen: true,
    openHours: '8:00 AM - 8:00 PM'
  },
  {
    id: 4,
    name: 'Fashion Forward',
    category: 'Fashion',
    rating: 4.6,
    phone: '+1-555-0104',
    email: 'style@fashionforward.com',
    address: '321 Style Boulevard, Fashion District',
    description: 'Trendy clothing and accessories for the modern lifestyle',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400',
    deliveryTime: '1-3 days',
    minOrder: 75,
    isOpen: false,
    openHours: '10:00 AM - 7:00 PM'
  }
];

export const products = [
  // Grocery Products
  {
    id: 1,
    name: 'Fresh Organic Apples',
    category: 'Groceries',
    vendorId: 1,
    price: 4.99,
    originalPrice: 5.99,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    description: 'Crisp and sweet organic apples, perfect for snacking or baking',
    inStock: true,
    quantity: 50,
    unit: 'per kg',
    discount: 17,
    rating: 4.5,
    reviews: 23
  },
  {
    id: 2,
    name: 'Farm Fresh Milk',
    category: 'Groceries',
    vendorId: 1,
    price: 3.49,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    description: 'Pure and fresh milk from local farms, rich in nutrients',
    inStock: true,
    quantity: 30,
    unit: 'per liter',
    rating: 4.7,
    reviews: 45
  },
  {
    id: 3,
    name: 'Whole Wheat Bread',
    category: 'Groceries',
    vendorId: 1,
    price: 2.99,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    description: 'Freshly baked whole wheat bread, soft and nutritious',
    inStock: true,
    quantity: 20,
    unit: 'per loaf',
    rating: 4.3,
    reviews: 12
  },

  // Electronics Products
  {
    id: 4,
    name: 'iPhone 15 Pro',
    category: 'Electronics',
    vendorId: 2,
    price: 999.99,
    originalPrice: 1099.99,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
    description: 'Latest iPhone with advanced camera system and A17 Pro chip',
    inStock: true,
    quantity: 15,
    unit: 'each',
    discount: 9,
    rating: 4.8,
    reviews: 156
  },
  {
    id: 5,
    name: 'MacBook Air M2',
    category: 'Electronics',
    vendorId: 2,
    price: 1199.99,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    description: 'Powerful and lightweight laptop perfect for work and creativity',
    inStock: true,
    quantity: 8,
    unit: 'each',
    rating: 4.9,
    reviews: 89
  },
  {
    id: 6,
    name: 'Wireless Earbuds Pro',
    category: 'Electronics',
    vendorId: 2,
    price: 199.99,
    originalPrice: 249.99,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    description: 'Premium wireless earbuds with noise cancellation',
    inStock: true,
    quantity: 25,
    unit: 'each',
    discount: 20,
    rating: 4.6,
    reviews: 78
  },

  // Home & Kitchen Products
  {
    id: 7,
    name: 'Coffee Maker Deluxe',
    category: 'Home & Kitchen',
    vendorId: 3,
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    description: 'Programmable coffee maker with built-in grinder',
    inStock: true,
    quantity: 12,
    unit: 'each',
    rating: 4.4,
    reviews: 34
  },
  {
    id: 8,
    name: 'Non-Stick Cookware Set',
    category: 'Home & Kitchen',
    vendorId: 3,
    price: 89.99,
    originalPrice: 119.99,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    description: '10-piece non-stick cookware set for all your cooking needs',
    inStock: true,
    quantity: 18,
    unit: 'set',
    discount: 25,
    rating: 4.2,
    reviews: 67
  },

  // Fashion Products
  {
    id: 9,
    name: 'Designer T-Shirt',
    category: 'Fashion',
    vendorId: 4,
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    description: 'Premium cotton t-shirt with modern design',
    inStock: true,
    quantity: 40,
    unit: 'each',
    rating: 4.3,
    reviews: 28
  },
  {
    id: 10,
    name: 'Denim Jeans',
    category: 'Fashion',
    vendorId: 4,
    price: 79.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    description: 'Classic fit denim jeans, comfortable and durable',
    inStock: false,
    quantity: 0,
    unit: 'each',
    discount: 20,
    rating: 4.5,
    reviews: 52
  }
];

export const featuredProducts = products.filter(product => product.discount && product.discount > 15);

export const queries = [
  {
    id: 1,
    userId: 'user123',
    vendorId: 1,
    productId: 1,
    subject: 'Product Quality Question',
    message: 'Are these apples locally sourced? What is the shelf life?',
    status: 'pending',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    userId: 'user456',
    vendorId: 2,
    productId: 4,
    subject: 'Warranty Information',
    message: 'What is the warranty period for the iPhone 15 Pro?',
    status: 'answered',
    createdAt: '2024-01-14T14:20:00Z',
    response: 'The iPhone 15 Pro comes with a 1-year limited warranty from Apple.'
  }
];

export const offers = [
  { id: 'o1', brand: 'WinkGet', message: 'Get 20% off today', coupon: 'WINK20', discount: 20 },
  { id: 'o2', brand: 'TechHub', message: 'Save on MacBook Air', discount: 8 },
  { id: 'o3', brand: 'Fresh Mart', message: 'Free delivery on orders $50+', coupon: 'FRESH50' },
  { id: 'o4', brand: 'Fashion Forward', message: 'Jeans 20% off', discount: 20, coupon: 'DENIM20' }
];

