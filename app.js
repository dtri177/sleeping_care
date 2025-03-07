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
const MongoStore = require('connect-mongo');
//them 1 casi gi do de update
dotenv.config();
require('./config/passport');
const app = express();
x
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport & Session

app.use(session({
  secret: process.env.SESSION_SECRET ,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Dùng cùng URI với MongoDB Atlas
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // Session hết hạn sau 14 ngày
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Chỉ bật secure khi chạy trên HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 ngày
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

// Chỉ chạy server khi không ở môi trường Vercel
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

// Export app để Vercel xử lý
module.exports = app;
