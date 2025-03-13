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

// Serve static files BEFORE other middleware
// This ensures static files don't wait for MongoDB connection
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB first
connectDB()
  .then(() => {
    console.log('MongoDB connected successfully');
    
    // Continue with the rest of the middleware setup
    setupMiddleware();
    setupRoutes();
    startServer();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    // Don't exit the process - let static files still be served
    setupStaticOnlyServer();
  });

function setupMiddleware() {
  // Regular middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Session and authentication middleware
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60,
      // Add connection options to prevent timeouts
      clientOptions: {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000, // Lower connect timeout
      }
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());

  // Set View Engine
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
}

function setupRoutes() {
  // Routes
  app.use('/', soundRoutes);
  app.use('/auth', authenRoutes);
  app.use('/user', userRoutes);
  app.use('/ai', aiRoutes);
  app.use('/pay', payRoutes);
  app.use('/admin', adminRoutes);
  
  // Add error handling for API routes
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  });
}

function setupStaticOnlyServer() {
  // If MongoDB fails, set up a minimal server that can still serve static files
  app.get('*', (req, res) => {
    res.status(503).send('Database connection error. Please try again later.');
  });
}

function startServer() {
  const PORT = process.env.PORT || 3000;

  // Only run server when not in Vercel environment
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  }
}

// Export app for Vercel
module.exports = app;