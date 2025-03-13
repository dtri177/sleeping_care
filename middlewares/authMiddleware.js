const User = require('../models/User');

const jwt = require('jsonwebtoken');


const authenticateUser = async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Important: Fetch fresh user data from database to ensure role is current
        const user = await User.findById(decoded.id);
        if (!user) {
            req.user = null;
            return next();
        }
        
        // Use the database user data to ensure role is correct
        req.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            is_premium: user.is_premium
        };// Attach user data to the request
        next();
    } catch (err) {
        console.error("JWT verification error:", err);
        return res.redirect('/auth/sign-in');
    }
};
const canPurchasePremium = async (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/sign-in');
    }
    const userData = req.user
    const user = await User.findById(userData.id)
    const now = new Date();

    // Check if the user still has an active premium subscription
    if (user.is_premium && user.premium_expired_at && new Date(user.premium_expired_at) > now) {
        return res.status(400).render('errors', { message: "You already have an active premium subscription." });

    }

    next();
};
const checkPremiumStatus = async (req, res, next) => {
    try {
        if (!req.user) {
            req.isPremium = false;
        } else {
            const user = await User.findById(req.user.id);
            req.isPremium = user && user.is_premium && 
                            (user.premium_expired_at && new Date(user.premium_expired_at) > new Date());
        }
        next();
    } catch (error) {
        console.error("Error checking premium status:", error);
        req.isPremium = false;
        next();
    }
};


const hasRole = (roles) => async (req, res, next) => {
    if (!req.user || !req.user.id) {
        if (req.originalUrl.startsWith('/api')) {
            return res.status(403).json({ message: 'Access denied. Please log in.' });
        }
        return res.redirect('/auth/sign-in');
    }

    // Ensure we have the latest role information from database
    try {
        const user = await User.findById(req.user.id);
        if (!user || !roles.includes(user.role)) {
            return res.status(403).render('errors', { message: 'Access denied. Insufficient permissions.' });
        }
        
        // Update req.user with the latest role
        req.user.role = user.role;
        next();
    } catch (error) {
        console.error("Role verification error:", error);
        return res.status(500).render('errors', { message: 'Authentication error. Please try again.' });
    }
};

module.exports = {
    authenticateUser,
 
    checkPremiumStatus,
    canPurchasePremium,
    hasRole
};
