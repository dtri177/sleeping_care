const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail } = require("../utils/emailService");
exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.getSignIn = async (req, res) => {
  res.render('signin');
};
exports.getSignUp = async (req, res) => {
  res.render('signup')
}
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', async (err, user, info) => {
    if (err) {
      console.error("Passport error:", err);
      return res.redirect('/error');
    }
    if (!user) {
      console.error("Google authentication failed.");
      return res.redirect('/error');
    }

    try {
      const email = user.emails?.[0]?.value || user.email || user._json?.email;
      if (!email) {
        console.error("No email found in Google profile");
        return res.redirect('/error');
      }

      // Find or create user
      let existingUser = await User.findOne({ $or: [{ googleId: user.id }, { email }] });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('123', 10);
        existingUser = new User({
          googleId: user.id,
          name: user.displayName,
          email,
          password: hashedPassword,
          is_verfied: true
        });
        await existingUser.save();
      } else {
        let updated = false;
        if (!existingUser.googleId) {
          existingUser.googleId = user.id;
          updated = true;
        }
        if (!existingUser.password) {
          existingUser.password = await bcrypt.hash('123', 10);
          updated = true;
        }
        existingUser.is_verfied = true;
        if (updated) await existingUser.save();
      }

      // Ensure session is saved properly
      req.login(existingUser, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect('/error');
        }


        // Generate JWTs
        const accessToken = generateAccessToken(existingUser);
        const refreshToken = generateRefreshToken(existingUser);

        // Set cookies
        res.cookie('accessToken', accessToken, {
          httpOnly: true, // Set to true for security
          secure: true, // Change to true in production with HTTPS
          sameSite: 'Strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });

        if(existingUser.role=='admin') {
          return res.redirect('/admin');

        } else {
          return res.redirect('/');
        }
      });
    } catch (error) {
      console.error("Error processing Google login:", error);
      return res.redirect('/error');
    }
  })(req, res, next);
};

exports.logout = (req, res) => {
  try {
  
    // Clear JWT cookies
    res.clearCookie('accessToken', { path: '/', httpOnly: true, sameSite: 'Strict' });
    res.clearCookie('refreshToken', { path: '/', httpOnly: true, sameSite: 'Strict' });

    // Destroy session properly
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Logout failed");
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).send("Logout failed");
        }

        res.redirect('/');
      });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).send("Logout failed");
  }
};

// Middleware to check authentication
exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, decoded) => {
      if (err) {
          console.error("Refresh token invalid or expired");
         return res.status(403).render('errors', { message: "Refresh token expired, please log in again" });

      }

      const user = await User.findById(decoded.id);
      if (!user) {
          return res.status(403).json({ message: "User not found" });
      }

      const newAccessToken = generateAccessToken(user);

      // Set new access token in cookie
      res.cookie("accessToken", newAccessToken, {
          httpOnly: true, 
          secure: true, 
          sameSite: "Strict",
          maxAge: 15 * 60 * 1000 // 15 minutes
      });

      return res.json({ accessToken: newAccessToken });
  });
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Check if the email is verified
    if (!user.is_verfied) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true, // Set to true for security
      secure: true, // Change to true in production with HTTPS
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    if(user.role=='admin') {
      return res.redirect('/admin');

    } else {
      return res.redirect('/');
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique email verification token

    // Create user but set `isVerified` to false
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    await sendVerificationEmail(newUser.email);

    return res.status(201).json({ message: "Registration successful! Please verify your email." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    user.is_verfied = true;
    await user.save();

    res.redirect("/auth/sign-in");
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
}
res.json({ user: {
  name: req.user.name,  // Send user info (but NOT sensitive data like password)
  email: req.user.email,
}
   
});
}