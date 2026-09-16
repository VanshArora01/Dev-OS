const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('--- MongoDB Connection Debug ---');
    console.log('Using MONGO_URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'UNDEFINED');
    console.log('-------------------------------');

    // Try connecting to MongoDB using MONGODB_URI
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000, 
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4 to avoid some DNS/network resolution issues
        });
        console.log('Successfully connected to MongoDB Atlas via Mongoose');
    } catch (err) {
        console.error('Mongoose connection failed:', err.message);
        // Throw error so server knows DB connection failed
        throw err;
    }
};

module.exports = connectDB;
