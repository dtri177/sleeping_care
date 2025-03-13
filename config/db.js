const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000, // Add this to control connection timeout specifically
            retryWrites: true,
            retryReads: true,
            maxPoolSize: 10, // Control connection pool size
            minPoolSize: 2,  // Maintain minimum connections
            maxIdleTimeMS: 30000 // Close idle connections
        });
        console.log('Connected to MongoDB');
        return Promise.resolve(); // Explicitly return resolved promise on success
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return Promise.reject(error); // Return rejected promise instead of exiting
    }
};

module.exports = connectDB;