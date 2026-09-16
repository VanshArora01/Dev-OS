const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        console.log('Attempting to connect to:', uri);
        await client.connect();
        console.log('Connected successfully to MongoDB');
    } catch (err) {
        console.error('Connection failed:');
        console.dir(err);
    } finally {
        await client.close();
    }
}

run();
