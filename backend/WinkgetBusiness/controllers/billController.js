const Bill = require('../models/Bill');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');

// Create a new bill
const createBill = async (req, res) => {
  try {
    const vendorId = req.user.id;
    console.log(vendorId);
    
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Handle productId conversion - if it's not a valid ObjectId, set it to null
    const processedItems = req.body.items?.map(item => ({
      ...item,
      productId: item.productId && item.productId.match(/^[0-9a-fA-F]{24}$/) ? item.productId : null
    })) || [];

    const billData = {
      ...req.body,
      items: processedItems,
      vendor: vendorId,
      vendorBusinessName: vendor.storeName,
      vendorAddress: vendor.businessAddress,
      vendorContact: {
        email: vendor.email,
        phone: vendor.businessContact,
        website: vendor.websiteUrl
      },
      createdBy: vendorId
    };

    console.log({billData});

    // Create bill instance
    const bill = new Bill(billData);
    console.log('Bill instance created:', {
      billNumber: bill.billNumber,
      customerName: bill.customerName,
      totalAmount: bill.totalAmount
    });
    
    // Calculate totals
    bill.calculateTotals();
    
    // Validate required fields
    if (!bill.customerName) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }
    
    if (!bill.items || bill.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }
    
    // Save the bill
    await bill.save();
    console.log("bill saved");
    
    // Add bill reference to vendor
    await Vendor.findByIdAndUpdate(vendorId, {
      $push: { bills: bill._id }
    });

    // Add bill reference to customer if exists
    if (bill.customer) {
      await User.findByIdAndUpdate(bill.customer, {
        $push: { bills: bill._id }
      });
    }

    res.status(201).json({
      success: true,
      bill,
      message: 'Bill created successfully'
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message
    });
  }
};

// Get all bills for a vendor
const getVendorBills = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, billType, page = 1, limit = 10 } = req.query;
    
    const filter = { vendor: vendorId };
    if (status) filter.status = status;
    if (billType) filter.billType = billType;

    const bills = await Bill.find(filter)
      .populate('customer', 'name email')
      .populate('order')
      .sort({ billDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bill.countDocuments(filter);

    res.json({
      success: true,
      bills,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

// Get a specific bill
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const bill = await Bill.findOne({ _id: id, vendor: vendorId })
      .populate('customer', 'name email phone')
      .populate('order')
      .populate('items.productId', 'name description image');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      bill
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
};

// Update bill status
const updateBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;
    const vendorId = req.user.id;

    const bill = await Bill.findOne({ _id: id, vendor: vendorId });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    bill.status = status;
    if (paymentMethod) bill.paymentMethod = paymentMethod;
    
    if (status === 'paid') {
      bill.markAsPaid(paymentMethod);
    }

    await bill.save();

    res.json({
      success: true,
      bill,
      message: 'Bill status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bill status',
      error: error.message
    });
  }
};

// Generate bill from order
const generateBillFromOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const vendorId = req.user.id;

    // This would typically fetch order details from your order system
    // For now, we'll create a bill with the provided data
    const orderData = req.body;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const billData = {
      vendor: vendorId,
      vendorBusinessName: vendor.storeName,
      vendorAddress: vendor.businessAddress,
      vendorContact: {
        email: vendor.email,
        phone: vendor.businessContact,
        website: vendor.websiteUrl
      },
      customer: orderData.customerId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      order: orderId,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryCharge: orderData.deliveryCharge || 0,
      taxAmount: orderData.taxAmount || 0,
      discountAmount: orderData.discountAmount || 0,
      billType: 'order',
      status: 'sent',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: vendorId
    };

    const bill = new Bill(billData);
    bill.calculateTotals();
    await bill.save();

    // Add bill reference to vendor
    await Vendor.findByIdAndUpdate(vendorId, {
      $push: { bills: bill._id }
    });

    // Add bill reference to customer
    if (bill.customer) {
      await User.findByIdAndUpdate(bill.customer, {
        $push: { bills: bill._id }
      });
    }

    res.status(201).json({
      success: true,
      bill,
      message: 'Bill generated from order successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate bill from order',
      error: error.message
    });
  }
};

// Update bill
const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const bill = await Bill.findOne({ _id: id, vendor: vendorId });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Update bill data
    Object.assign(bill, req.body);
    bill.calculateTotals();
    bill.lastModified = new Date();
    
    await bill.save();

    res.json({
      success: true,
      bill,
      message: 'Bill updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bill',
      error: error.message
    });
  }
};

// Delete bill
const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const bill = await Bill.findOne({ _id: id, vendor: vendorId });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Remove bill reference from vendor
    await Vendor.findByIdAndUpdate(vendorId, {
      $pull: { bills: bill._id }
    });

    // Remove bill reference from customer
    if (bill.customer) {
      await User.findByIdAndUpdate(bill.customer, {
        $pull: { bills: bill._id }
      });
    }

    await Bill.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete bill',
      error: error.message
    });
  }
};

// Get bill statistics
const getBillStats = async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    const stats = await Bill.aggregate([
      { $match: { vendor: vendorId } },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);

    const statusCounts = await Bill.aggregate([
      { $match: { vendor: vendorId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalBills: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
      },
      statusCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill statistics',
      error: error.message
    });
  }
};

module.exports = {
  createBill,
  getVendorBills,
  getBillById,
  updateBillStatus,
  generateBillFromOrder,
  updateBill,
  deleteBill,
  getBillStats
};
