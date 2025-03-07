const User = require('../models/User');
const { generateAccessToken } = require('../utils/jwt');

const jwt = require('jsonwebtoken');

const setUser = async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password'); // Exclude password

            if (user) {
                // Store only essential user details in a cookie
                res.cookie('userData', JSON.stringify({
                    id: user._id,
                    name: user.name,
                    email: user.email
                }), {
                    httpOnly: false, // Set to `true` if you want to prevent JS access (but then frontend must use fetch)
                    secure: true, // Set `false` for development (or use HTTPS in production)

                    path: '/'
                });

                req.user = user; // Attach to request
            }
        } catch (err) {
            console.error("JWT Error:", err);
        }
    }

    next();
};
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
    setUser,
    checkPremiumAccess,
    canPurchasePremium,
    hasRole
};
