const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { create, listByUser, estimate } = require('../controllers/transportController');

router.post('/create', auth, create);
router.post('/estimate', auth, estimate);
router.get('/user/:userId', auth, listByUser);

module.exports = router;


