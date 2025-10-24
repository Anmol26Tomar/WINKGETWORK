const mongoose = require('mongoose');

async function resetDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/winkget');
    console.log('Connected to MongoDB');

    // Drop the captains collection
    await mongoose.connection.db.collection('captains').drop();
    console.log('Dropped captains collection');

    // Also drop any indexes that might be causing issues
    try {
      await mongoose.connection.db.collection('captains').dropIndexes();
      console.log('Dropped all indexes from captains collection');
    } catch (err) {
      console.log('No indexes to drop or collection already empty');
    }

    console.log('Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
