
const express = require('express');
const { getUser} = require('../controllers/userController');
const { authenticateUser } = require('../middlewares/authMiddleware'); 
const {  addToFavorites} = require('../controllers/favoriteController');

const router = express.Router();


//get user
router.get('/profile', (req, res, next) => {
    console.log("Cookies:", req.cookies);
    console.log("AccessToken exists:", !!req.cookies.accessToken);
    next();
}, authenticateUser, getUser);

router.get('/fav/:id', authenticateUser, addToFavorites);
module.exports = router;
