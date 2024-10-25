// Taken from individual project code (Abbey)
const config = require("../utils/config");
const { openMongoose, getHexID, asyncOpenMongoose } = require("../utils/mongoose");
const { getImageCard } = require("./cardDatabase");
const { getSet } = require("./setDatabase");

// Connection string
let configured = false;
let gfs;

// Configure the gridfs file connection for serving up files
async function setup() {
    return new Promise(async (resolve, reject) => {

        // If it has already been configured return it
        if (configured) return resolve(gfs);

        // Otherwise connect to the database
        else {
            const conn = await asyncOpenMongoose().createConnection(url);
            conn.once("open", async () => {

                // Create an uploads bucket
                gfs = new (await asyncOpenMongoose()).mongo.GridFSBucket(conn.db, {
                    bucketName: "images"
                });

                // Resolve the promise once the connection is established
                configured = true;
                resolve(gfs);
            });
        }
    });
}

async function getFile(id) {
    if (id.length === 24) {
        const gfs = await setup();
        const file = await gfs.find({ _id: getHexID(id) });
        return file;
    } else return undefined;
}

async function deleteFile(id) {
    if (id.length === 24) {
        const gfs = await setup();
        await gfs.deleteOne({ _id: getHexID(id) });
    }
}

// Get the set a file is in
async function getFileSet(id) {

    // Get the card the file is in
    const card = await getImageCard(id);

    // Get the set that card is in
    if (card) return await getSet(card.set);
    else return undefined;
}

// Function to close the connection
async function closeFileConnection() {
    if(config.MODE === "test") await openMongoose().disconnect();
}

// Export functions for use in other files
module.exports = {
    getFile,
    setup,
    deleteFile,
    getFileSet,
    closeFileConnection
}
