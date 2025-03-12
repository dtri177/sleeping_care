/**
 * Test script to update a user's premium status
 * 
 * Usage:
 * 1. Save this as test-premium.js in your project root
 * 2. Run with: node test-premium.js your-email@example.com
 * 
 * This will set the specified user to premium status with an expiration date 30 days in the future
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const updateUserPremium = async (email) => {
  try {
    // Set expiration date to 30 days from now
    const premiumExpirationDate = new Date();
    premiumExpirationDate.setDate(premiumExpirationDate.getDate() + 30);
    
    // Find user by email and update premium status
    const user = await User.findOneAndUpdate(
      { email },
      {
        is_verified: true,
        is_premium: true,
        premium_expired_at: premiumExpirationDate
      },
      { new: true }
    );
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }
    
    console.log('User premium status updated successfully!');
    console.log('User details:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Premium:', user.is_premium);
    console.log('- Premium Expiration:', user.premium_expired_at);
    console.log('\nYou can now test premium features with this account.');
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

const createExpiredPremium = async (email) => {
  try {
    // Set expiration date to yesterday
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);
    
    // Find user by email and update with expired premium status
    const user = await User.findOneAndUpdate(
      { email },
      {
        is_verified: true,
        is_premium: true,
        premium_expired_at: expiredDate
      },
      { new: true }
    );
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }
    
    console.log('User set with EXPIRED premium status!');
    console.log('User details:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Premium:', user.is_premium);
    console.log('- Premium Expiration:', user.premium_expired_at);
    console.log('\nThis account has is_premium=true but with an expired date.');
    console.log('You can use it to test your expiration logic.');
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

const removePremium = async (email) => {
  try {
    // Remove premium status
    const user = await User.findOneAndUpdate(
      { email },
      {
        is_premium: false,
        premium_expired_at: null
      },
      { new: true }
    );
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }
    
    console.log('Premium status removed successfully!');
    console.log('User details:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Premium:', user.is_premium);
    console.log('- Premium Expiration:', user.premium_expired_at);
    console.log('\nThis account now has regular (non-premium) status.');
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Main function
const main = async () => {
  await connectDB();
  
  const email = process.argv[2];
  const action = process.argv[3] || 'activate'; // Default action is to activate premium
  
  if (!email) {
    console.error('Please provide an email address.');
    console.log('Usage: node test-premium.js your-email@example.com [activate|expire|remove]');
    process.exit(1);
  }
  
  switch (action) {
    case 'activate':
      await updateUserPremium(email);
      break;
    case 'expire':
      await createExpiredPremium(email);
      break;
    case 'remove':
      await removePremium(email);
      break;
    default:
      console.error('Invalid action. Use "activate", "expire", or "remove".');
      process.exit(1);
  }
};

// Run the script
main();