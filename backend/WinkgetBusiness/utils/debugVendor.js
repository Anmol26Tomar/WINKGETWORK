// Debug utility to check for existing vendors
const Vendor = require('../models/Vendor');

async function debugVendorSignup(email, shopName) {
  try {
    console.log('🔍 Debugging vendor signup...');
    console.log('Email:', email);
    console.log('Shop Name:', shopName);
    
    // Check for existing vendors with same email
    const existingEmail = await Vendor.findOne({ 
      $or: [
        { ownerEmail: email }, 
        { email: email }
      ] 
    });
    
    // Check for existing vendors with same shop name
    const existingShopName = await Vendor.findOne({ 
      $or: [
        { shopName: shopName },
        { storeName: shopName }
      ] 
    });
    
    console.log('📧 Existing email vendor:', existingEmail ? {
      id: existingEmail._id,
      ownerEmail: existingEmail.ownerEmail,
      email: existingEmail.email,
      shopName: existingShopName.shopName
    } : 'None');
    
    console.log('🏪 Existing shop name vendor:', existingShopName ? {
      id: existingShopName._id,
      ownerEmail: existingShopName.ownerEmail,
      shopName: existingShopName.shopName,
      storeName: existingShopName.storeName
    } : 'None');
    
    // Count total vendors
    const totalVendors = await Vendor.countDocuments();
    console.log('📊 Total vendors in database:', totalVendors);
    
    // List all vendors (first 5)
    const allVendors = await Vendor.find({}).limit(5).select('ownerEmail email shopName storeName');
    console.log('📋 Sample vendors:', allVendors);
    
    return {
      emailExists: !!existingEmail,
      shopNameExists: !!existingShopName,
      existingEmail,
      existingShopName,
      totalVendors
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
}

module.exports = { debugVendorSignup };
