// File to set up one mongoose connection that all files work based on
const mongoose = require("mongoose");
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require("../utils/config");

// Connection string
let open = false
let url = config.MONGODB_URL;
let mongoServer;

// Function to establish the connection
function openMongoose() {
    if(!open) {
        // Connect to the database
        mongoose.set('strictQuery', false);
        mongoose.connect(url);
        open = true;
    }
    return mongoose;
}

async function asyncOpenMongoose() {
    if(!open) {
        mongoose.set('strictQuery', false);

        // If in test mode get the in memory server's url
        if(config.MODE === "test") {
            mongoServer = await MongoMemoryServer.create();
            url = mongoServer.getUri();
        } 

        // Connect to the database
        await mongoose.connect(url);
        open = true;
    }
    return mongoose;
}

// Function to close the connection
async function closeMongoose() {
    if(config.MODE === "test") {
        await mongoose.disconnect();
        if(mongoServer) await mongoServer.stop();
        open = false;
    }
}

const getHexID = mongoose.Types.ObjectId.createFromHexString;

// Export functions for use in other files
module.exports = {
    openMongoose,
    closeMongoose,
    getHexID,
    asyncOpenMongoose
}
