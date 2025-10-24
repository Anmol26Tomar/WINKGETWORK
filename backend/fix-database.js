// Fix database schema issue
const mongoose = require('mongoose');

async function fixDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/winkget');
    
    // Drop the captains collection to remove the old schema
    await mongoose.connection.db.collection('captains').drop();
    console.log('Dropped captains collection');
    
    // Recreate the collection with the new schema
    const { Captain } = require('./WinkgetExpress/captain/models/Captain.model');
    console.log('Captains collection recreated with new schema');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixDatabase();
