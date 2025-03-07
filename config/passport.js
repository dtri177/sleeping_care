const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile); // Debugging

        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email provided by Google"), null);
        }

        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
          });

          await user.save();
          console.log("New user saved:", user);
        } else {
          // If user exists but has no googleId, update it
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          console.log("Existing user found:", user);
        }

        return done(null, user);
      } catch (err) {
        console.error("Error in Google strategy:", err);
        return done(err, null);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id); // Debugging
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log("Deserializing user:", user); // Debugging

    if (!user) {
      console.error("User not found during deserialization");
      return done(null, false);
    }

    done(null, user);
  } catch (err) {
    console.error("Error in deserialization:", err);
    done(err, null);
  }
});
