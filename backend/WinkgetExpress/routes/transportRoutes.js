const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { create, listByUser, estimate, getById, updateStatus, cancelRide } = require('../controllers/transportController');

router.post('/create', auth, create);
router.post('/estimate', auth, estimate);
router.get('/user/:userId', auth, listByUser);
router.get('/:id', auth, getById);
router.put('/:id/status', auth, updateStatus);
router.delete('/:id', auth, cancelRide);

module.exports = router;


