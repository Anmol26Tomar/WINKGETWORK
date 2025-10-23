const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { estimate, create, getById, getHistory, updateStatus } = require('../controllers/packersMoveController');

router.post('/estimate', auth, estimate);
router.post('/', auth, create);
router.get('/history', auth, getHistory);
router.get('/:id', auth, getById);
router.put('/:id/status', auth, updateStatus);

module.exports = router;


