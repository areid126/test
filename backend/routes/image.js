const express = require('express');
const { verifyUser } = require('../newModels/userDatabase');
const { upload } = require('../utils/fileUpload');
const { setup, getFileSet, getFile } = require('../newModels/fileDatabase');
const ObjectId = require("mongoose").Types.ObjectId;
const router = express.Router();

router.get("/:id", async (req, res) => {

    // console.log("is it not here");


    // Get the file details from the database
    const file = await getFile(req.params.id);
    const set = await getFileSet(req.params.id);
    const user = await verifyUser(req.token);

    // console.log(set);
    // console.log(file);

    // If the file exists stream it to the user
    if (file && set && (set.public || (user && user.username === set.user))) {

        const gfs = await setup();
        // Pipe the file stream from the database to the user
        const stream = await gfs.openDownloadStream(ObjectId.createFromHexString(req.params.id));
  
        // If the file exists pipe it to the user
        if(stream) stream.pipe(res);
        else res.status(404).send(); 
    } 
    else if (set && !set.public && !user) res.status(401).send();
    else if (set && !set.public && user.username !== set.user) res.status(403).send(); 
    else res.status(404).send(); 
});

// Test endpoint for uploading files
router.post("/", upload.any(), async (req, res) => {

    // Get the file details from the database
    const user = await verifyUser(req.token);

    // Send back the id of the set if the upload was successful
    if(user && req.files && req.files[0]) res.json({id: req.files[0].id.toString()})
    else if (!user) res.status(401).send();
    else res.status(400).send();
    

});


module.exports = router;