const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./WinkgetExpress/models/User');
const Business = require('./WinkgetBusiness/models/businessModel');
const Vendor = require('./WinkgetBusiness/models/Vendor');
const Product = require('./WinkgetBusiness/models/Product');

// Connect to database
const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winkget-business');
		console.log('MongoDB connected');
	} catch (error) {
		console.error('Database connection error:', error);
		process.exit(1);
	}
};

// Seed data
const seedData = async () => {
	try {
		console.log('Starting seed process...');

		// Create admin user
		const adminPassword = await bcrypt.hash('admin123', 12);
		const admin = await User.create({
			name: 'Admin User',
			email: 'admin@winkget.com',
			password: adminPassword,
			role: 'admin',
			phone: '+91-9876543210',
			isActive: true
		});
		console.log('Admin user created');

		// Create businesses
		const businesses = [
			{
				name: 'Winkget Food',
				slug: 'winkget-food',
				description: 'Food delivery service with local restaurants and home chefs',
				category: 'food_delivery',
				logo: 'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=WF',
				heroImage: 'https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Food+Delivery',
				primaryColor: '#FF6B6B',
				secondaryColor: '#FF5252',
				owner: admin._id,
				contact: {
					email: 'food@winkget.com',
					phone: '+91-9876543210',
					website: 'https://food.winkget.com',
					address: {
						street: '123 Food Street',
						city: 'Mumbai',
						state: 'Maharashtra',
						pincode: '400001',
						country: 'India'
					}
				},
				features: [
					{ name: 'Fast Delivery', description: '30 minutes delivery guarantee', icon: '🚚' },
					{ name: 'Fresh Food', description: 'Fresh ingredients from local vendors', icon: '🥗' },
					{ name: 'Easy Payment', description: 'Multiple payment options', icon: '💳' }
				],
				settings: {
					isActive: true,
					allowRegistration: true,
					requireApproval: true,
					maxVendors: 500,
					commissionRate: 8
				}
			},
			{
				name: 'Winkget Marketplace',
				slug: 'winkget-marketplace',
				description: 'Online marketplace for buying and selling products',
				category: 'marketplace',
				logo: 'https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=WM',
				heroImage: 'https://via.placeholder.com/800x400/4ECDC4/FFFFFF?text=Marketplace',
				primaryColor: '#4ECDC4',
				secondaryColor: '#26A69A',
				owner: admin._id,
				contact: {
					email: 'marketplace@winkget.com',
					phone: '+91-9876543211',
					website: 'https://marketplace.winkget.com',
					address: {
						street: '456 Commerce Street',
						city: 'Delhi',
						state: 'Delhi',
						pincode: '110001',
						country: 'India'
					}
				},
				features: [
					{ name: 'Secure Transactions', description: 'Safe and secure payment processing', icon: '🔒' },
					{ name: 'Quality Assurance', description: 'Verified sellers and products', icon: '✅' },
					{ name: 'Easy Returns', description: 'Hassle-free return policy', icon: '↩️' }
				],
				settings: {
					isActive: true,
					allowRegistration: true,
					requireApproval: true,
					maxVendors: 1000,
					commissionRate: 5
				}
			},
			{
				name: 'Winkget Finance',
				slug: 'winkget-finance',
				description: 'Financial services including loans, insurance, and investments',
				category: 'finance',
				logo: 'https://via.placeholder.com/150x150/45B7D1/FFFFFF?text=WF',
				heroImage: 'https://via.placeholder.com/800x400/45B7D1/FFFFFF?text=Finance',
				primaryColor: '#45B7D1',
				secondaryColor: '#2196F3',
				owner: admin._id,
				contact: {
					email: 'finance@winkget.com',
					phone: '+91-9876543212',
					website: 'https://finance.winkget.com',
					address: {
						street: '789 Finance Street',
						city: 'Bangalore',
						state: 'Karnataka',
						pincode: '560001',
						country: 'India'
					}
				},
				features: [
					{ name: 'Quick Loans', description: 'Fast loan approval process', icon: '💰' },
					{ name: 'Insurance', description: 'Comprehensive insurance coverage', icon: '🛡️' },
					{ name: 'Investment', description: 'Smart investment options', icon: '📈' }
				],
				settings: {
					isActive: true,
					allowRegistration: true,
					requireApproval: true,
					maxVendors: 200,
					commissionRate: 3
				}
			},
			{
				name: 'Winkget Express',
				slug: 'winkget-express',
				description: 'Logistics and courier services for all your shipping needs',
				category: 'express',
				logo: 'https://via.placeholder.com/150x150/96CEB4/FFFFFF?text=WE',
				heroImage: 'https://via.placeholder.com/800x400/96CEB4/FFFFFF?text=Express+Delivery',
				primaryColor: '#96CEB4',
				secondaryColor: '#4CAF50',
				owner: admin._id,
				contact: {
					email: 'express@winkget.com',
					phone: '+91-9876543213',
					website: 'https://express.winkget.com',
					address: {
						street: '321 Logistics Street',
						city: 'Chennai',
						state: 'Tamil Nadu',
						pincode: '600001',
						country: 'India'
					}
				},
				features: [
					{ name: 'Same Day Delivery', description: 'Express delivery within the city', icon: '⚡' },
					{ name: 'Tracking', description: 'Real-time package tracking', icon: '📍' },
					{ name: 'Insurance', description: 'Package insurance coverage', icon: '📦' }
				],
				settings: {
					isActive: true,
					allowRegistration: true,
					requireApproval: true,
					maxVendors: 300,
					commissionRate: 6
				}
			}
		];

		const createdBusinesses = await Business.insertMany(businesses);
		console.log(`${createdBusinesses.length} businesses created`);

		// Create sample vendors for each business
		for (const business of createdBusinesses) {
			const vendorPassword = await bcrypt.hash('vendor123', 12);
			
			const vendor = await Vendor.create({
				name: `Sample Vendor for ${business.name}`,
				email: `vendor@${business.slug}.com`,
				passwordHash: vendorPassword,
				phone: '+91-9876543210',
				storeName: `${business.name} Store`,
				businessId: business._id,
				businessType: business.category,
				description: `Sample vendor store for ${business.name}`,
				logo: business.logo,
				address: {
					street: 'Sample Street',
					city: 'Mumbai',
					state: 'Maharashtra',
					pincode: '400001',
					country: 'India'
				},
				categories: ['General'],
				approved: true,
				verified: true,
				rating: {
					average: 4.5,
					count: 25
				}
			});

			// Create sample products for each vendor
			const products = [
				{
					name: `Sample Product 1 for ${business.name}`,
					slug: `sample-product-1-${business.slug}`,
					category: 'General',
					price: 299,
					originalPrice: 399,
					discount: 25,
					stock: 50,
					description: `This is a sample product for ${business.name}`,
					shortDescription: 'Sample product description',
					images: ['https://via.placeholder.com/300x300/CCCCCC/666666?text=Product+1'],
					thumbnail: 'https://via.placeholder.com/300x300/CCCCCC/666666?text=Product+1',
					tags: ['sample', 'product'],
					vendorId: vendor._id,
					businessId: business._id,
					rating: {
						average: 4.2,
						count: 15
					},
					isActive: true,
					isFeatured: true
				},
				{
					name: `Sample Product 2 for ${business.name}`,
					slug: `sample-product-2-${business.slug}`,
					category: 'General',
					price: 599,
					originalPrice: 799,
					discount: 25,
					stock: 30,
					description: `This is another sample product for ${business.name}`,
					shortDescription: 'Another sample product description',
					images: ['https://via.placeholder.com/300x300/CCCCCC/666666?text=Product+2'],
					thumbnail: 'https://via.placeholder.com/300x300/CCCCCC/666666?text=Product+2',
					tags: ['sample', 'product'],
					vendorId: vendor._id,
					businessId: business._id,
					rating: {
						average: 4.7,
						count: 8
					},
					isActive: true,
					isFeatured: false
				}
			];

			await Product.insertMany(products);
			console.log(`Sample vendor and products created for ${business.name}`);
		}

		console.log('Seed process completed successfully!');
		process.exit(0);
	} catch (error) {
		console.error('Seed process error:', error);
		process.exit(1);
	}
};

// Run seed
connectDB().then(() => {
	seedData();
});
