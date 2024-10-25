require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
// Connect to a different database for testing
const MONGODB_URL = process.env.NODE_ENV === "test" ? process.env.TEST_MONGODB_URL : process.env.MONGODB_URL;
const MODE = process.env.NODE_ENV; // Get the environment that it is being loaded in

module.exports = {
    MONGODB_URL,
    JWT_SECRET,
    MODE
};