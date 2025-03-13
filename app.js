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

// Set up static file serving and view engine first - not MongoDB dependent
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Basic middleware (not MongoDB-dependent)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize session configuration without connecting to MongoDB yet
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
};

// Add MongoDB store to session config only if MONGO_URI is available
if (process.env.MONGO_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'interval',
    autoRemoveInterval: 60, // In minutes
    touchAfter: 24 * 3600 // Only update session once per day unless data changes
  });
}

// Set up session middleware
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Set up routes - these will work even if MongoDB connection fails
app.use('/', soundRoutes);
app.use('/auth', authenRoutes);
app.use('/user', userRoutes);
app.use('/ai', aiRoutes);
app.use('/pay', payRoutes);
app.use('/admin', adminRoutes);

// Add a health check route that doesn't require MongoDB
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Something went wrong. Please try again later.');
});

const PORT = process.env.PORT || 3000;

// Initialization function to start server and connect to DB
const initialize = async () => {
  try {
    // Try to connect to MongoDB
    await connectDB();
    console.log('MongoDB connected successfully');
    
    // Only start the server if not in production (for Vercel)
    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    
    // For Vercel/serverless environments, we'll continue even if MongoDB fails
    // The app will still work for static routes and those not requiring DB
    if (process.env.NODE_ENV === "production") {
      console.log('Continuing in production mode despite MongoDB connection failure');
    } else {
      // In development, we might want to exit or retry
      console.log('Server will continue to run with limited functionality');
      app.listen(PORT, () => console.log(`Server running with limited functionality on http://localhost:${PORT}`));
    }
  }
};

// Start the initialization process
initialize();

// Export app for Vercel
module.exports = app;