
const express = require('express');
const { googleAuth, googleCallback, logout, refreshToken,getSignIn, login, register, verifyEmail , getSignUp,getUser } = require('../controllers/authenController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const router = express.Router();
router.get('/sign-in', getSignIn)
// Google OAuth Routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
// Login normally
router.post('/login', login);
// Logout
router.get('/logout', logout);
//register
router.get('/register', getSignUp);
router.post("/register", register);
router.get("/verify-email", verifyEmail);
//Refresh Access Token
router.post('/refresh-token', refreshToken);
router.get('/user', authenticateUser,getUser);
module.exports = router;