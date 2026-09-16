const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Project = require('./models/Project');

async function cleanDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Project.updateMany(
            { 'location.city': 'New York' },
            { $set: { 'location.city': 'Global', 'location.state': 'Earth' } }
        );

        console.log(`Successfully updated ${result.modifiedCount} projects.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

cleanDatabase();
