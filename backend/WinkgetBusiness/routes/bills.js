const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createBill,
  getVendorBills,
  getBillById,
  updateBillStatus,
  generateBillFromOrder,
  updateBill,
  deleteBill,
  getBillStats
} = require('../controllers/billController');

const router = express.Router();

// All routes require vendor authentication
router.use(verifyToken);
router.use(requireRole('vendor'));

// Bill CRUD operations
router.post('/', createBill);
router.get('/', getVendorBills);
router.get('/stats', getBillStats);
router.get('/:id', getBillById);
router.put('/:id', updateBill);
router.patch('/:id/status', updateBillStatus);
router.delete('/:id', deleteBill);

// Generate bill from order
router.post('/from-order/:orderId', generateBillFromOrder);

module.exports = router;
