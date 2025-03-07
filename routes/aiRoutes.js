const express = require('express');
const multer = require('multer');
const path = require('path');
const { searchInDatabase, chatbox } = require('../controllers/aiController');
const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/search', searchInDatabase);
router.post('/get', upload.single('file'), chatbox);

module.exports = router;