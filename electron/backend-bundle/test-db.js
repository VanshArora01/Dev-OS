const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing connection with URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('SUCCESS: Connected to MongoDB Atlas');
        process.exit(0);
    })
    .catch(err => {
        console.error('FAILURE: MongoDB connection error:');
        console.error(JSON.stringify(err, null, 2));
        console.error(err);
        process.exit(1);
    });
