const User = require('../models/User');

const jwt = require('jsonwebtoken');


const authenticateUser = (req, res, next) => {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.redirect('/auth/sign-in');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user data to the request
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
    const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    const user = await User.findById(userData.id)
    const now = new Date();

    // Check if the user still has an active premium subscription
    if (user.is_premium && user.premium_expired_at && new Date(user.premium_expired_at) > now) {
        return res.status(400).render('errors', { message: "You already have an active premium subscription." });

    }

    next();
};

const checkPremiumAccess = async (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/sign-in');
    }
    const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    const user = await User.findById(userData.id)

    const now = new Date();
    // Allow access if user has an active premium subscription
    if (!user.is_premium || (user.premium_expired_at && new Date(user.premium_expired_at) <= now)) {
        return res.status(403).render('errors', { message: "You need premium access to view this content." });

    }

    next();
};

const hasRole = (roles) => (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(403).json({ message: 'Access denied. No role assigned.' });
    }

    // Direct comparison for a single role value
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
};

module.exports = {
    authenticateUser,
 
    checkPremiumAccess,
    canPurchasePremium,
    hasRole
};
