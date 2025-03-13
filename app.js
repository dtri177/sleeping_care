const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const authenRoutes = require('./routes/authenRoutes');
const soundRoutes = require('./routes/soundRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const payRoutes = require('./routes/payRoutes');
const adminRoutes = require('./routes/adminRoutes');
const MongoStore = require('connect-mongo');

dotenv.config();
require('./config/passport');
const app = express();

// First, set up static file serving before any MongoDB-dependent middleware
// This ensures CSS and other static files can load even if MongoDB is slow
app.use(express.static(path.join(__dirname, 'public')));

// Set View Engine (not MongoDB-dependent)
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// MongoDB Connection - establish connection before setting up sessions
connectDB();

// Basic middleware (not MongoDB-dependent)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session & Passport (MongoDB-dependent) - comes after DB connection
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes - set up last after all middleware
app.use('/', soundRoutes);
app.use('/auth', authenRoutes);
app.use('/user', userRoutes);
app.use('/ai', aiRoutes);
app.use('/pay', payRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;

// Start the server when not in production
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

// Export app for Vercel
module.exports = app;