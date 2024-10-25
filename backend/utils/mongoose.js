// File to set up one mongoose connection that all files work based on
const mongoose = require("mongoose");
const config = require("../utils/config");

// Connection string
let open = false
const url = config.MONGODB_URL;

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

// Function to close the connection
async function closeMongoose() {
    if(config.MODE === "test") {
        await mongoose.disconnect();
        open = false;
    }
}

const getHexID = mongoose.Types.ObjectId.createFromHexString;

// Export functions for use in other files
module.exports = {
    openMongoose,
    closeMongoose,
    getHexID
}
