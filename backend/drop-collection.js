const mongoose = require('mongoose');

async function dropCaptainsCollection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/winkget');
    console.log('Connected to MongoDB');

    console.log('Dropping captains collection...');
    await mongoose.connection.db.collection('captains').drop();
    console.log('✅ Captains collection dropped successfully!');

    console.log('Dropping any remaining indexes...');
    try {
      await mongoose.connection.db.collection('captains').dropIndexes();
      console.log('✅ All indexes dropped!');
    } catch (err) {
      console.log('No indexes to drop (collection was empty)');
    }

    console.log('Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropCaptainsCollection();
