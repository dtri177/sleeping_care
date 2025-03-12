const User = require('../models/User');
const Sale = require('../models/Sale');
const dotenv = require('dotenv');
dotenv.config();
const PayOs = require('@payos/node');
const payOs = new PayOs(
  process.env.PAY_CLIENT_ID,
  process.env.PAY_API_KEY,
  process.env.PAY_CHECKSUM_KEY
);

exports.cancel = async (req, res) => {
  res.render('cancel');
};

exports.pay = async (req, res) => {
  try {
    const userData = req.user
    if (!userData) {
      return res.status(401).render('errors', { message: 'User not authenticated' });
    }
    
    const amount = 2000;
    const orderCode = Date.now() % 9007199254740991;
    
    // Create a pending sale record first
    const sale = new Sale({
      customer: userData.id,
      total: amount,
      paymentMethod: 'scan QR',
      status: 'pending',
      orderCode: orderCode.toString() // Store the orderCode to match with webhook response later
    });
    
    await sale.save();
    console.log("Pending sale record created:", sale);
    
    // Create payment order
    const order = {
      amount: amount,
      description: 'Buying V.I.P membership',
      orderCode,
      returnUrl: `${process.env.WEB_URL}/pay/success?orderId=${sale._id}`, // Pass the sale ID
      cancelUrl: `${process.env.WEB_URL}/pay/cancel?orderId=${sale._id}` // Also pass it to cancel
    };
    
    const paymentLink = await payOs.createPaymentLink(order);
    res.redirect(303, paymentLink.checkoutUrl);
  } catch (error) {
    console.error("Payment error:", error);
    return res.status(500).render('errors', { message: "Internal Server Error" });
  }
};

// Add a success handler
exports.success = async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId) {
      return res.status(400).render('errors', { message: 'Order ID is missing' });
    }
    
    // Find the sale record
    const sale = await Sale.findById(orderId);
    if (!sale) {
      return res.status(404).render('errors', { message: 'Sale record not found' });
    }
    
    // Update sale status to completed
    sale.status = 'completed';
    await sale.save();
    
    // Get the user
    const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    if (!userData) {
      return res.status(401).render('errors', { message: 'User not authenticated' });
    }
    
    // Extend VIP membership for 30 days
    const premiumExpirationDate = new Date();
    premiumExpirationDate.setDate(premiumExpirationDate.getDate() + 30);
    
    // Update user to premium
    const updatedUser = await User.findByIdAndUpdate(
      userData.id,
      {
        is_verified: true,
        is_premium: true,
        premium_expired_at: premiumExpirationDate
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).render('errors', { message: 'User not found' });
    }
    
    // Success page or redirect to homepage
    res.redirect('/')
  } catch (error) {
    console.error("Payment success handler error:", error);
    return res.status(500).render('errors', { message: "Internal Server Error" });
  }
};

// Add a webhook handler for PayOS notifications (if available)
exports.webhook = async (req, res) => {
  try {
    const payload = req.body;
    
    // Verify the webhook payload (implementation depends on PayOS webhook structure)
    // This should include verification of signatures/checksums
    
    if (payload.status === 'PAID' || payload.status === 'SUCCESS') {
      const orderCode = payload.orderCode;
      
      // Find the sale by orderCode
      const sale = await Sale.findOne({ orderCode: orderCode.toString() });
      if (!sale) {
        console.error("Sale not found for orderCode:", orderCode);
        return res.status(404).json({ error: 'Sale not found' });
      }
      
      // Update sale status
      sale.status = 'completed';
      await sale.save();
      
      // Update user to premium if not already
      if (sale.customer) {
        const premiumExpirationDate = new Date();
        premiumExpirationDate.setDate(premiumExpirationDate.getDate() + 30);
        
        await User.findByIdAndUpdate(
          sale.customer,
          {
            is_verified: true,
            is_premium: true,
            premium_expired_at: premiumExpirationDate
          }
        );
      }
      
      return res.status(200).json({ success: true });
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};