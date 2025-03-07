const express = require('express');
const {  getDashboard} = require('../controllers/homeController');
const { authenticateUser, hasRole} = require('../middlewares/authMiddleware'); 
const {  getMostListenedSounds} = require('../controllers/favoriteController');
const router = express.Router();


router.get('/',authenticateUser,hasRole('admin'), getDashboard);


router.get('/sounds',authenticateUser,hasRole('admin'), getMostListenedSounds);
module.exports = router;
