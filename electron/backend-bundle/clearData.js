require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project'); // Adjust path as needed

async function clearData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await Project.deleteMany({});
        console.log(`Deleted ${result.deletedCount} projects.`);

        mongoose.disconnect();
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

clearData();
