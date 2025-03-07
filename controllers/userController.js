const User = require('../models/User');
const Favorite = require('../models/Favorite')
const jwt = require('jsonwebtoken'); // Add this import
const Sale = require('../models/Sale')

exports.getUser = async (req, res) => {
    try {
        // The user should already be available from the middleware
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).render('errors', { message: "User not found" });
        }
        
        // Changed userId to user to match your schema
        const favorites = await Favorite.find({ user: user._id }).populate('sound');
        const completedSales = await Sale.find({ 
            customer: user._id,
            status: 'completed'
        }).sort({ createdAt: -1 });
        res.render('profile', { user, favorites,completedSales });
    } catch (error) {
        console.error("Profile access error:", error);
        return res.status(500).render('errors', { message: "An error occurred while accessing your profile: " + error.message });
    }
};
