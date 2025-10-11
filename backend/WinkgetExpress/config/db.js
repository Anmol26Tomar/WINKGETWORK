const mongoose = require('mongoose');

async function connectDB() {
	const uri = process.env.MONGO_URI || 'mongodb+srv://A_P_Singh:5gkbAJdCO0z7RXTn@cluster0.fh2vf.mongodb.net/winkget'
	try {
		await mongoose.connect(uri, { dbName: 'winkget' });
		console.log('MongoDB connected');
	} catch (err) {
		console.error('MongoDB connection error', err);
		process.exit(1);
	}
}
module.exports = { connectDB };


