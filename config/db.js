const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  // Exit if no MONGO_URI is provided
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  const connectOptions = {
    serverSelectionTimeoutMS: 10000, // Increased from 5000
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    // Add additional options
    family: 4 // Force IPv4 
  };

  try {
    await mongoose.connect(process.env.MONGO_URI, connectOptions);
    console.log('Connected to MongoDB');
    
    // Set up connection error handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

module.exports = connectDB;