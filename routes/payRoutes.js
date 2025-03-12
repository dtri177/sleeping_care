const express = require('express');
const { pay,cancel,success,webhook } = require('../controllers/payController')
const { authenticateUser,canPurchasePremium } = require('../middlewares/authMiddleware'); 

const router = express.Router();
router.get('/cancel',cancel)
router.post('/pay',authenticateUser,canPurchasePremium,pay)
router.get('/success', success);
router.post('/webhook', webhook);
module.exports = router;
