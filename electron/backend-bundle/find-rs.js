const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = "mongodb://dbsahil:dbsahil099@ac-yiy7fcr-shard-00-01.q66shap.mongodb.net:27017/?ssl=true&authSource=admin";
const client = new MongoClient(uri);

async function run() {
    try {
        console.log('Connecting to a single member to find replica set name...');
        await client.connect();
        const isMaster = await client.db('admin').command({ isMaster: 1 });
        console.log('Replica Set Name:', isMaster.setName);
        console.log('All Members:', isMaster.hosts);
    } catch (err) {
        console.error('Failed:', err);
    } finally {
        await client.close();
    }
}

run();
