// Taken from individual project code (Abbey)
const mongoose = require("mongoose");
const config = require("../utils/config");
const { getImageCard } = require("./cardDatabase");
const { getSet } = require("./setDatabase");


// Connection string
const url = config.MONGODB_URL;
let configured = false;
let gfs;

// Configure the gridfs file connection for serving up files
async function setup() {
    return new Promise((resolve, reject) => {

        // If it has already been configured return it
        if (configured) return resolve(gfs);

        // Otherwise connect to the database
        else {
            const conn = mongoose.createConnection(url);
            conn.once("open", () => {

                // Create an uploads bucket
                gfs = new mongoose.mongo.GridFSBucket(conn.db, {
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
        const file = await gfs.find({ _id: mongoose.Types.ObjectId.createFromHexString(id) });
        return file;
    } else return undefined;
}

async function deleteFile(id) {
    if (id.length === 24) {
        const gfs = await setup();
        await gfs.deleteOne({ _id: mongoose.Types.ObjectId.createFromHexString(id) });
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

// Export functions for use in other files
module.exports = {
    getFile,
    setup,
    deleteFile,
    getFileSet
}
