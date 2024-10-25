// Imports to handle file uploads. Code based on individual project (Abbey)
const multer = require('multer');
const { GridFsStorage } = require("multer-gridfs-storage");
const { verifyUser } = require("../models/userDatabase");

// Create an instance of GridFS Storage
const storage = new GridFsStorage({
    url: process.env.MONGODB_URL,
    file: (req, file) => {
        // Get the file extension
        const parts = file.originalname.split(".");
        console.log(parts);
        return {
            // Define how file names are formatted
            filename: `${file.originalname}`,
            bucketName: "images"
        };
    }
});

// Filter to apply to files to decide whether to upload them
async function fileFilter(req, file, cb) {


    // Make sure images are actually image files
    if (file.mimetype.split("/")[0] != "image") return cb(null, false);
    
    const user = await verifyUser(req.token);

    // Only upload the files if the user is valid
    if (user) {
        console.log("uploading the file");
        cb(null, true);
    }
    else cb(null, false);
}

// Create the upload object
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Export the upload object for use in other files
module.exports = { upload };