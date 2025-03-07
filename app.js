const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const {setUser} = require('./middlewares/authMiddleware'); 
const connectDB = require('./config/db');
const authenRoutes = require('./routes/authenRoutes');
const soundRoutes = require('./routes/soundRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const payRoutes = require('./routes/payRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
require('./config/passport');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport & Session

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Change to true in production with HTTPS
    sameSite: 'Strict',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Use authentication middleware
app.use(setUser);
// Set View Engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
// Routes
app.use('/', soundRoutes);
app.use('/auth', authenRoutes);
app.use('/user', userRoutes);
app.use('/ai', aiRoutes)
app.use('/pay', payRoutes)
app.use('/admin', adminRoutes)

// MongoDB Connection
connectDB();

require('dotenv').config();
console.log();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)

);

module.exports = app;
