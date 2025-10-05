const mongoose = require('mongoose');

async function connectDB() {
	const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/winkget'
	try {
		await mongoose.connect(uri, { dbName: 'winkget' });
		console.log('MongoDB connected');
	} catch (err) {
		console.error('MongoDB connection error', err);
		process.exit(1);
	}
}
module.exports = { connectDB };


